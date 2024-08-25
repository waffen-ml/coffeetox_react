from flask_cors import CORS
from flask import Flask
import json
from flask_sqlalchemy import SQLAlchemy
import os
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate

class CFXConfig(dict):
    def __init__(self, path):
        with open(path) as f:
            d = json.load(f)
        super().__init__(**d)
        self.__dict__ = self

cfx_dir = os.path.dirname(os.path.realpath(__file__))
get_abspath = lambda *a: os.path.join(cfx_dir, *a)

cfx_config = CFXConfig(get_abspath('config.json'))

app = Flask(__name__, static_folder='static')
app.app_context().push()

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{get_abspath("coffeetox.db")}?charset=utf8mb4'
app.config['SECRET_KEY'] = cfx_config.secret_key
app.config['MAX_CONTENT_LENGTH'] = 40 * 1024 * 1024

if cfx_config.vite_dev:
    app.config["SESSION_COOKIE_SAMESITE"] = "None"
    app.config["SESSION_COOKIE_SECURE"] = True

cors = CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

db = SQLAlchemy(app)
mirgate = Migrate(app, db)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

json_response = lambda success, **kwargs: {'success': success, **kwargs}

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

    if cfx_config.ssl:
        ssl_context = (
            get_abspath('ssl/fullchain.pem'),
            get_abspath('ssl/privkey.pem')
        )

    app.run(
        debug=True,
        port=cfx_config['port'],
        host=cfx_config['host_url'],
        ssl_context=ssl_context
    )



