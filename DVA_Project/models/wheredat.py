import json
import urllib
#from urllib import urllib.request
#import urllib.parse

def getAppDict(values):
	#Pass list of packages as this :
	#values = {"packages": ["com.pixmix.mobileapp","com.nextstagesearch"]}

	url = "http://api.wheredatapp.com/data"
	params = json.dumps(values).encode('utf8')
	req = urllib.Request(url, data=params, headers={'content-type': 'application/json'})
	response = urllib.request.urlopen(req)

	result = json.loads(response.readall().decode('utf-8'))
	app_num = len(result['apps'])
	app_dict = {}
	for i in range(app_num):
		app_dict[result['apps'][i]['package']] = result['apps'][i]
	
	#print (app_dict['com.pixmix.mobileapp'])
	#Use app_dict as this and returns a dictionary object
	return (app_dict)

print getAppDict({'packages':['com.tencent.mobileqqi']})