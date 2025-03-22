import json
import os
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
from nltk.tokenize import TreebankWordTokenizer
import traceback

# Initialize the tokenizer
tokenizer = TreebankWordTokenizer()

# Function to safely load the search module after ensuring data is correctly loaded
def load_search_module():
    try:
        from similarity import build_inverted_index, compute_doc_norms, compute_idf, search
        return (build_inverted_index, compute_doc_norms, compute_idf, search)
    except Exception as e:
        print(f"Error importing search functions: {e}")
        traceback.print_exc()
        return (None, None, None, None)

# Get the directory of the current script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the path to the JSON files relative to the current script
courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')

# Load data from JSON files
try:
    with open(courses_path, 'r') as file:
        courses = json.load(file)
    with open(reviews_path, 'r') as file:
        reviews = json.load(file)
    
    print(f"Successfully loaded courses and reviews data")
    print(f"Courses count: {len(courses)}")
    print(f"Reviews count: {len(reviews)}")
except Exception as e:
    print(f"Error loading data: {str(e)}")
    print("CRITICAL: Required data files not found. Search functionality will be limited.")
    courses = {}
    reviews = {}

# Ensure description_tokens exist for all courses
for code, data in courses.items():
    if 'description_tokens' not in data or not data['description_tokens']:
        if 'description' in data and data['description']:
            # Create tokens from description
            data['description_tokens'] = tokenizer.tokenize(data['description'].lower())
            print(f"Generated tokens for {code}")
        else:
            # Create empty tokens list
            data['description_tokens'] = []
            print(f"Created empty tokens for {code}")

# Merge courses and reviews
courses_list = []
try:
    for code, data in courses.items():
        data["course_code"] = code
        data["reviews"] = reviews.get(code, [])
        courses_list.append(data)
    
    print(f"Merged {len(courses_list)} courses with their reviews")
except Exception as e:
    print(f"Error merging data: {str(e)}")
    courses_list = []

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'default-secret-key'

# Configure CORS properly - this is important for API requests from the browser
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Import search functions after data preparation
(build_inverted_index, compute_doc_norms, compute_idf, search_function) = load_search_module()

# Initialize search variables
inv_idx = {}
idf = {}
doc_norms = []

# Build inverted index and prepare for search
if build_inverted_index and compute_idf and compute_doc_norms and courses_list:
    try:
        print("Building search index...")
        inv_idx = build_inverted_index(courses_list)
        idf = compute_idf(inv_idx, len(courses_list))
        doc_norms = compute_doc_norms(inv_idx, idf, len(courses_list))
        inv_idx = {key: val for key, val in inv_idx.items() if key in idf}
        print("Successfully built search index")
    except Exception as e:
        print(f"Error building search index: {str(e)}")
        traceback.print_exc()
else:
    print("Search functions not properly loaded or no courses available. Search functionality will be limited.")

# Helper function to calculate average ratings for a course
def calculate_average_ratings(reviews):
    if not reviews:
        return {
            'avgDifficulty': 0,
            'avgWorkload': 0,
            'avgOverall': 0
        }
    
    difficulty_sum = 0
    difficulty_count = 0
    workload_sum = 0
    workload_count = 0
    overall_sum = 0
    overall_count = 0
    
    for review in reviews:
        # Handle difficulty ratings
        if 'difficulty' in review and review['difficulty'] != '-':
            try:
                difficulty_sum += int(review['difficulty'])
                difficulty_count += 1
            except (ValueError, TypeError):
                pass
        
        # Handle workload ratings
        if 'workload' in review and review['workload'] != '-':
            try:
                workload_sum += int(review['workload'])
                workload_count += 1
            except (ValueError, TypeError):
                pass
        
        # Handle overall ratings
        if 'overall' in review and review['overall'] != '-':
            try:
                overall_sum += int(review['overall'])
                overall_count += 1
            except (ValueError, TypeError):
                pass
    
    return {
        'avgDifficulty': difficulty_sum / difficulty_count if difficulty_count > 0 else 0,
        'avgWorkload': workload_sum / workload_count if workload_count > 0 else 0,
        'avgOverall': overall_sum / overall_count if overall_count > 0 else 0
    }

