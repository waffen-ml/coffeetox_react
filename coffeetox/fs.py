from coffeetox import db, cfx_config, app, get_abspath
from flask import send_file, abort, request, Response, redirect
import datetime
import mimetypes
import os
import re
import json
from PIL import Image
import cv2
from mutagen.wave import WAVE
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis


class File(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    filename = db.Column(db.String(length=200), nullable=False)
    upload_datetime = db.Column(db.DateTime(), nullable=False,
                                default=lambda: datetime.datetime.now(datetime.timezone.utc))
    content_length = db.Column(db.BigInteger(), nullable=False)
    content_type = db.Column(db.String(length=50), nullable=False)
    specifics = db.Column(db.String(200), nullable=True)

    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))

    @property
    def primitive_type(self):
        pt = self.content_type
        pt = pt if '/' not in pt else pt[:pt.find('/')]
        return pt if pt in ['image', 'video', 'audio'] else 'other'
    
    @property
    def extension(self):
        _, ext = os.path.splitext(self.filename)
        return ext[1:]
    
    @property
    def path(self):
        if not self.id:
            return None
        return get_abspath(cfx_config.user_files_folder, f'{self.id}.{self.extension}')
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'upload_datetime': self.upload_datetime,
            'content_type': self.content_type,
            'primitive_type': self.primitive_type,
            'content_length': self.content_length,
            'specifics': {} if self.specifics is None else json.loads(self.specifics)
        }

    def delete_content(self):
        os.remove(self.path)


def send_react_app():
    return send_file(f'{cfx_config.built_react_app_folder}/index.html')

# shortcut
@app.route('/assets/<path:path_to_file>')
def react_assets(path_to_file):
    path = os.path.join(f'{cfx_config.built_react_app_folder}/assets', path_to_file)
    mimetype = 'text/javascript' if path_to_file.endswith('.js') else mimetypes.guess_type(path)[0]
    return send_file(path, mimetype=mimetype)


@app.route('/file/<int:file_id>')
def get_file(file_id):
    file = File.query.get(file_id)

    if file is None or not os.path.exists(file.path):
        abort(404)

    if request.args.get('metadata', False):
        return file.to_dict()
    
    range_header = request.headers.get('Range', None)

    if range_header is None:
        return send_file(file.path, mimetype=file.content_type, 
                        as_attachment=False, download_name=file.filename)

    stream = open(file.path, 'rb')

    byte1, byte2 = 0, None

    m = re.search('(\d+)-(\d*)', range_header)
    g = m.groups()

    if g[0]:
        byte1 = int(g[0])
    if g[1]:
        byte2 = int(g[1])

    length = file.content_length - byte1

    if byte2 is not None:
        length = byte2 - byte1 + 1

    stream.seek(byte1)
    data = stream.read(length)

    stream.close()

    resp = Response(data, 206, mimetype=file.content_type, direct_passthrough=True)
    resp.headers.add('Content-Range', f'bytes {byte1}-{byte1 + length - 1}/{file.content_length}')

    return resp

def get_file_metadata(file_id):
    file = File.query.get(file_id)
    if not file:
        return None
    return file.to_dict()

def get_file_content_length(file):
    l = file.stream.seek(0, os.SEEK_END)
    file.stream.seek(0)
    return l

def get_specifics(file_db):
    try:

        if file_db.primitive_type == 'image':
            img = Image.open(file_db.path)
            return {
                'width': img.size[0],
                'height': img.size[1]
            }

        elif file_db.primitive_type == 'video':
            cap = cv2.VideoCapture(file_db.path)
            success, frame = cap.read()

            if not success:
                raise Exception('Could not extract first frame')
            
            # frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame)

            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            return {
                'width': img.size[0],
                'height': img.size[1],
                'duration': int(frame_count / fps)
            }
        
        elif file_db.primitive_type == 'audio':
            audio = None

            if file_db.extension.lower() == 'mp3':
                audio = MP3(file_db.path)
            elif file_db.extension.lower() == 'ogg':
                audio = OggVorbis(file_db.path)
            elif file_db.extension.lower() == 'wav':
                audio = WAVE(file_db.path)

            return {
                'duration': 0 if audio is None else int(audio.info.length)
            }


    except Exception as ex:
        print('Error while getting file specifics!')
        print(ex)
    
    return None



def save_file(file, **kwargs):

    file_db = File(filename=file.filename,
                content_type=file.content_type,
                content_length=file.content_length or get_file_content_length(file), **kwargs)
    
    db.session.add(file_db)
    db.session.commit()
    
    if not os.path.exists(get_abspath(cfx_config.user_files_folder)):
        os.mkdir(get_abspath(cfx_config.user_files_folder))

    file.save(file_db.path)

    specifics = get_specifics(file_db)

    #print('-' * 10)
    #print(file.filename)
    #print(specifics)
    #print('-' * 10)

    if specifics is not None:
        file_db.specifics = json.dumps(specifics)

    db.session.commit()

    return file_db

