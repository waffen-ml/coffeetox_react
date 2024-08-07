from coffeetox import app
from coffeetox.fs import send_react_app

@app.route('/')
@app.route('/user/<string:tag>')
@app.route('/register', methods=['GET'])
@app.route('/login', methods=['GET'])
@app.route('/confirm_email/<string:key>', methods=['GET'])
@app.route('/new_post', methods=['GET'])
@app.route('/post/<int:id>')
@app.route('/ua')
@app.route('/capytaire')
@app.route('/set_avatar', methods=['GET'])
@app.route('/change_password', methods=['GET'])
@app.route('/account_settings')
@app.route('/reset_password_start')
@app.route('/reset_password_result')
@app.route('/subscriptions')
def all_render_routes(*args, **kwargs):
    return send_react_app()
