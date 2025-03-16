import time
import pandas as pd
import numpy as np
from selenium import webdriver
from bs4 import BeautifulSoup
import json

driver = webdriver.Chrome()

df = pd.read_csv('courses.csv')

def getCourseReview(url, course):
    print(f"Getting reviews data for {course}")
    driver.get(url)

    time.sleep(5)

    page_source = driver.page_source
    soup = BeautifulSoup(page_source, "html.parser")
    
    reviews = soup.find_all("div", {"class": "_card_1hc39_3"})
    
    results = []
    for review in reviews[:5]:
        course_review = {}
        metrics = review.find_all("span", {"class": "_bold_1hc39_48"})
        for i, metric in enumerate(metrics):
            if i == 0:
                course_review['overall'] = metric.get_text().strip()
            elif i == 1:
                course_review['difficulty'] = metric.get_text().strip()
            elif i == 2:
                course_review['workload'] = metric.get_text().strip()
            elif i == 3:
                course_review['professor'] = metric.get_text().strip()
            elif i == 4:
                course_review['grade'] = metric.get_text().strip()
            else:
                course_review['major'] = metric.get_text().strip()
            
        comment = review.find("div", {"class": "_reviewtext_1hc39_52 _collapsedtext_1hc39_70"})
        if comment:
            course_review["comment"] = comment.get_text().strip()
        results.append(course_review)
    return results
        
reviews = {}

for course in df['class']:
    txt, code = course.split(" ")
    url = f"https://www.cureviews.org/course/{txt}/{code}"
    data = getCourseReview(url, course)
    reviews[course] = data

with open("course_reviews.json", "w") as f:
    json.dump(reviews, f, indent=4)
print("Data saved to course_reviews.json")

driver.quit()