# Simple search function if vector search is not available
def simple_search(query, courses):
    """Fallback search function that uses basic string matching"""
    query = query.lower()
    results = []
    
    for idx, course in enumerate(courses):
        score = 0
        
        # Check course code
        if 'course_code' in course and query in course['course_code'].lower():
            score += 10
            
        # Check course title    
        if 'course title' in course and query in course['course title'].lower():
            score += 5
            
        # Check description
        if 'description' in course and query in course['description'].lower():
            score += 3
            
        if score > 0:
            results.append((score, idx))
            
    # Sort by score (descending)
    results.sort(reverse=True, key=lambda x: x[0])
    return results

# Home route
@app.route("/")
def index():
    return render_template('index.html')

# Search page route
@app.route("/search")
def search_page():
    query = request.args.get('q', '')
    return render_template('search.html', query=query)

# API route for course search
@app.route("/api/search", methods=["GET"])
def api_search():
    try:
        query = request.args.get('q', '')
        
        if not query:
            return jsonify([])
        
        if not courses_list:
            return jsonify({"error": "No course data available. Please ensure the required data files are present."}), 500
        
        print(f"API Search: Searching for: {query}")
        
        search_results = []
        
        # Use vector space model search if available
        if search_function and inv_idx and idf is not None and doc_norms is not None and len(doc_norms) > 0:
            try:
                search_results = search_function(query, inv_idx, idf, doc_norms)
            except Exception as e:
                print(f"Error in vector search: {e}")
                traceback.print_exc()
                # Fall back to simple search
                search_results = simple_search(query, courses_list)
        else:
            # Use simple search as fallback
            print("Using simple search fallback")
            search_results = simple_search(query, courses_list)
        
        if not search_results:
            print("No search results found")
            return jsonify([])
            
        # Get top results
        top_results = search_results[:10]  # Get top 20 results
        
        # Convert search results to course objects
        result = []
        for score, idx in top_results:
            if idx < len(courses_list):
                result.append(courses_list[idx])
            else:
                print(f"Invalid index {idx} (out of range)")
        
        print(f"Found {len(result)} results")
        
        # Format the results to avoid serialization issues
        formatted_results = []
        for course in result:
            try:
                # Remove tokens to avoid serialization issues
                course_copy = course.copy()
                if "description_tokens" in course_copy:
                    del course_copy["description_tokens"]
                    
                # Add calculated ratings
                ratings = calculate_average_ratings(course_copy.get("reviews", []))
                course_copy.update(ratings)
                    
                formatted_results.append(course_copy)
            except Exception as e:
                print(f"Error formatting course: {e}")
        
        return jsonify(formatted_results)
    
    except Exception as e:
        print(f"Error in api_search: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Class details page route
@app.route("/class/<class_id>")
def class_details(class_id):
    # Get the data parameter if it exists
    passed_data = request.args.get('data')
    
    if passed_data:
        try:
            # Parse the JSON data
            class_data = json.loads(passed_data)
            return render_template('class_details.html', class_data=class_data)
        except Exception as e:
            print(f"Error parsing passed data: {e}")
    
    # If no data was passed or parsing failed, load it from the data
    original_class_id = class_id.replace('-', ' ')
    
    # Find the course in our data
    course_info = None
    for course in courses_list:
        if course.get("course_code") == original_class_id:
            course_info = course
            break
    
    if course_info:
        # Remove tokens to avoid serialization issues
        if "description_tokens" in course_info:
            course_info_clean = course_info.copy()
            del course_info_clean["description_tokens"]
        else:
            course_info_clean = course_info
            
        # Calculate average ratings
        ratings = calculate_average_ratings(course_info_clean.get("reviews", []))
        
        class_data = {
            'id': course_info_clean['course_code'],
            'classCode': course_info_clean['course_code'],
            'title': course_info_clean.get('course title', 'No Title'),
            'description': course_info_clean.get('description', 'No description available'),
            'semester': course_info_clean.get('term_offered', []),
            'distribution': course_info_clean.get('distributions', []),
            'reviews': course_info_clean.get('reviews', []),
            **ratings
        }
        
        return render_template('class_details.html', class_data=class_data)
    else:
        # Course not found
        return render_template('class_details.html', error="Course not found. Please check the course ID.")

# Test route to check if the API is working
@app.route("/api/test")
def api_test():
    return jsonify({
        "status": "ok", 
        "message": "API is working correctly",
        "search_available": search_function is not None,
        "courses_count": len(courses_list),
        "index_size": len(inv_idx) if inv_idx else 0
    })

# Run the Flask app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    print(f"Starting Flask server on port {port} with debug={debug}")
    app.run(debug=debug, host="0.0.0.0", port=port)