
from pymongo import MongoClient
import gridfs

try:
    mongo_client = MongoClient('mongodb://localhost:27017/')
    db = mongo_client['coffeetox']
except Exception as ex:
    print('There is an error with database:', ex)
    exit()

fs = gridfs.GridFS(db, collection='fs')

with open('server/hey.jpg', 'rb') as f:
    fs.put(f.read(), filename='hey.jpg')