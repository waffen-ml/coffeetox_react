from flask import Flask, request, session, send_file, Response, render_template, send_from_directory
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_cors import CORS
import email_confirmation
import re
import datetime
import bcrypt
import gridfs
import mimetypes
import os

BCRYPT_SALT = 5
VPS_ADDRESS = '45.95.202.245'

try:
    mongo_client = MongoClient(f'mongodb://{VPS_ADDRESS}:27017/')
    db = mongo_client['coffeetox']
except Exception as ex:
    print('There is an error with database:', ex)
    exit()

fs = gridfs.GridFS(db, collection='fs')
app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'kheres'
cors = CORS(app, resources={r"/*": {"origins": "*"}})


# shortcut
@app.route('/assets/<path:path_to_file>')
def react_assets(path_to_file):
    path = os.path.join('./static/dist/assets', path_to_file)
    mimetype = 'text/javascript' if path_to_file.endswith('.js') else mimetypes.guess_type(path)[0]
    return send_file(path, mimetype=mimetype)


@app.route('/')
@app.route('/register', methods=['GET'])
@app.route('/confirm_email/<string:key>', methods=['GET'])
@app.route('/post/<string:id>')
@app.route('/new_post', methods=['GET'])
@app.route('/ua')
@app.route('/capytaire')
def send_page(*args):
    return send_file('./static/dist/index.html')

@app.route('/is_tag_free')
def is_tag_free():
    tag = request.args['tag']
    user = db['users'].find_one({'tag': tag})
    return {'is_free': user is None and not email_confirmation.contains_tag(tag), 'success': 1}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    if not (5 <= len(data['name']) <= 30 and 5 <= len(data['tag']) <= 20 and re.match('^[A-Za-z0-9_]*$', data['tag']) is not None and len(data['password']) >= 4):
        return {'error' : 'INVALID_DATA', 'success': 0}

    return {
        'success': 1,
        'confirmation_key': email_confirmation.send_email_confirmation(data['email'], data)
    }

@app.route('/confirm_email', methods=['POST'])
def confirm_email():
    conf_key = request.json['confirmation_key']
    conf_code = request.json['confirmation_code']

    data = email_confirmation.confirm_email(conf_key, conf_code)

    if data is None:
        return {
            'success': 0,
            'error': 'INVALID_CONF_CODE'
        }

    user_id = db['users'].insert_one({
        'name': data['name'],
        'tag': data['tag'],
        'email': data['email'],
        'registration_date': datetime.datetime.now(),
        'balance': 0,
        'password_hash': bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt(BCRYPT_SALT))
    }).inserted_id

    session.user_id = user_id

    return {
        'success': 1
    }

@app.route('/new_post', methods=['POST'])
def new_post():
    title = request.form.get('title', '')[:150]
    body = request.form.get('body', '')[:2000]
    files = request.files.getlist('files')

    file_ids = []

    for file in files:
        file_id = fs.put(file.stream, contentType=file.content_type, filename=file.filename)
        file_ids.append(file_id)

    db['posts'].insert_one({
        "title": title,
        "body": body,
        "files": file_ids,
        "datetime": datetime.datetime.now()
    })

    return {'success': 1}

def get_file_metadata(file_id=None, file=None):

    if file_id is not None:
        file_id = str(file_id)
        if not ObjectId.is_valid(file_id):
            return {}
        file = fs.get(ObjectId(file_id))
    
    if file is None:
        return {}
    
    pt = file.content_type
    pt = pt if '/' not in pt else pt[:pt.find('/')]
    pt = pt if pt in ['image', 'video', 'audio'] else 'other'

    return {
        'id': str(file._id),
        'content_type': file.content_type,
        'filename': file.filename,
        'upload_date': file.upload_date,
        'primitive_type': pt
    }

@app.route('/file/<string:file_id>')
def get_file(file_id):
    if not ObjectId.is_valid(file_id):
        return {
            'success': 0,
            'error': 'INVALID_ID'
        }
    
    file = fs.get(ObjectId(file_id))

    if file is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    if request.args.get('metadata', False):
        return {
            'success': 1,
            'metadata': get_file_metadata(file=file)
        }
    
    range_header = request.headers.get('Range', None)

    if range_header is None:
        return send_file(file, mimetype=file.content_type, 
                        as_attachment=False, download_name=file.filename)
    
    byte1, byte2 = 0, None

    m = re.search('(\d+)-(\d*)', range_header)
    g = m.groups()

    if g[0]:
        byte1 = int(g[0])
    if g[1]:
        byte2 = int(g[1])

    length = file.length - byte1

    if byte2 is not None:
        length = byte2 - byte1 + 1

    file.seek(byte1)
    data = file.read(length)

    resp = Response(data, 206, mimetype=file.content_type, direct_passthrough=True)
    resp.headers.add('Content-Range', f'bytes {byte1}-{byte1 + length - 1}/{file.length}')

    return resp

@app.route('/post/<string:post_id>')
def get_post(post_id):
    post = db['posts'].get(ObjectId(post_id))

@app.route('/post/json/<string:post_id>')
def get_post_json(post_id):
    if not ObjectId.is_valid(post_id):
        return {
            'success': 0,
            'error': 'INVALID_ID'
        }

    post = db['posts'].find_one(ObjectId(post_id))

    if post is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    post['id'] = str(post.pop('_id'))
    post['files'] = [str(f) for f in post['files']]

    if request.args.get('file_metadata', 0):
        post['files'] = [get_file_metadata(file_id=f) for f in post['files']]

    return {
        'success': 1,
        'post': post
    }

@app.route('/login', methods=['POST'])
def login():
    pass

@app.route('/')
def index():
    print(session)
    return 'hello world!'

@app.route('/get_all_posts')
def get_all_posts():
    posts = [str(p['_id']) for p in db['posts'].find({}, {'_id': True})][::-1]
    return {'success': 1, 'posts': posts}

if __name__ == '__main__':
    app.run(host=VPS_ADDRESS, port=80, debug=True)