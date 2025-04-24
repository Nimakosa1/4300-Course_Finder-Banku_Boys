import json
import os
from flask import Flask, request, jsonify, send_from_directory,render_template
from flask_cors import CORS
from nltk.tokenize import TreebankWordTokenizer
import traceback
from similarity import build_inverted_index, compute_doc_norms, compute_idf, search, build_semantic_search, semantic_search, stop_words, punctuation
import numpy as np
from sentence_transformers import SentenceTransformer
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from sentiment_utils import load_course_sentiments, get_query_sentiment, adjust_bert_scores_with_sentiment

tokenizer = TreebankWordTokenizer()

def load_search_module():
    try:
        return (build_inverted_index, compute_doc_norms, compute_idf, search, build_semantic_search, semantic_search)
    except Exception as e:
        print(f"Error accessing search functions: {e}")
        traceback.print_exc()
        return (None, None, None, None, None, None)

current_directory = os.path.dirname(os.path.abspath(__file__))

courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')

try:
    print("Loading BERT embeddings...")
    course_codes, bert_embeddings = joblib.load("bert_embeddings.joblib")
    title_course_codes, title_embeddings = joblib.load("bert_title_embeddings.joblib")
    bert_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Successfully loaded BERT embeddings")
except Exception as e:
    print("Error loading BERT embeddings:", e)
    bert_embeddings = None
    course_codes = []
    bert_model = None
    
#Get course sentiments   
course_sentiments = load_course_sentiments()

try:
    with open("scaled_sentiment_scores.json", "r") as f:
        scaled_sentiments = json.load(f)
except:
    print("failed to get scaled_sentiments")
    scaled_sentiments = {}

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

for code, data in courses.items():
    if 'description_tokens' not in data or not data['description_tokens']:
        if 'description' in data and data['description']:
            data['description_tokens'] = tokenizer.tokenize(data['description'].lower())
            print(f"Generated tokens for {code}")
        else:
            data['description_tokens'] = []
            print(f"Created empty tokens for {code}")

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

STATIC_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'react-frontend', 'static'))


app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'default-secret-key'

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000","http://127.0.0.1:5001", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://4300showcase.infosci.cornell.edu:5239" ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

(build_inverted_index, compute_doc_norms, compute_idf, search_function, build_semantic_search, semantic_search) = load_search_module()

inv_idx = {}
idf = {}
doc_norms = []

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

# Initialize semantic search variables
vectorizer = None
svd = None
X_reduced = None

try:
    print("Building semantic search index...")
    vectorizer, svd, X_reduced = build_semantic_search(courses_list, tokenizer)
    print("Successfully built semantic search index")
except Exception as e:
    print(f"Error building semantic search index: {str(e)}")
    traceback.print_exc()

def compute_keyword_scores(query, inv_idx, idf, doc_norms, tokenizer, stop_words, punctuation):
    query_token = tokenizer.tokenize(query.lower())
    query_token = [t for t in query_token if t.lower() not in stop_words and t not in punctuation]
    
    q_counts = {}
    for q in query_token:
        q_counts[q] = q_counts.get(q, 0) + 1

    from similarity import accumulate_dot_scores
    dot_scores, _ = accumulate_dot_scores(q_counts, inv_idx, idf)
    
    q_tf_idf = {word: count * idf.get(word, 0) for word, count in q_counts.items()}
    q_norm = np.sqrt(sum(value ** 2 for value in q_tf_idf.values()))

    doc_score_lookup = {}
    for doc_id, numerator in dot_scores.items():
        denominator = q_norm * doc_norms[doc_id]
        if denominator:
            score = numerator / denominator
            doc_score_lookup[doc_id] = score

    return doc_score_lookup

# SVD topic matching words function
def get_svd_matching_words(query, course_description, vectorizer, svd, tokenizer, top_n_topics=5, top_n_words=10):
    if not vectorizer or not svd:
        return []

    query_vec = vectorizer.transform([query])
    query_reduced = svd.transform(query_vec)[0]
    top_topic_indices = query_reduced.argsort()[::-1][:top_n_topics]

    terms = vectorizer.get_feature_names_out()
    components = svd.components_

    top_topic_words = set()
    for topic_idx in top_topic_indices:
        word_weights = components[topic_idx]
        top_indices = word_weights.argsort()[::-1][:top_n_words]
        for i in top_indices:
            top_topic_words.add(terms[i])

    # Tokenize course description
    course_tokens = tokenizer.tokenize(course_description.lower())
    filtered_tokens = [t for t in course_tokens if t not in stop_words and t not in punctuation]

    # Match topic words in the course description
    matched_words = [word for word in filtered_tokens if word in top_topic_words]
    return list(set(matched_words))

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
        if 'difficulty' in review and review['difficulty'] != '-':
            try:
                difficulty_sum += int(review['difficulty'])
                difficulty_count += 1
            except (ValueError, TypeError):
                pass
        
        if 'workload' in review and review['workload'] != '-':
            try:
                workload_sum += int(review['workload'])
                workload_count += 1
            except (ValueError, TypeError):
                pass
        
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

