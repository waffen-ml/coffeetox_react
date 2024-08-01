from coffeetox import db, bcrypt, app, login_manager, cfx_config
from flask import request, abort
from coffeetox.email import email_confirmation_manager
import re
import datetime
from flask_login import login_user, UserMixin, current_user, login_required, logout_user, AnonymousUserMixin
from coffeetox.fs import save_file
import secrets

@login_manager.user_loader
def load_user(user_id):
    u = User.query.get(int(user_id))
    return u

class AnonymousUser(AnonymousUserMixin):
    id = None

login_manager.anonymous_user = AnonymousUser


subscription = db.Table('subscription',
    db.Column('subscriber_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('target_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)


class SubscriptionRequest(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    subscriber_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    target_id = db.Column(db.Integer(), db.ForeignKey('user.id'))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(length=30), nullable=False)
    tag = db.Column(db.String(length=20), unique=True, nullable=False)
    bio = db.Column(db.String(length=100), default='')
    email = db.Column(db.String(length=50), unique=False, nullable=False)
    password_hash = db.Column(db.String(length=60), nullable=False)
    balance = db.Column(db.Integer(), nullable=False, default=0)
    last_seen = db.Column(db.DateTime, nullable=False,
                          default=lambda: datetime.datetime.now(datetime.timezone.utc))
    registration_date = db.Column(db.Date, nullable=False, default=lambda: datetime.date.today())

    my_posts = db.relationship('Post', backref='author', lazy=True)
    avatar_file_id = db.Column(db.Integer(), db.ForeignKey('file.id'))

    post_comments = db.relationship('PostComment', backref='author', lazy=True)

    is_private = db.Column(db.Boolean, default=False)

    subscribers = db.relationship('User', 
                                  secondary=subscription, 
                                  primaryjoin=id == subscription.c.target_id,
                                  secondaryjoin=id == subscription.c.subscriber_id,
                                  back_populates='subscribed_to', 
                                  lazy=True)
    
    subscribed_to = db.relationship('User',
                                    secondary=subscription,
                                    primaryjoin=id == subscription.c.subscriber_id,
                                    secondaryjoin=id == subscription.c.target_id,
                                    back_populates='subscribers', 
                                    lazy=True)

    outgoing_subscription_requests = db.relationship('SubscriptionRequest', 
                                                     backref='subscriber',
                                                     foreign_keys=[SubscriptionRequest.subscriber_id],
                                                     uselist=True)
    
    incoming_subscription_requests = db.relationship('SubscriptionRequest', 
                                                     backref='target', 
                                                     foreign_keys=[SubscriptionRequest.target_id],
                                                     uselist=True)
    
    def to_dict(self, full=False):
        out = {
            'id': self.id,
            'username': self.username,
            'tag': self.tag,
            'avatar_file_id': self.avatar_file_id,
            'bio': self.bio,
            'last_seen': self.last_seen,
            'registration_date': self.registration_date,
            'is_private': self.is_private
        }

        if full:
            out |= {
                'email': self.email
            }

        return out
    
    def subscribe_to(self, user):
        if self.is_subscribed_to(user):
            return False, None

        if not user.is_private:
            self.subscribed_to.append(user)
            db.session.commit()
            return True, None
        
        req = SubscriptionRequest(subscriber_id=self.id, target_id=user.id)
        db.session.add(req)
        db.session.commit()

        return False, req
    
    def unsubscribe_from(self, user):

        subscriptions_to_delete = list(filter(lambda u: u[1] == user, enumerate(self.subscribed_to)))

        for s in subscriptions_to_delete[::-1]:
            self.subscribed_to.pop(s[0])

        requests_to_delete = list(filter(
            lambda r: r.target == user, self.outgoing_subscription_requests))

        for r in requests_to_delete:
            db.session.delete(r)
    
        db.session.commit()

        return len(requests_to_delete) + len(subscriptions_to_delete) > 0

    def is_subscribed_to(self, user):
        return user in self.subscribed_to

    def delete_subscriber(self, user):
        initial_subs = len(self.subscribers)
        self.subscribers = list(filter(lambda u: u != user, self.subscribers))
        db.session.commit()
        
        return initial_subs > len(self.subscribers)
    
    def has_requested_subscription_to(self, user):
        return any(out.target == user for out in self.outgoing_subscription_requests)

    def resolve_incoming_request(self, user, add):
        req = SubscriptionRequest.query.filter_by(target_id=self.id, subscriber_id=user.id).first()

        if req is None:
            return False
        elif add:
            self.subscribers.append(user)
        elif not add:
            pass

        db.session.delete(req)
        db.session.commit()

        return True

    def accept_all_subscription_requests(self):
        for sr in self.incoming_subscription_requests:
            self.resolve_subscription_request(sr.subscriber, True)
    
    def update_last_seen(self):
        self.last_seen = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()

    @property
    def password(self):
        raise NotImplementedError()

    @password.setter
    def password(self, plain_text_password):
        self.password_hash = bcrypt.generate_password_hash(plain_text_password).decode('utf-8')

    def check_password(self, plain_text_password):
        return bcrypt.check_password_hash(self.password_hash, plain_text_password)


def is_tag_accessible_for(tag, user=AnonymousUser):
    if user.id is not None and user.tag == tag:
        return True

    other_user = User.query.filter_by(tag=tag).first()

    if other_user is not None:
        return False
    
    return not email_confirmation_manager.is_tag_about_to_be_registered(tag)


def is_user_data_valid(**d):
    email = d.get('email')
    username = d.get('username')
    tag = d.get('tag')
    password = d.get('password')
    for_user = d.get('for_user', AnonymousUser)

    if username is not None and not (5 <= len(username) <= 30):
        return False
    
    if tag is not None and ( \
        not (5 <= len(tag) <= 20) \
        or re.match('^[A-Za-z0-9_]*$', tag) is None \
        or not is_tag_accessible_for(tag, for_user)
    ):
        return False
    
    if password is not None and len(password) < 4:
        return False

    if email is not None and not re.match(r'[^@]+@[^@]+\.[^@]+', email):
        return False
    
    return True


def add_user(**kwargs):
    user = User(**kwargs)
    db.session.add(user)
    db.session.commit()
    return user

def login_to_cfx(user):
    login_user(user, remember=True, duration=datetime.timedelta(days=30))


@app.route('/user/json/<string:tag>')
def route_get_user_json(tag):
    user = User.query.filter_by(tag=tag).first()

    if user is None:
        abort(404)
    
    return user.to_dict()


@app.route('/is_tag_free')
def route_is_tag_free():
    tag = request.args['tag']

    return {
        'success': 1,
        'is_free': is_tag_accessible_for(tag, current_user)
    }


@app.route('/subscribe/<int:target_id>')
@login_required
def route_subscribe(target_id):
    target = User.query.get(target_id)

    if target is None:
        return {
            'success': 0,
            'error': 'USER_DOES_NOT_EXIST'
        }
    
    status, req = current_user.subscribe_to(target)

    if not status and req is None:
        return {
            'success': 0,
            'error': 'ALREADY_SUBSCRIBED'
        }

    elif req is None:
        return {
            'success': 1,
            'request': False
        }
    
    else:
        return {
            'success': 1,
            'request': True
        }


@app.route('/subscription_status/<int:target_id>')
@login_required
def route_subscription_status(target_id):
    target = User.query.get(target_id)

    if target is None:
        return {
            'success': 0,
            'error': 'USER_DOES_NOT_EXIST'
        }
    
    output = {
        'success': 1,
        'subscribed': 0,
        'requested': 0
    }
    
    if current_user.is_subscribed_to(target):
        output['subscribed'] = 1
    
    elif current_user.has_requested_subscription_to(target):
        output['requested'] = 1

    return output


@app.route('/unsubscribe/<int:target_id>')
@login_required
def route_unsubscribe(target_id):
    target = User.query.get(target_id)

    if target is None:
        return {
            'success': 0,
            'error': 'USER_DOES_NOT_EXIST'
        }

    if not current_user.unsubscribe_from(target):
        return {
            'success': 0,
            'error': 'NO_RELATION'
        }

    return {
        'success': 1
    }


@app.route('/resolve_incoming_request/<int:target_id>/<int:add>')
@login_required
def route_resolve_incoming_request(target_id, add):
    target = User.query.get(target_id)

    if target is None:
        return {
            'success': 0,
            'error': 'USER_DOES_NOT_EXIST'
        }

    if not current_user.resolve_incoming_request(target, add):
        return {
            'success': 0,
            'error': 'NO_REQUEST'
        }
    
    return {
        'success': 1
    }


@app.route('/all_subscribers')
@login_required
def route_all_subscribers():
    return [u.to_dict() for u in current_user.subscribers]


@app.route('/all_subscriptions')
@login_required
def route_all_subscriptions():
    return [u.to_dict() for u in current_user.subscribed_to]


@app.route('/all_subscription_requests')
@login_required
def route_all_subscription_requests():
    return {
        'incoming': [r.subscriber.to_dict() for r in current_user.incoming_subscription_requests],
        'outgoing': [r.target.to_dict() for r in current_user.outgoing_subscription_requests],
    }

@app.route('/delete_subscriber/<int:subscriber_id>')
@login_required
def route_delete_subscriber(subscriber_id):

    subscriber = User.query.get(subscriber_id)

    if subscriber is None:
        return {
            'success': 0,
            'error': 'INVALID_SUBSCRIBER'
        }
    
    elif not current_user.delete_subscriber(subscriber):
        return {
            'success': 0,
            'error': 'NOT_A_SUBSCRIBER'
        }  

    return {
        'success': 1
    }

@app.route('/edit_account', methods=['POST'])
@login_required
def route_edit_account():
    data = request.json

    if not is_user_data_valid(
        for_user=current_user,
        username=data['username'],
        tag=data['tag'],
        email=data['email']
    ):
        return {
            'success': 0,
            'error': 'INVALID_DATA'
        }
    
    current_user.username = data['username']
    current_user.tag = data['tag']
    current_user.bio = data['bio']
    current_user.is_private = data['is_private']

    if not current_user.is_private:
        current_user.accept_all_subscription_requests()

    db.session.commit()
    
    if current_user.email != data['email'] and cfx_config['email_confirmation']:
        return {
            'success': 1,
            'confirmation_key': email_confirmation_manager.send_confirmation(data['email'], {'email': data['email']}, 'edit')
        }
    
    current_user.email = data['email']
    db.session.commit()

    return {
        'success': 1,
        'confirmation_key': None
    }


@app.before_request
def br_update_last_seen():
    if current_user.id is None:
        return
    current_user.update_last_seen()

@app.route('/change_password', methods=['POST'])
@login_required
def route_change_password():
    old_password = request.json['old_password']
    new_password = request.json['new_password']

    if not is_user_data_valid(password=new_password) or not current_user.check_password(old_password):
        return {
            'success': 0,
            'error': 'INVALID_DATA'
        }
    
    current_user.password = new_password
    db.session.commit()

    return {
        'success': 1
    }


@app.route('/reset_password')
def route_reset_password():
    tag = request.args.get('tag', '')
    user = User.query.filter_by(tag=tag).first()

    if user is None:
        return {
            'success': 0,
            'error': 'INVALID_TAG'
        }
    
    new_password = secrets.token_urlsafe(cfx_config['generated_password_length'])
    
    return {
        'success': 1,
        'confirmation_key': email_confirmation_manager.send_confirmation(
            user.email, {'user_id': user.id, 'new_password': new_password}, 'password_reset')
    }


@app.route('/confirm_email', methods=['POST'])
def route_confirm_email():
    conf_key = request.json['confirmation_key']
    conf_code = request.json['confirmation_code']

    payload, type = email_confirmation_manager.complete_confirmation(conf_key, conf_code)
    redirect_url = None

    if payload is None:
        return {
            'success': 0,
            'error': 'INVALID_CREDS'
        }
    elif type == 'register':
        login_to_cfx(add_user(**payload))
    elif type == 'edit' and current_user.id is not None:
        current_user.email = payload['email']
        db.session.commit()
    elif type == 'password_reset':
        user = User.query.get(payload['user_id'])
        user.password = payload['new_password']
        db.session.commit()
        login_to_cfx(user)
        redirect_url = '/reset_password_result?new_password=' + payload['new_password']
    else:
        return {
            'success': 0
        }

    return {
        'success': 1,
        'redirect': redirect_url
    }


@app.route('/register', methods=['POST'])
def route_register():
    data = request.json
    
    if not is_user_data_valid(**data):
        return {
            'success': 0,
            'error': 'INVALID_DATA'
        }

    if not cfx_config['email_confirmation']:

        login_to_cfx(add_user(**data))

        return {
            'success': 1,
            'confirmation': False,
            'confirmation_key': None
        }
    
    return {
        'success': 1,
        'confirmation': True,
        'confirmation_key': email_confirmation_manager.send_confirmation(data['email'], data)
    }


@app.route('/login', methods=['POST'])
def route_login():
    data = request.json
    user = User.query.filter_by(tag=data['tag']).first()

    if user is None or not user.check_password(data['password']):
        return {
            'success': 0,
            'error': 'INVALID_CREDS'
        }
    
    login_to_cfx(user)

    return {
        'success': 1
    }


@app.route('/set_avatar', methods=['POST'])
def route_set_avatar():
    if not current_user.is_authenticated:
        return {'success': 0, 'error': 'NOT_AUTHENTICATED'}

    avatar = request.files.get('avatar', None)
    current_user.avatar_file_id = save_file(avatar).id
    db.session.commit()

    return {'success': 1}


@app.route('/all_users')
def route_all_users():
    return [u.to_dict() for u in User.query.all()]


@app.route('/who_am_i')
@login_required
def route_who_am_i():
    return {
        'success': 1,
        'you': current_user.to_dict(full=True)
    }


@app.route('/logout')
@login_required
def route_logout():
    logout_user()
    return {'success': 1}