import requests
import os
import datetime
import random

session = requests.Session()
cfx_address = lambda x: os.path.join('https://coffeetox.ru/', x)
utc_now = lambda: datetime.datetime.now(datetime.timezone.utc)

ACCOUNT_TAG = 'trash'
ACCOUNT_PASSWORD = '4321'

r = session.post(cfx_address('login'), json={
    'tag': ACCOUNT_TAG,
    'password': ACCOUNT_PASSWORD
})


def make_post(text, fwd_post_id=None, title='', create_at=None):
    create_at = create_at or utc_now()
    create_at_label = datetime.datetime.strftime(create_at, '%Y-%m-%dT%H:%M:%S.%fZ')

    r = session.post(cfx_address('new_post'), data={
        'title': title,
        'body': text,
        'fwd_post_id': fwd_post_id,
        'plan_datetime': create_at_label
    })

    try:
        json = r.json()
        return json.get('success')
    except:
        return False


def leave_comment(text, post_id, reply_to_id=None):
    r = session.post(cfx_address('leave_comment'), json={
        'text': text,
        'post_id': post_id,
        'reply_to_id': '' or reply_to_id
    })

    try:
        json = r.json()
        return json.get('success')
    except:
        return False


def get_feed(amount=10):
    r = session.get(cfx_address('generate_feed?sort=TIME_DESC'))

    try:
        if not r.json().get('success'):
            raise Exception()
    except:
        print('error!')
        return []

    r2 = session.get(cfx_address(f'feed_batch/{r.json().get("feed_id")}?amount={amount}'))

    try:
        if not r2.json().get('success'):
            raise Exception()
    except:
        print('error!')
        return []
    
    return r2.json().get('posts')


phrases = [
    'Поймут далеко не все',
    'Не все поймут',
    'Немногие поймут'
]
marks = [
    '', '.', '...', '!'
]
feed = get_feed(10)

for f in feed:
    text = random.choice(phrases) + random.choice(marks)
    leave_comment(text, f['id'])

    for c in f['comments']:
        text = random.choice(phrases) + random.choice(marks)
        leave_comment(text, f['id'], reply_to_id=c['id'])


