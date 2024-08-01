from flask_cors import CORS
from flask import Flask
import json
from flask_sqlalchemy import SQLAlchemy
import os
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

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
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True
cors = CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

from coffeetox import auth
from coffeetox import fs
from coffeetox import posts
from coffeetox import pages
from coffeetox import email

db.create_all()

def run_coffeetox():
    app.run(debug=True, port=80, host='localhost')



