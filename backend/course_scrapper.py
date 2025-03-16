from bs4 import BeautifulSoup
import requests
import re
import csv

url = "https://classes.cornell.edu/browse/roster/SP25"
page = requests.get(url)


soup = BeautifulSoup(page.text, "html.parser")
sGroup = soup.find_all("ul", {"class": "subject-group"})
codes = [subject.find("a").get_text() for subject in sGroup]

url_prefix = "https://classes.cornell.edu"

subject_sites = {}
for i in range(len(sGroup)):
    code = codes[i]
    subject_sites[code] = url_prefix + f"/browse/roster/SP25/subject/{code}"
    
def getClassData(url):
    page = requests.get(url)
    soup = BeautifulSoup(page.text, 'html.parser')
    
    description = soup.find("p", {"class": "catalog-descr"})
    description = description.get_text().strip() if description else ""
    
    term_offered = soup.find("span", {"class": "catalog-when-offered"})
    term_offered = term_offered.get_text()[13:-1].split(",") if term_offered else ""
    
    distribution = soup.find("span", {"class": "catalog-distr"})
    distribution = distribution.get_text() if distribution else ""
    distribution_matches = re.findall(r'\((.*?)\)', distribution)
    distributions = [dist.strip() for group in distribution_matches for dist in group.split(',')]

    return {"description": description, "term_offered": term_offered, "distributions": distributions}

data = []
def getCourse(course, subject_sites):
    course_url = subject_sites.get(course)
    course_page = requests.get(course_url)
    
    soup = BeautifulSoup(course_page.text, "html.parser")
    lectures = soup.find_all("div", {"class": "node", "role": "region"})
    
    for lecture in lectures:
        class_code = lecture.find("div", {"class": "title-subjectcode"}).get_text()
        code_digit = class_code[-4:]
        
        class_title = lecture.find("div", {"class": "title-coursedescr"}).get_text()
        
        class_url = url_prefix + f"/browse/roster/SP25/class/{course}/{code_digit}"

        class_data = getClassData(class_url)
        class_data["course code"] = class_code
        class_data["course title"] = class_title
        
        data.append(class_data)
    return
        
def saveToCSV(data, filename="courses1.csv"):
    if not data:
        print("No data to save.")
        return
    
    # Specify column order
    keys = ["class", "term_offered", "distributions", "description"]

    # Write data to CSV
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=keys)
        writer.writeheader()
        
        for row in data:
            # Convert lists to strings before writing
            row["term_offered"] = ", ".join(row["term_offered"])
            row["distributions"] = ", ".join(row["distributions"])
            writer.writerow(row)

    print(f"Data saved to {filename}")
    

for subject, _ in subject_sites.items():
    print("Getting data for ", subject)
    getCourse(subject, subject_sites)
saveToCSV(data)