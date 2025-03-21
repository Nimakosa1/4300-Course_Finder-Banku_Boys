import json
import os
import sys
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from nltk.tokenize import TreebankWordTokenizer
from similarity import build_inverted_index, compute_doc_norms, compute_idf, accumulate_dot_scores, search
import subprocess
import threading
import time
import signal

tokenizer = TreebankWordTokenizer()

os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..", os.curdir))

current_directory = os.path.dirname(os.path.abspath(__file__))

courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')

# Path to Next.js build directory - using .next for server-side rendering
frontend_dir = os.path.join(current_directory, '..', 'frontend')
frontend_build_path = os.path.join(frontend_dir, '.next')

try:
    with open(courses_path, 'r') as file:
        courses = json.load(file)
    with open(reviews_path, 'r') as file:
        reviews = json.load(file)
    
    print(f"Loaded courses and reviews data")
 
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

# Create Flask app 
app = Flask(__name__, static_folder=frontend_build_path)

# Enable CORS for API routes only
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/get/*": {"origins": "*"}}, supports_credentials=True)

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
@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"status": "ok", "message": "Flask server is running"})

# Course search endpoint
@app.route("/api/courses/search", methods=["POST"])
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

# Legacy endpoint for compatibility
@app.route("/get/courses", methods=["POST"])
def get_courses():
    return courses_search()

# Proxy route for API calls in production
@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(path):
    # This function will forward API requests to the appropriate handler
    if path == 'courses/search':
        return courses_search()
    # Add more API endpoints as needed
    return jsonify({"error": "API endpoint not found"}), 404

# Function to run Next.js in production
def run_nextjs():
    try:
        # Build Next.js app
        print("Building Next.js app...")
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        
        # Start Next.js server
        print("Starting Next.js server...")
        nextjs_process = subprocess.Popen(
            ["npm", "start"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Print Next.js output
        def print_nextjs_output():
            for line in iter(nextjs_process.stdout.readline, ''):
                print(f"NEXT.JS: {line}", end='')
        
        threading.Thread(target=print_nextjs_output, daemon=True).start()
        
        return nextjs_process
    
    except Exception as e:
        print(f"Error starting Next.js: {e}")
        return None

# Deployment handler
def deploy_app():
    # Start Next.js server
    os.environ['NEXTJS_URL'] = 'http://4300showcase.infosci.cornell.edu:5239'

    nextjs_process = run_nextjs()
    
    if not nextjs_process:
        print("Failed to start Next.js server")
        sys.exit(1)
    
    # Get the port from environment variable or default to 5001
    port = int(os.environ.get('PORT', 5001))
    
    # Set up clean termination handler
    def signal_handler(sig, frame):
        print("\nShutting down servers...")
        if nextjs_process:
            nextjs_process.terminate()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start Flask with Waitress
    try:
        from waitress import serve
        print(f"Starting Flask server on port {port}...")
        serve(app, host="0.0.0.0", port=port)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        if nextjs_process:
            nextjs_process.terminate()
        sys.exit(0)

# Create a route to serve Next.js pages in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
# def serve_nextjs(path):
#     if path.startswith('api/'):
#         # Let Flask handle API routes
#         return app.view_functions.get(request.endpoint)()
    
#     # For all other routes, proxy to Next.js server
#     return jsonify({
#         "message": "This path should be handled by Next.js server",
#         "path": path,
#         "info": "In production, configure a reverse proxy to route non-API traffic to Next.js"
#     })

def serve_nextjs(path):
    if path.startswith('api/'):
        # Let Flask handle API routes
        return app.view_functions.get(request.endpoint)()
    
    # Check if we're in production or development
    if os.getenv('FLASK_ENV') == 'production':
        # In production, get the Next.js URL from an environment variable
        # If not set, use a relative URL scheme that works with a reverse proxy
        nextjs_url = os.environ.get('NEXTJS_URL', '')
        
        if not nextjs_url:
            # If no URL is specified, assume we're behind a reverse proxy
            # Return a message explaining how to configure this
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Configuration Needed</title>
            </head>
            <body>
                <h1>Frontend Configuration Needed</h1>
                <p>This route ({path}) should be handled by the Next.js frontend.</p>
                <p>To fix this, either:</p>
                <ol>
                    <li>Set the NEXTJS_URL environment variable to point to your Next.js server</li>
                    <li>Configure a reverse proxy (like Nginx) to route non-API traffic to your Next.js server</li>
                </ol>
            </body>
            </html>
            """
    else:
        # In development, redirect to localhost:3000
        nextjs_url = 'http://localhost:3000'
    
    # Redirect to the Next.js server
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to Application</title>
        <meta http-equiv="refresh" content="0;URL='{nextjs_url}/{path}'">
    </head>
    <body>
        <p>Redirecting to <a href="{nextjs_url}/{path}">{nextjs_url}/{path}</a>...</p>
    </body>
    </html>
    """

# Run the Flask app
if __name__ == '__main__':
    if os.getenv('FLASK_ENV') != 'production':
        # Development mode
        print("Starting Flask server in development mode on port 5001...")
        run_nextjs()
        app.run(debug=True, host="0.0.0.0", port=5001)
    else:
        # Production mode
        print("Running in production mode...")
        deploy_app()