def bert_search(query, top_k=10):
    query_embedding = bert_model.encode([query])
    similarities = cosine_similarity(query_embedding, bert_embeddings)[0]
    top_indices = similarities.argsort()[::-1][:top_k]
    results = [(similarities[i], i) for i in top_indices]
    return results

def get_bert_title_similarity_scores(query, top_k=10):
    query_vec = bert_model.encode([query])
    sims = cosine_similarity(query_vec, title_embeddings)[0]
    score_map = {code: sim for code, sim in zip(title_course_codes, sims)}
    return score_map

def simple_search(query, courses):
    """Fallback search function that uses basic string matching"""
    query = query.lower()
    results = []
    
    for idx, course in enumerate(courses):
        score = 0
        
        if 'course_code' in course and query in course['course_code'].lower():
            score += 10
            
        if 'course title' in course and query in course['course title'].lower():
            score += 5
            
        if 'description' in course and query in course['description'].lower():
            score += 3
            
        if score > 0:
            results.append((score, idx))
            
    results.sort(reverse=True, key=lambda x: x[0])
    return results


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
        
        #Get query sentiment
        query_sentiment = get_query_sentiment(query)
        
        # Use semantic search if available
        # if vectorizer and svd and X_reduced is not None:
        #     print("Using semantic search")
        #     search_results = semantic_search(query, vectorizer, svd, X_reduced, courses_list, tokenizer, 20)
        if bert_model and bert_embeddings is not None:
            print("Using BERT semantic search")
            search_results = bert_search(query, 20)
        else:
            # Use vector space model search if available
            if search_function and inv_idx and idf is not None and doc_norms is not None and len(doc_norms) > 0:
                try:
                    search_results = search_function(query, inv_idx, idf, doc_norms)
                except Exception as e:
                    print(f"Error in vector search: {e}")
                    traceback.print_exc()
                    search_results = simple_search(query, courses_list)
            else:
                print("Using simple search fallback")
                search_results = simple_search(query, courses_list)
        
               # Compute keyword search results and scores for top results
        keyword_search_results = search_function(query, inv_idx, idf, doc_norms)
        keyword_score_map = {idx: round(score * 100, 0) for score, idx, *_ in keyword_search_results}
        title_score_map = get_bert_title_similarity_scores(query)
            
        if not search_results:
            print("No search results found")
            return jsonify([])
        
        # Adjust scores based on number of reviews
        def adjusted_score(score, course):
            review_count = len(course.get("reviews", []))
            return score * (1 + np.log1p(review_count))

        ##### <------Deprecated------>
        # rescored = []
        # for item in search_results:
        #     score, idx = item[0], item[1]
        #     if idx < len(courses_list):
        #         course = courses_list[idx]
        #         new_score = adjusted_score(score, course)
        #         rescored.append((new_score, idx))
        
        # Readjust scores using sentiment from queries
        rescored = adjust_bert_scores_with_sentiment(query_sentiment, course_sentiments, search_results, course_codes, alpha=0.3)
        top_results = sorted(rescored, key=lambda x: -x[0])[:10]
            
        # Convert search results to course objects
        result = []
        seen_descriptions = set()
        for item in top_results:
            # Each item should be (score, idx)
            score, idx = item
            if idx < len(courses_list):
                course = courses_list[idx]
                description = course.get("description")
                if description and description not in seen_descriptions:
                    seen_descriptions.add(description)
                    result.append((course, round(score, 4)))
            else:
                print(f"Invalid index {idx} (out of range)")
        
        print(f"Found {len(result)} results")
        
        formatted_results = []
        for course, similarity_score in result:
            try:
                course_copy = course.copy()
                if "description_tokens" in course_copy:
                    del course_copy["description_tokens"]
                    
                ratings = calculate_average_ratings(course_copy.get("reviews", []))
                course_copy.update(ratings)
                course_code = course_copy.get("course_code")
                
                course_copy["sentiment_score"] = scaled_sentiments.get(course_code, 50)
                
                course_copy["BERT_similarity_score"] = round(similarity_score * 100, 0)
                
                idx = next((i for i, c in enumerate(courses_list) if c.get("course_code") == course_copy.get("course_code")), None)
                course_copy["keyword_score"] = keyword_score_map.get(idx, 0)
                
                raw_score = title_score_map.get(course_code, 0)
                course_copy["BERT_title_similarity_score"] = round(raw_score * 100, 0)

                # Add SVD topic words matching
                course_copy["svd_top_words"] = get_svd_matching_words(
                    query,
                    course_copy.get("description", ""),
                    vectorizer,
                    svd,
                    tokenizer
                )
                
                formatted_results.append(course_copy)
            except Exception as e:
                print(f"Error formatting course: {e}")
        
        return jsonify(formatted_results)
    
    except Exception as e:
        print(f"Error in api_search: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/course/<course_id>", methods=["GET"])
