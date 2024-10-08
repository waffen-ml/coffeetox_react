from coffeetox import app
from coffeetox.fs import send_react_app

@app.route('/')
@app.route('/user/<string:tag>')
@app.route('/register', methods=['GET'])
@app.route('/login', methods=['GET'])
@app.route('/confirm_email/register/<string:key>', methods=['GET'])
@app.route('/confirm_email/edit/<string:key>', methods=['GET'])
@app.route('/reset_password/<string:key>', methods=['GET'])


@app.route('/new_post', methods=['GET'])
@app.route('/post/<int:id>')
@app.route('/ua')
@app.route('/capytaire')
@app.route('/set_avatar', methods=['GET'])
@app.route('/change_password', methods=['GET'])
@app.route('/account_settings')
@app.route('/subscriptions')
@app.route('/new_st', methods=['GET'])
@app.route('/new_pllt', methods=['GET'])
@app.route('/listen_st/<int:id>')
@app.route('/listen_pllt/<int:id>')
@app.route('/music')
@app.route('/settings')
@app.route('/ebank')
@app.route('/card_style_demo')
@app.route('/create_ebank_fundraising')
def all_render_routes(*args, **kwargs):
    return send_react_app()