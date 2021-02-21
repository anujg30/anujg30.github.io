import os, json

numberOfReviews = 0 #for debug

for root, dirs, files in os.walk(".\com", topdown=False):
    for reviewFile in files:
        splitRoot = []
        splitRoot = root.rsplit("\\",2)
        version = splitRoot[2]
        packageName = splitRoot[1]
        try:
            json_data=open(os.path.join(root, reviewFile)).read()
            data = json.loads(json_data)
            
            #Ignore empty files
            if isinstance(data, list):
                for reviews in data:
                    try:
                        comment = reviews['comment']
                        timestamp = reviews['timestampMsec']
                        #TODO: Check for english reviews
                        #version, packageName, comment and timestamp
                        numberOfReviews = numberOfReviews + 1
                    except KeyError as er:
                        continue
        except (ValueError, IOError) as err:
            continue
            
print numberOfReviews     