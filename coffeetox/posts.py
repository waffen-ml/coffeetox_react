from coffeetox import db, app, cfx_config
from flask import request, abort, session
from uuid import uuid4
from coffeetox.fs import save_file
from coffeetox.auth import User, subscription
from coffeetox.polls import Poll
from flask_login import login_required, current_user
import datetime
import json


user_comment_like = db.Table('user_comment_like',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('comment_id', db.Integer, db.ForeignKey('post_comment.id'))
)


user_post_like = db.Table('user_post_like',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'))
)


user_post_dislike = db.Table('user_post_dislike',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'))
)


user_post_view = db.Table('user_post_view',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'))
)


class Post(db.Model): 
    id = db.Column(db.Integer(), primary_key=True)
    title = db.Column(db.String(length=100), nullable=True)
    text = db.Column(db.String(length=2000), nullable=True)
    created_at = db.Column(db.DateTime(), nullable=False,
                                default=lambda: datetime.datetime.now(datetime.timezone.utc))
    is_deleted = db.Column(db.Boolean(), nullable=False, default=False)
    author_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    poll_id = db.Column(db.Integer(), db.ForeignKey('poll.id'))

    poll = db.relationship('Poll', backref='post', cascade='all,delete', lazy=True, uselist=False)

    files = db.relationship('File', backref='origin_post', lazy=True)
    comments = db.relationship('PostComment', backref='post', lazy=True)
    views = db.relationship('User', secondary=user_post_view, backref='viewed_posts', lazy=True)
    
    likes = db.relationship('User', secondary=user_post_like, backref='liked_posts', lazy=True)
    dislikes = db.relationship('User', secondary=user_post_dislike, backref='disliked_posts', lazy=True)
    
    fwd_post_id = db.Column(db.Integer(), db.ForeignKey('post.id'))
    post_fwds = db.relationship('Post', back_populates='fwd_post', remote_side=[fwd_post_id])
    fwd_post = db.relationship('Post', back_populates='post_fwds', remote_side=[id], uselist=False)

    def set_reaction(self, user, reaction):
        self.likes = [u for u in self.likes if u.id != user.id]
        self.dislikes = [u for u in self.dislikes if u.id != user.id]

        if reaction == 1:
            self.likes.append(user)
        elif reaction == -1:
            self.dislikes.append(user)

    def get_reaction(self, user):
        for l in self.likes:
            if l.id == user.id:
                return 1
        for d in self.dislikes:
            if d.id == user.id:
                return -1
        return 0

    def delete(self):
        self.likes = []
        self.dislikes = []
        
        for c in self.comments:
            db.session.delete(c)

        for f in self.files:
            f.delete_content()
            db.session.delete(f)

        self.is_deleted = True

        if self.poll:
            db.session.delete(self.poll)

        db.session.commit()
    
    def to_dict(self, me=None):
        return {
            'id': self.id,
            'title': self.title,
            'text': self.text,
            'files': [f.to_dict() for f in self.files],
            'reposts': len(self.post_fwds),
            'views': len(self.views),
            'fwd_post_id': self.fwd_post_id,
            'fwd_post': None if self.fwd_post is None else self.fwd_post.to_dict(),
            'author': self.author.to_dict(),
            'created_at': self.created_at,
            'likes': len(self.likes),
            'dislikes': len(self.dislikes),
            'my_reaction': 0 if me is None else self.get_reaction(me),
            'comments': [c.to_dict(me=me) for c in self.comments],
            'is_deleted': self.is_deleted,
            'poll': None if self.poll is None else self.poll.to_dict(me=me)
        }


