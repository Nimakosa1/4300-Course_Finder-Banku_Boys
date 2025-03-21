import json
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from nltk.tokenize import TreebankWordTokenizer
from similarity import build_inverted_index, compute_doc_norms, compute_idf, accumulate_dot_scores, search

tokenizer = TreebankWordTokenizer()

os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..", os.curdir))

current_directory = os.path.dirname(os.path.abspath(__file__))

courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')

try:
    with open(courses_path, 'r') as file:
        courses = json.load(file)
    with open(reviews_path, 'r') as file:
        reviews = json.load(file)
    
 
except Exception as e:
    print(f"Error loading data: {str(e)}")
    courses = {}
    reviews = {}

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

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5001", "https://your-production-domain.com"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
}, supports_credentials=True)

try:
    inv_idx = build_inverted_index(courses_list)
    idf = compute_idf(inv_idx, len(courses_list))
    doc_norms = compute_doc_norms(inv_idx, idf, len(courses_list))
    inv_idx = {key: val for key, val in inv_idx.items() if key in idf}
    print("Successfully built search index")
except Exception as e:
    print(f"Error building search index: {str(e)}")
    inv_idx = {}
    idf = {}
    doc_norms = {}

# Simple function to perform search
def json_search(query, inv_idx, idf, doc_norms):
    try:
        res = search(query, inv_idx, idf, doc_norms)
        return res
    except Exception as e:
        print(f"Error in search function: {str(e)}")
        return []

# Debug route to check if Flask is running
@app.route("/test", methods=["GET"])
def test():
    return jsonify({"status": "ok", "message": "Flask server is running"})

# Course search endpoint
@app.route("/get/courses", methods=["POST"])
def courses_search():
    try:
        request_json = request.get_json()
        print("Request JSON:", request_json)
        
        if not request_json:
            print("No JSON data in request")
            return jsonify({"error": "No JSON data in request"}), 400
        
        query = request_json.get("query")
        
        if not query:
            print("No query provided")
            return jsonify([])
        
        print(f"Searching for: {query}")
        
        query_token = tokenizer.tokenize(query)
        print(f"Tokenized query: {query_token}")
        
        if len(inv_idx) == 0:
            print("Search index not properly initialized")
            return jsonify({"error": "Search index not properly initialized"}), 500
        
        search_results = json_search(query, inv_idx, idf, doc_norms)
        
        if len(search_results) == 0:
            print("No search results found")
            return jsonify([])
            
        top_results = search_results[:10]
        
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
            # Remove tokens to avoid serialization issues
            course_copy = course.copy()
            if "description_tokens" in course_copy:
                del course_copy["description_tokens"]
                
            formatted_results.append(course_copy)
        
        return jsonify(formatted_results)
    
    except Exception as e:
        print(f"Error in courses_search: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Serve frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join('../frontend/out', path)):
        return send_from_directory(os.path.join('../frontend/out'), path)
    else:
        return send_from_directory(os.path.join('../frontend/out'), 'index.html')

# Run the Flask app
if __name__ == '__main__':
    if 'DB_NAME' not in os.environ:
        print("Starting Flask server on port 5001...")
        app.run(debug=True, host="0.0.0.0", port=5001)
    else:
        print("Running in production mode...")