def api_get_course(course_id):
    try:
        original_course_id = course_id.replace('-', ' ')
        
        course_info = None
        for course in courses_list:
            if course.get("course_code") == original_course_id:
                course_info = course
                break
        
        if not course_info:
            return jsonify({"error": "Course not found"}), 404
            
        if "description_tokens" in course_info:
            course_info_clean = course_info.copy()
            del course_info_clean["description_tokens"]
        else:
            course_info_clean = course_info
            
        ratings = calculate_average_ratings(course_info_clean.get("reviews", []))
        course_info_clean.update(ratings)
        
        return jsonify(course_info_clean)
        
    except Exception as e:
        print(f"Error getting course: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/get_courses", methods=["GET"])
def api_get_courses():
    final_courses = []
    for course_info in courses_list:
        if "description_tokens" in course_info:
            course_info_clean = course_info.copy()
            del course_info_clean["description_tokens"]
            final_courses.append(course_info_clean)
        else:
            final_courses.append(course_info)

    response = {
        "courses": final_courses,
        "keywords": []  
    }

    return jsonify(response)

@app.route("/api/test")
def api_test():
    return jsonify({
        "status": "ok", 
        "message": "API is working correctly",
        "search_available": search_function is not None,
        "courses_count": len(courses_list),
        "index_size": len(inv_idx) if inv_idx else 0
    })

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def serve_react(path):
#     print(f"Requested path: {path}")
    
#     # First try to serve as a static file
#     static_file_path = os.path.join(app.static_folder, path)
#     if path and os.path.isfile(static_file_path):
#         return send_from_directory(app.static_folder, path)
    
#     # Otherwise return index.html for client-side routing
#     return send_from_directory(app.static_folder, 'index.html')


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search_page():
    query = request.args.get('q', '')
    return render_template('search.html', query=query)

@app.route('/class/<course_id>')
def class_details(course_id):
    try:
        # Check if data was passed via URL parameter
        data_param = request.args.get('data')
        if data_param:
            # Parse the JSON data
            class_data = json.loads(data_param)
        else:
            # Otherwise get course data from API
            original_course_id = course_id.replace('-', ' ')
            
            course_info = None
            for course in courses_list:
                if course.get("course_code") == original_course_id:
                    course_info = course
                    break
            
            if not course_info:
                return render_template('class_details.html', error="Course not found", class_data=None)
            
            # Format the data for the template
            ratings = calculate_average_ratings(course_info.get("reviews", []))
            
            class_data = {
                'id': course_info.get('course_code'),
                'classCode': course_info.get('course_code'),
                'title': course_info.get('course title') or course_info.get('title') or 'No Title',
                'description': course_info.get('description') or '',
                'semester': course_info.get('term_offered') or [],
                'distribution': course_info.get('distributions') or [],
                'reviews': course_info.get('reviews') or [],
                'avgDifficulty': ratings.get('avgDifficulty', 0),
                'avgWorkload': ratings.get('avgWorkload', 0),
                'avgOverall': ratings.get('avgOverall', 0),
            }
        
        return render_template('class_details.html', class_data=class_data)
    except Exception as e:
        print(f"Error rendering class details: {str(e)}")
        traceback.print_exc()
        return render_template('class_details.html', error=f"Error loading course: {str(e)}", class_data=None)
    

if __name__ == '__main__':
    if os.path.exists('/etc/hostname') and '4300showcase.infosci.cornell.edu' in open('/etc/hostname').read():
        port = 5239
    else:
        port = int(os.environ.get('PORT', 5001))
    
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    print(f"Starting Flask server on port {port} with debug={debug}")
    app.run(debug=debug, host="0.0.0.0", port=port)