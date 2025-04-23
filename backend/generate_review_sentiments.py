import json
import os
from transformers import pipeline

base_path = os.path.dirname(os.path.abspath(__file__))
reviews_path = os.path.join(base_path, 'course_reviews.json')
output_path = os.path.join(base_path, 'review_sentiments.json')

with open(reviews_path, 'r') as f:
    course_reviews = json.load(f)

classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

course_sentiments = {}

for course_code, reviews in course_reviews.items():
    scores = []
    for review in reviews:
        text = review.get("comment", "").strip()
        if text:
            result = classifier(text[:512])[0]  # limit to 512 tokens
            score = result["score"] if result["label"] == "POSITIVE" else -result["score"]
            scores.append(score)
    if scores:
        avg_score = sum(scores) / len(scores)
    else:
        avg_score = 0.0
    course_sentiments[course_code] = avg_score

with open(output_path, 'w') as f:
    json.dump(course_sentiments, f, indent=2)

print(f"Saved transformer-based sentiment scores to {output_path}")