

bind = '0.0.0.0:443'
max_requests = 1000
workers = 6
wsgi_app = 'coffeetox:app'
keyfile = './coffeetox/ssl/privkey.pem'
certfile = './coffeetox/ssl/fullchain.pem'