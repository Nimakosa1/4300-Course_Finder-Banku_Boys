import json
import os
import joblib
from sentence_transformers import SentenceTransformer

# Set paths
base_path = os.path.dirname(os.path.abspath(__file__))
courses_path = os.path.join(base_path, "courses_w_tokens.json")
output_path = os.path.join(base_path, "bert_title_embeddings.joblib")

# Load courses
with open(courses_path, "r") as f:
    courses = json.load(f)

# Prepare course titles and codes
titles = []
course_codes = []

for code, data in courses.items():
    title = data.get("course title") or data.get("title")
    if title:
        titles.append(title)
        course_codes.append(code)

# Load BERT model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Generate embeddings for titles
title_embeddings = model.encode(titles, show_progress_bar=True)

# Save course codes and embeddings
joblib.dump((course_codes, title_embeddings), output_path)
print(f"Saved title embeddings to {output_path}")