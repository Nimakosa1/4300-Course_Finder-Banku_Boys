import json
import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from nltk.tokenize import TreebankWordTokenizer
from similarity import build_inverted_index, compute_doc_norms, compute_idf, search
import subprocess
import threading
import time
import signal

# Force production mode if not set externally
os.environ.setdefault('FLASK_ENV', 'production')

# Ensure NEXTJS_URL is set early before Flask route registration
os.environ.setdefault('NEXTJS_URL', 'http://4300showcase.infosci.cornell.edu:5239')

tokenizer = TreebankWordTokenizer()
current_directory = os.path.dirname(os.path.abspath(__file__))

courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')
frontend_dir = os.path.join(current_directory, '..', 'frontend')
frontend_build_path = os.path.join(frontend_dir, '.next')

# Load course and review data
try:
    with open(courses_path, 'r') as file:
        courses = json.load(file)
    with open(reviews_path, 'r') as file:
        reviews = json.load(file)
    print("Loaded courses and reviews data")
except Exception as e:
    print(f"Error loading data: {str(e)}")
    courses = {}
    reviews = {}

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
app = Flask(__name__, static_folder=frontend_build_path)
CORS(app, resources={r"/api/*": {"origins": "*"}, r"/get/*": {"origins": "*"}}, supports_credentials=True)

# Build search index
try:
    inv_idx = build_inverted_index(courses_list)
    idf = compute_idf(inv_idx, len(courses_list))
    doc_norms = compute_doc_norms(inv_idx, idf, len(courses_list))
    inv_idx = {key: val for key, val in inv_idx.items() if key in idf}
    print("Successfully built search index")
except Exception as e:
    print(f"Error building search index: {str(e)}")
    inv_idx, idf, doc_norms = {}, {}, {}

# Search helper
def json_search(query, inv_idx, idf, doc_norms):
    try:
        return search(query, inv_idx, idf, doc_norms)
    except Exception as e:
        print(f"Error in search function: {str(e)}")
        return []

@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"status": "ok", "message": "Flask server is running"})

@app.route("/api/courses/search", methods=["POST"])
def courses_search():
    try:
        request_json = request.get_json()
        if not request_json:
            return jsonify({"error": "No JSON data in request"}), 400

        query = request_json.get("query")
        if not query:
            return jsonify([])

        query_token = tokenizer.tokenize(query)
        if len(inv_idx) == 0:
            return jsonify({"error": "Search index not initialized"}), 500

        search_results = json_search(query, inv_idx, idf, doc_norms)
        top_results = search_results[:10]

        result = []
        for score, idx in top_results:
            if idx < len(courses_list):
                course_copy = courses_list[idx].copy()
                course_copy.pop("description_tokens", None)
                result.append(course_copy)

        return jsonify(result)

    except Exception as e:
        print(f"Error in courses_search: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/get/courses", methods=["POST"])
def get_courses():
    return courses_search()

@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(path):
    if path == 'courses/search':
        return courses_search()
    return jsonify({"error": "API endpoint not found"}), 404

def run_nextjs():
    try:
        print("Building Next.js app...")
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)

        print("Starting Next.js server...")
        nextjs_process = subprocess.Popen(
            ["npm", "start"],
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )

        def print_nextjs_output():
            for line in iter(nextjs_process.stdout.readline, ''):
                print(f"NEXT.JS: {line}", end='')

        threading.Thread(target=print_nextjs_output, daemon=True).start()
        return nextjs_process

    except Exception as e:
        print(f"Error starting Next.js: {e}")
        return None

def deploy_app():
    port = int(os.environ.get('PORT', 5001))
    nextjs_process = run_nextjs()

    if not nextjs_process:
        print("Failed to start Next.js server")
        sys.exit(1)

    def signal_handler(sig, frame):
        print("\nShutting down servers...")
        if nextjs_process:
            nextjs_process.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    from waitress import serve
    print(f"Starting Flask server on port {port}...")
    serve(app, host="0.0.0.0", port=port)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_nextjs(path):
    if path.startswith('api/'):
        return app.view_functions.get(request.endpoint)()

    flask_env = os.getenv('FLASK_ENV')
    if flask_env == 'production':
        nextjs_url = os.environ.get('NEXTJS_URL', '')
        if not nextjs_url:
            return """
            <html><body>
            <h1>Frontend Configuration Needed</h1>
            <p>Set NEXTJS_URL or configure a reverse proxy.</p>
            </body></html>
            """
    else:
        nextjs_url = 'http://localhost:3000'

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

if __name__ == '__main__':
    if os.getenv('FLASK_ENV') != 'production':
        print("Starting Flask server in development mode on port 5001...")
        run_nextjs()
        app.run(debug=True, host="0.0.0.0", port=5001)
    else:
        print("Running in production mode...")
        deploy_app()


