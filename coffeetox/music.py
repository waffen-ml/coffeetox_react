from coffeetox import db, app, fs
from flask_login import current_user, login_required
from sqlalchemy.orm import backref
from flask import request
import random

playlist_soundtrack = db.Table(
    'playlist_soundtrack',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlist.id')),
    db.Column('soundtrack_id', db.Integer, db.ForeignKey('soundtrack.id'))
)

user_playlist = db.Table(
    'user_playlist',
    db.Column('playlist_id', db.Integer, db.ForeignKey('playlist.id')),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'))
)


class Soundtrack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(length=100), nullable=False)
    author_name = db.Column(db.String(length=100), nullable=True)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cover_file_id = db.Column(db.Integer, db.ForeignKey('file.id'))
    music_file_id = db.Column(db.Integer, db.ForeignKey('file.id'), nullable=False)
    is_private = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)

    uploaded_by = db.relationship('User', backref='soundtracks', uselist=False)
    cover_file = db.relationship('File', foreign_keys=[cover_file_id], uselist=False)
    music_file = db.relationship('File', foreign_keys=[music_file_id], uselist=False)

    def is_available(self, me=None):
        if self.is_deleted:
            return False
        elif self.is_private and me != self.uploaded_by:
            return False
        return True

    def to_dict(self, me=None):

        if self.is_private and (me is None or me.id != self.uploaded_by.id):
            return {
                'id': self.id,
                'no_access': True
            }

        return {
            'id': self.id,
            'name': self.name,
            'author_name': self.author_name,
            'uploaded_by': self.uploaded_by.to_dict(),
            'cover_file': None if self.cover_file is None else self.cover_file.to_dict(),
            'music_file': None if self.music_file is None else self.music_file.to_dict(),
            'is_private': self.is_private,
            'is_deleted': self.is_deleted
        }
    
    def delete(self):
        if self.is_deleted:
            return

        if self.cover_file:
            self.cover_file.delete_content()
            db.session.delete(self.cover_file)
        
        self.music_file.delete_content()
        db.session.delete(self.music_file)

        self.is_deleted = True

        db.session.commit()


class Playlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(length=100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cover_file_id = db.Column(db.Integer, db.ForeignKey('file.id'))
    is_private = db.Column(db.Boolean, default=False)

    added_by = db.relationship('User', secondary=user_playlist, backref='added_playlists', uselist=True)
    soundtracks = db.relationship('Soundtrack', secondary=playlist_soundtrack, backref='playlists', uselist=True)
    creator = db.relationship('User', backref='created_playlists', uselist=False)
    cover_file = db.relationship('File', uselist=False)


    def remove_from_user(self, user):
        self.added_by = [u for u in self.added_by if u != user]
        db.session.commit()

    def add_to_user(self, user):
        self.remove_from_user(user)
        self.added_by.append(user)
        db.session.commit()

    def remove_soundtrack(self, soundtrack):
        self.soundtracks = [st for st in self.soundtracks if st != soundtrack]
        db.session.commit()

    def add_soundtrack(self, soundtrack):
        self.remove_soundtrack(soundtrack)
        self.soundtracks.append(soundtrack)
        db.session.commit()

    def contains_soundtrack(self, soundtrack):
        for st in self.soundtracks:
            if st == soundtrack:
                return True
        return False

    def delete(self):
        if self.cover_file:
            self.cover_file.delete_content()
            db.session.delete(self.cover_file)

        self.soundtracks = []

        db.session.commit()

        db.session.delete(self)
        db.session.commit()

    def to_dict(self, me=None, shuffle=False):
        if self.is_private and (me is None or me.id != self.creator_id):
            return {
                'id': self.id,
                'no_access': True
            }
        
        st_arr = [st.to_dict(me=me) for st in self.soundtracks]
        
        if shuffle:
            random.shuffle(st_arr)

        return {
            'id': self.id,
            'name': self.name,
            'creator': self.creator.to_dict(),
            'cover_file': None if self.cover_file is None else self.cover_file.to_dict(),
            'soundtracks': st_arr,
            'is_private': self.is_private,
            'added_by': len(self.added_by)
        }



@app.route('/create_soundtrack', methods=['POST'])
@login_required
def route_create_soundtrack():
    name = request.form.get('name', '')[:100]
    author_name = request.form.get('author_name', '')[:100] or None
    is_private = int(request.form.get('is_private', 0))
    music_file = request.files.get('music')
    cover_file = request.files.get('cover', None)
    add_to_playlists = request.form.getlist('add_to_playlists')

    if music_file is None:
        return {
            'success': 0,
            'error': 'INVALID_INPUT'
        }

    music_file_db = fs.save_file(music_file)
    cover_file_db = None if cover_file is None else fs.save_file(cover_file)

    soundtrack_db = Soundtrack(
        name=name, is_private=is_private,
        music_file=music_file_db, cover_file=cover_file_db,
        author_name=author_name, uploaded_by=current_user)
    
    db.session.add(soundtrack_db)
    db.session.commit()

    for pllt_id_raw in add_to_playlists:
        pllt = Playlist.query.get(int(pllt_id_raw))

        if pllt is None:
            continue

        pllt.add_soundtrack(soundtrack_db)
    
    db.session.commit()

    return {
        'success': 1
    }


@app.route('/create_playlist', methods=['POST'])
@login_required
def route_create_playlist():
    name = request.form.get('name', '')[:100]
    is_private = int(request.form.get('is_private', 0))
    cover_file = request.files.get('cover', None)

    cover_file_db = None if cover_file is None else fs.save_file(cover_file)

    playlist = Playlist(
        name=name, is_private=is_private,
        creator=current_user, cover_file=cover_file_db)

    db.session.add(playlist)
    db.session.commit()

    return {
        'success': 1
    }


@app.route('/get_my_soundtracks')
@login_required
def route_get_my_soundtracks():
    return [
        st.to_dict(me=current_user) for st in current_user.soundtracks
        if st.is_available(me=current_user)
    ]

@app.route('/get_my_playlists')
@login_required
def route_get_my_playlists():
    return {
        'created': [pl.to_dict(me=current_user) for pl in current_user.created_playlists],
        'added': [pl.to_dict(me=current_user) for pl in current_user.added_playlists]
    }


@app.route('/get_soundtrack/<int:st_id>')
def route_get_soundtrack(st_id):
    st = Soundtrack.query.get(st_id)

    if st is None or st.is_deleted:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    if st.is_private and st.uploaded_by != current_user:
        return {
            'success': 0,
            'error': 'NO_ACCESS'
        }

    return {
        'success': 1,
        'soundtrack': st.to_dict(me=current_user)
    }


@app.route('/get_playlist/<int:pllt_id>')
def route_get_playlist(pllt_id):
    pllt = Playlist.query.get(pllt_id)
    shuffle = int(request.args.get('shuffle', 0))

    if pllt is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    if pllt.is_private and pllt.creator != current_user:
        return {
            'success': 0,
            'error': 'NO_ACCESS'
        }

    return {
        'success': 1,
        'playlist': pllt.to_dict(me=current_user, shuffle=shuffle)
    }


@app.route('/remove_soundtrack_from_playlist/<int:pllt_id>/<int:st_id>')
@login_required
def route_remove_soundtrack_from_playlist(pllt_id, st_id):
    pllt = Playlist.query.get(pllt_id)
    soundtrack = Soundtrack.query.get(st_id)

    if pllt is None or soundtrack is None:
        return {
            'success': 0,
            'error': 'INVALID_ARGUMENTS'
        }

    elif pllt.creator != current_user:
        return {
            'success': 0,
            'error': 'NO_PERMISSION'
        }
    
    pllt.remove_soundtrack(soundtrack)

    return {
        'success': 1
    }


@app.route('/delete_playlist/<int:pllt_id>')
@login_required
def route_delete_playlist(pllt_id):
    pllt = Playlist.query.get(pllt_id)

    if pllt is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    elif pllt.creator != current_user:
        return {
            'success': 0,
            'error': 'NO_PERMISSION'
        }
    
    pllt.delete()

    return {
        'success': 1
    }


@app.route('/route_get_pllts_dependency_table/<int:st_id>')
@login_required
def route_get_pllts_dependency_table(st_id):
    soundtrack = Soundtrack.query.get(st_id)

    if soundtrack is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    table = []

    for my_pllt in current_user.created_playlists:
        table.append({
            'id': my_pllt.id,
            'name': my_pllt.name,
            'is_dependent': my_pllt.contains_soundtrack(soundtrack)
        })

    return {
        'success': 1,
        'table': table
    }


@app.route('/submit_pllts_dependency_table/<int:st_id>', methods=['POST'])
@login_required
def route_submit_pllts_dependency_table(st_id):
    soundtrack = Soundtrack.query.get(st_id)
    table = request.json['table']

    if soundtrack is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    
    for my_pllt in current_user.created_playlists:
        if table.get(str(my_pllt.id), False):
            my_pllt.add_soundtrack(soundtrack)
        else:
            my_pllt.remove_soundtrack(soundtrack)
    
    return {
        'success': 1
    }


@app.route('/delete_soundtrack/<int:st_id>')
@login_required
def route_delete_soundtrack(st_id):
    soundtrack = Soundtrack.query.get(st_id)

    if soundtrack is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    elif soundtrack.uploaded_by != current_user:
        return {
            'success': 0,
            'error': 'NO_PERMISSION'
        }
    
    soundtrack.delete()

    return {
        'success': 1
    }


@app.route('/is_playlist_added/<int:pllt_id>')
@login_required
def route_is_playlist_added(pllt_id):
    pllt = Playlist.query.get(pllt_id)

    if pllt is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }

    return {
        'success': 1,
        'is_added': any([added_pllt == pllt for added_pllt in current_user.added_playlists])
    }


@app.route('/toggle_playlist_sub/<int:pllt_id>/<int:state>')
@login_required
def route_toggle_playlist_sub(pllt_id, state):
    pllt = Playlist.query.get(pllt_id)

    if pllt is None:
        return {
            'success': 0,
            'error': 'NOT_FOUND'
        }
    elif pllt.creator == current_user:
        return {
            'success': 0,
            'error': 'INVALID_OPERATION'
        }
    
    if state:
        pllt.add_to_user(current_user)
    else:
        pllt.remove_from_user(current_user)

    return {
        'success': 1
    }