class PostComment(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    text = db.Column(db.String(length=500), nullable=False)
    author_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer(), db.ForeignKey('post.id'), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False,
                                default=lambda: datetime.datetime.now(datetime.timezone.utc))

    likes = db.relationship('User', secondary=user_comment_like, backref='liked_post_comments', lazy=True)

    reply_to_id = db.Column(db.Integer(), db.ForeignKey('post_comment.id'))
    replies = db.relationship('PostComment', back_populates='reply_to', remote_side=[reply_to_id], cascade="all, delete")
    reply_to = db.relationship('PostComment', back_populates='replies', remote_side=[id], uselist=False)

    def set_reaction(self, user, reaction):
        self.likes = [u for u in self.likes if u.id != user.id]

        if reaction == 1:
            self.likes.append(user)

    def get_reaction(self, user):
        for l in self.likes:
            if l.id == user.id:
                return 1
        return 0

    def to_dict(self, me=None):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'text': self.text,
            'author': self.author.to_dict(),
            'likes': len(self.likes),
            'reply_to_id': self.reply_to_id,
            'my_reaction': 0 if me is None else self.get_reaction(me),
            'created_at': self.created_at
        }


def get_my_id():
    return None if not current_user.is_authenticated else current_user.id


@app.route('/post/json/<string:post_id>')
def get_post_json(post_id):
    post = Post.query.get(post_id)

    if post is None:
        abort(404)

    return post.to_dict(me=current_user)


@app.route('/new_post', methods=['POST'])
@login_required
def route_new_post():
    title = request.form.get('title', '')[:150]
    body = request.form.get('body', '')[:2000]
    fwd_post_id = request.form.get('fwd_post_id', None)
    files = request.files.getlist('files')
    plan_datetime = request.form.get('plan_datetime', None)
    poll_json = request.form.get('poll_json', None)
    
    post = Post(title=title, text=body, author_id=current_user.id)

    if plan_datetime is not None and plan_datetime != 'null':
        plan_datetime = datetime.datetime.strptime(plan_datetime, '%Y-%m-%dT%H:%M:%S.%fZ')
        post.created_at = plan_datetime

    if poll_json is not None and poll_json != 'null':
        poll_json = json.loads(poll_json)
        poll = Poll(
            is_anonymous=poll_json['is_anonymous'],
            title=poll_json['title']
        )
        db.session.add(poll)
        db.session.commit()
        poll.add_options(poll_json['options'])
        post.poll_id = poll.id
    
    db.session.add(post)

    if fwd_post_id is not None:
        fwd_post = Post.query.get(int(fwd_post_id))
        if fwd_post is not None:
            fwd_post.post_fwds.append(post)

    for file in files:
        save_file(file, origin_post=post)

    db.session.commit()

    return {'success': 1}


@app.route('/all_posts')
def get_all_posts():
    posts = Post.query.all()[::-1]
    return [p.to_dict(me=current_user) for p in posts]


@app.route('/set_post_reaction')
@login_required
def set_post_reaction():
    reaction = request.args.get('reaction', None)
    post_id = request.args.get('post_id', None)
    post = None if post_id is None else Post.query.get(int(post_id))

    if reaction not in ['-1', '0', '1'] or post is None:
        return {'success': 0}
    
    post.set_reaction(current_user, int(reaction))

    db.session.commit()

    return {'success': 1}

@app.route('/set_post_comment_reaction')
@login_required
def set_post_comment_reaction():
    reaction = request.args.get('reaction', None)
    comment_id = request.args.get('comment_id', None)
    post_comment = None if comment_id is None else PostComment.query.get(int(comment_id))

    print(post_comment, reaction)

    if reaction not in ['0', '1'] or post_comment is None:
        return {'success': 0}

    post_comment.set_reaction(current_user, int(reaction))

    db.session.commit()

    return {'success': 1}


@app.route('/get_post_reactions/<int:post_id>')
def route_get_post_reactions(post_id):
    post = Post.query.get(post_id)

    if post is None:
        return {
            'success': 0,
            'error': 'INVALID_ID'
        }
    
    return {
        'success': 1,
        'likes': [u.to_dict() for u in post.likes],
        'dislikes': [u.to_dict() for u in post.dislikes]
    }


@app.route('/delete_post/<int:post_id>')
def route_delete_post(post_id):
    post = Post.query.get(post_id)

    if post is None:
        return {
            'success': 0,
            'error': 'INVALID_ID'
        }
    
    post.delete()

    return {
        'success': 1
    }
    


