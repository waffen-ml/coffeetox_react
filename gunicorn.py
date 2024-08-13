

bind = '0.0.0.0:443'
max_requests = 1000
threads = 5
workers = 5
wsgi_app = 'coffeetox:app'
keyfile = './coffeetox/ssl/privkey.pem'
certfile = './coffeetox/ssl/fullchain.pem'
preload_app = True

