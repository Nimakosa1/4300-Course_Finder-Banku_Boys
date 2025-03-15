import time
from selenium import webdriver
from bs4 import BeautifulSoup

driver = webdriver.Chrome()

def getCourseReview(url, course):
    driver.get(url)

    time.sleep(5)

    page_source = driver.page_source
    soup = BeautifulSoup(page_source, "html.parser")
    
    reviews = soup.find_all("div", {"class": "_card_1hc39_3"})
    
    results = []
    for review in reviews[:1]:
        course_review = {}
        difficulty = review.find("span", {"class": "_bold_1hc39_48"})
        if difficulty:
            course_review["difficulty"] = difficulty.get_text()
        
        professor = review.find("div", string = "Professor ")
        if professor:
            professor_name = professor.find_next("span", {"class": "_bold_1hc39_48"})
            if professor_name:
                course_review["professor"] = professor_name.get_text()
        comment = review.find("div", {"class": "_reviewtext_1hc39_52 _collapsedtext_1hc39_70"})
        if comment:
            course_review["comment"] = comment.get_text()
        results.append(course_review)
    print(results)
        
    
getCourseReview("https://www.cureviews.org/course/CS/1110", "CS1110")
driver.quit()