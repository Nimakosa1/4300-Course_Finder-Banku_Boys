import json
import os
from flask import Flask, render_template, request
from flask_cors import CORS
from helpers.MySQLDatabaseHandler import MySQLDatabaseHandler
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from similarity import build_inverted_index, compute_doc_norms, compute_idf, accumulate_dot_scores, search


from nltk.tokenize import TreebankWordTokenizer

# Initialize the tokenizer
tokenizer = TreebankWordTokenizer()

# ROOT_PATH for linking with all your files. 
# Feel free to use a config.py or settings.py with a global export variable
os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..",os.curdir))

# Get the directory of the current script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the path to the JSON file relative to the current script
json_file_path = os.path.join(current_directory, 'init.json')
courses_path = os.path.join(current_directory, 'courses_w_tokens.json')
reviews_path = os.path.join(current_directory, 'course_reviews.json')

# Assuming your JSON data is stored in a file named 'init.json'
with open(courses_path, 'r') as file:
    courses = json.load(file)
with open(reviews_path, 'r') as file:
    reviews = json.load(file)  

# merge coures and reviews
for code, data in courses.items():
    courses[code]["course_code"] = code
    courses[code]["reviews"] = reviews[code]
courses = [val for key, val in courses.items()]

app = Flask(__name__)
CORS(app)


inv_idx = build_inverted_index(courses)
idf = compute_idf(inv_idx, len(courses))
doc_norms = compute_doc_norms(inv_idx, idf, len(courses))
inv_idx = {key: val for key, val in inv_idx.items() if key in idf}

def getDescriptions(course_data):
    descriptions = []
    
    for course, data in course_data.items():
        descriptions.append(data["description"])
    return descriptions

def json_search(query, inv_idx, idf, doc_norms):

    res = search(query, inv_idx, idf, doc_norms)
    return res


@app.route("/")
def home():
    return render_template('base.html',title="sample html")

@app.route("/get/courses", methods = ["POST"])
def courses_search():
    data = request.get_json().get("query")
    query_token = tokenizer.tokenize(data)
    
    res = json_search(data, inv_idx, idf, doc_norms)[:10] # get top 10 results
    # result = [{"score": score, "courses": courses[idx]["course_code"]} for score, idx in res]
    result = [courses[idx] for score, idx in res]
    for idx, course in enumerate(result):
        del course["description_tokens"]
        result[idx] = course
    return result

if 'DB_NAME' not in os.environ:
    app.run(debug=True,host="0.0.0.0",port=5001)