@app.route('/leave_comment', methods=['POST'])
@login_required
def leave_comment():
    data = request.json
    post = Post.query.get(int(data['post_id']))

    if post is None:
        return {'success': 0}
    
    post_comment = PostComment(author_id=current_user.id, text=data.get('text', 'hey'))
    post.comments.append(post_comment)

    reply_to = None
    
    if 'reply_to_id' in data and data['reply_to_id']:
        reply_to = PostComment.query.get(int(data['reply_to_id']))

    if reply_to is not None and reply_to.post_id != post.id:
        reply_to = None
    
    if reply_to is not None:
        reply_to.replies.append(post_comment)

    db.session.commit()

    return {'success': 1, 'comment': post_comment.to_dict(me=current_user)}


@app.route('/delete_post_comment')
@login_required
def delete_post_comment():
    comment_id = request.args.get('comment_id', None)
    post_comment = PostComment.query.get(int(comment_id))

    if post_comment is None:
        return {'success': 0, 'error': 'NOT_FOUND'}
    elif post_comment.author.id != current_user.id:
        return {'success': 0, 'error': 'NO_PERMISSION'}

    db.session.delete(post_comment)

    db.session.commit()

    return {'success': 1}


@app.route('/generate_feed')
def generate_feed():
    sort = request.args.get('sort', 'TIME_ASC').upper()
    specific_user_only_id = request.args.get('specific_user_only', None)
    subscribed_only = int(request.args.get('subscribed_only', 0))
    feed_id = uuid4().hex

    if specific_user_only_id is not None:
        u = User.query.get(int(specific_user_only_id))
        specific_user_only_id = None if u is None else u.id
    
    if 'feed' not in session:
        session['feed'] = {}
    
    session['feed'][feed_id] = {
        'created_by_user_id': current_user.id,
        'updated_at': datetime.datetime.now(datetime.timezone.utc),
        'current': 0,
        'sort': sort,
        'specific_user_only_id': specific_user_only_id,
        'subscribed_only': subscribed_only
    }

    to_delete = sorted(session['feed'].items(),
                       key=lambda x: x[1]['updated_at'], reverse=True)[cfx_config['feed_limit']:]
    
    for f in to_delete:
        del session['feed'][f[0]]

    session.modified = True

    return {
        'success': 1,
        'feed_id': feed_id
    }


@app.route('/feed_batch/<string:feed_id>')
def feed_batch(feed_id):
    amount = int(request.args.get('amount', 10))

    if 'feed' not in session or feed_id not in session['feed']:
        return {
            'success': 0,
            'error': 'FEED_NOT_FOUND'
        }

    feed = session['feed'][feed_id]

    if feed.get('created_by_user_id') != current_user.id:
        return {
            'success': 0,
            'error': 'CURRENT_USER_WAS_CHANGED'
        }
    
    order = Post.created_at.asc() if feed['sort'] == 'TIME_ASC' else Post.created_at.desc()
    query = None

    if feed['specific_user_only_id'] is not None:
        query = Post.query.filter_by(author_id=feed['specific_user_only_id'])

    elif feed['subscribed_only'] and current_user.id is not None:
        query = Post.query\
            .join(subscription, subscription.c.target_id == Post.author_id)\
            .filter(subscription.c.subscriber_id == current_user.id)
    else:
        my_subs = db.select(subscription).filter_by(subscriber_id=current_user.id).subquery()
        query = Post.query\
            .join(User, User.id == Post.author_id)\
            .join(my_subs, my_subs.c.target_id == Post.author_id, isouter=True)\
            .filter((my_subs.c.subscriber_id == current_user.id) | (User.is_private == False) | (User.id == current_user.id))
    
    now = datetime.datetime.now(datetime.timezone.utc)

    posts = query.filter(Post.is_deleted == False)\
            .filter((Post.created_at <= now) | (Post.author_id == current_user.id))\
            .order_by(order).limit(amount).offset(feed['current']).all()
    
    feed['current'] += amount
    feed['updated_at'] = now

    session.modified = True

    return {
        'success': 1,
        'posts': [p.to_dict(me=current_user) for p in posts ],
        'current': feed['current']
    }
