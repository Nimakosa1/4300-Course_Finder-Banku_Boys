from sentence_transformers import SentenceTransformer
import numpy as np
import json
import joblib

# Load your course data
with open("courses_w_tokens.json") as f:
    courses = json.load(f)

# Prepare descriptions
descriptions = []
course_codes = []

for code, data in courses.items():
    if "description" in data and data["description"]:
        descriptions.append(data["description"])
        course_codes.append(code)

# Load Sentence-BERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Encode all descriptions
embeddings = model.encode(descriptions, show_progress_bar=True)

# Save as compressed file
joblib.dump((course_codes, embeddings), "bert_embeddings.joblib")
print("Saved BERT embeddings to file.")