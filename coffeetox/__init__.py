from flask_cors import CORS
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate
import config

app = Flask(__name__, static_folder=os.path.join(os.getcwd(), 'static'))
app.app_context().push()

site_dir = os.getcwd()
site_address = 'https://coffeetox.ru'
json_response = lambda success, **kwargs: \
    kwargs if success is None else {'success': success, **kwargs}
path_address = lambda path: site_address + ('/' if path[0] != '/' else '') + path
db_path = os.path.join(site_dir, 'coffeetox.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}?charset=utf8mb4'
app.config['SECRET_KEY'] = config.secret_key
app.config['MAX_CONTENT_LENGTH'] = 40 * 1024 * 1024
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config['SESSION_COOKIE_SECURE'] = True

cors = CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

db = SQLAlchemy(app)
mirgate = Migrate(app, db)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

from coffeetox import auth
from coffeetox import fs
from coffeetox import polls
from coffeetox import posts
from coffeetox import pages
from coffeetox import email
from coffeetox import music
from coffeetox import ebank

db.create_all()

def run_coffeetox():
    ssl_context = None

    if config.ssl:
        ssl_context = ('./ssl/fullchain.pem', './ssl/privkey.pem')

    app.run(
        debug=True,
        port=config.port,
        host=config.host,
        ssl_context=ssl_context
    )



