import json 
import os

base_path = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(base_path, "scaled_sentiment_scores.json")
filename = "review_sentiments.json"
with open(filename, 'r') as f:
    course_sentiments = json.load(f)
    

def scale_review_score(score):
    if score is None:
        return 0
    elif score < 0:
        return max(0, round(49 * (score + 1)))
    else:
        return min(100, round(50 * score + 50))

# Apply the transformation
scaled_scores = {course: scale_review_score(score) for course, score in course_sentiments.items()}

with open(output_path, "w") as f:
    json.dump(scaled_scores, f, indent = 2)
print("Scaled scores and saved to scaled_sentiment_scores.json")