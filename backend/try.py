import json

with open('/Users/ambroseblay/Info 4300/4300-Course_Finder-Banku_Boys/backend/course_reviews.json', 'r') as file:
    data = json.load(file)
    
missing_count = 0
full_count = 0

for d, val in data.items():
    if val == []:
        missing_count += 1
        full_count += 1
    else:
        full_count += 1
print(missing_count, full_count)