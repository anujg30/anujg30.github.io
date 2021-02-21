import json,sys
reload(sys)
sys.setdefaultencoding( "utf-8" )

with open('input-large.json') as data_file:
    data = json.load(data_file)

category_set = set()
for packages in data:
    category_set.add(data[packages]["category"])

final_list = []
for categories in category_set:
    category_list =[]
    category_sentiment = 0
    category_app_count = 0
    for packages in data:
        if(data[packages]["category"] == categories and categories != "unknown"):
            version_list = []
            for versions in data[packages]["versions"]:
                version_dict = {
                    "name":versions,
                    "size":data[packages]["versions"][versions]["numReviews"],
                    "sentimentScore":data[packages]["versions"][versions]["sentimentScore"],
                    "avgRating":data[packages]["versions"][versions]["avgRating"]
                }
                version_list.append(version_dict)

            app_dict = {
                "name":data[packages]["name"],
                "children":version_list,
                "dod":{
                    "worstReview":data[packages]["worstReview"],
                    "bestReview":data[packages]["bestReview"],
                    "avgRating":data[packages]["averageRating"],
                    "numReviews": data[packages]["numReviews"],
                    "icon":data[packages]["image"],
                    "topics":data[packages]["topics"],
                    "sentimentScore":data[packages]["sentimentScore"]
                }
            }

            if app_dict["name"] != "null" and app_dict["name"] != None:
                category_app_count += 1
                category_sentiment += data[packages]["sentimentScore"]
                category_list.append(app_dict)

    if categories != "unknown":
        final_list.append({
            "name":categories,
            "sentimentScore": category_sentiment / (category_app_count * 1.0),
            "children":category_list}
        )

final = {"name":"apps", "children":final_list}

with open('flare.json', 'w') as outfile:
    json.dump(final, outfile, indent=2)
