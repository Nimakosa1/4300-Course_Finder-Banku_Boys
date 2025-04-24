import json
import os
from transformers import pipeline

# Load and reverse course sentiment scores
def load_course_sentiments(path="review_sentiments.json"):
    with open(path, 'r') as f:
        raw_scores = json.load(f)

    return raw_scores

# Load query sentiment pipeline
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

def get_query_sentiment(query):
    try:
        result = sentiment_pipeline(query[:512])[0]
        score = result["score"]
        return score if result["label"] == "POSITIVE" else -score
    except Exception as e:
        print(f"Sentiment analysis failed: {e}")
        return 0  # neutral fallback

def adjust_bert_scores_with_sentiment(query_sentiment, course_sentiments, bert_results, course_codes, alpha=0.3):
    rescored = []
    for sim_score, idx in bert_results:
        if idx < len(course_codes):
            code = course_codes[idx]
            course_sent = course_sentiments.get(code, 0)
            alignment = 1 - alpha * abs(query_sentiment - course_sent)
            new_score = sim_score * alignment
            rescored.append((new_score, idx))
    return rescored