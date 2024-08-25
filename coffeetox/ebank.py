from coffeetox import db, app, cfx_config, json_response
from flask import request, abort, session
from uuid import uuid4
from coffeetox.auth import User
from flask_login import login_required, current_user
from sqlalchemy import func
import datetime
from yoomoney import Quickpay, Client
import json


yoomoney_client = Client(cfx_config.yoomoney_token)
awaiting_payment = {}


user_ebank_card_style = db.Table('user_ebank_card_style',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('ebank_card_style_id', db.Integer, db.ForeignKey('ebank_card_style.id'))
)


class Transaction(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    from_user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=True)
    to_user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=True)
    amount = db.Column(db.Float(3), nullable=False)
    datetime = db.Column(db.DateTime(), nullable=False,
                                default=lambda: datetime.datetime.now(datetime.timezone.utc))
    comment = db.Column(db.String(length=200), default="")

    from_user = db.relationship('User', backref='outgoing_transactions', 
                                foreign_keys=[from_user_id], uselist=False)
    
    to_user = db.relationship('User', backref='incoming_transactions', 
                                foreign_keys=[to_user_id], uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'from_user': None if self.from_user is None else self.from_user.to_dict(),
            'to_user': None if self.to_user is None else self.to_user.to_dict(),
            'comment': self.comment,
            'amount': self.amount,
            'datetime': self.datetime
        }


class EbankCardStyle(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    price = db.Column(db.Integer(), default=0)
    name = db.Column(db.String(100), nullable=False)
    style_json = db.Column(db.String(200), nullable=False)
    buyers = db.relationship('User', backref="purchased_ebank_card_styles", secondary=user_ebank_card_style)

    def to_dict(self):
        return {
            'id': self.id,
            'price': self.price,
            'name': self.name,
            'style': json.loads(self.style_json)
        }

    def is_available_for(self, user):
        return self.price == 0 or user in self.buyers
    
    def is_equipped_by(self, user):
        return user.id is not None and user.equipped_ebank_card_style == self


def accept_payments(watch_user_id):
    history = yoomoney_client.operation_history()
    accepted_watched = False

    for oper in history.operations:

        if oper.label not in awaiting_payment or oper.status != 'success':
            continue

        data = awaiting_payment.pop(oper.label)
        user = User.query.get(data['user_id'])

        if user is None:
            continue
        if user.id == watch_user_id:
            accepted_watched = True
        
        transfer(None, user, oper.amount / cfx_config.ebl_to_roubles, 'Покупка EBL')

    return accepted_watched


def transfer(from_user, to_user, amount, comment=''):

    amount = round(amount, 2)

    if amount <= 0 or amount > 1e+5:
        return 'INVALID_AMOUNT'
    elif from_user is not None and from_user.balance < amount:
        return 'INSUFFICIENT_BALANCE'
    
    transaction = Transaction(from_user=from_user, to_user=to_user,
                              amount=amount, comment=comment)
    
    db.session.add(transaction)

    if from_user is not None:
        from_user.balance -= amount
    
    if to_user is not None:
        to_user.balance += amount
    
    db.session.commit()

    return 'SUCCESS'


@app.route('/ebank/transfer', methods=['POST'])
@login_required
def route_transfer():
    dest_tag = request.json.get('dest_tag', '')
    amount = float(request.json.get('amount', 0))
    comment = request.json.get('comment', '')

    dest_user = User.query.filter_by(tag=dest_tag).first()

    if dest_user is None:
        return {
            'success': 0,
            'error': 'DEST_NOT_FOUND'
        }
    
    status = transfer(current_user, dest_user, amount, comment)

    if status == 'SUCCESS':
        return {
            'success': 1
        }
    
    return {
        'success': 0,
        'error': status
    }


@app.route('/ebank/view_my_transactions/<int:per_page>/<int:page_idx>')
@login_required
def route_view_my_transactions(per_page, page_idx):
    subq = Transaction.query.filter((Transaction.from_user_id == current_user.id) | (Transaction.to_user_id == current_user.id)).order_by(Transaction.id.desc())
    p = db.paginate(subq, page=page_idx, per_page=per_page)

    return {
        'items': [
            t.to_dict() for t in p.items
        ],
        'num_pages': p.pages
    }


@app.route('/ebank/buy_ebl/<float:amount>')
@login_required
def route_buy_ebl(amount):

    if amount < 1e-2:
        return {
            'success': 0,
            'error': 'INVALID_AMOUNT'
        }

    request_uuid = uuid4().hex

    awaiting_payment[request_uuid] = {'user_id': current_user.id, 'ebl_amount': amount}

    quickpay = Quickpay(
        receiver=cfx_config.yoomoney_account_id,
        quickpay_form="shop",
        targets=f'Купите {amount} EBL',
        paymentType="SB",
        sum=amount * cfx_config.ebl_to_roubles,
        label=request_uuid
    )
    
    return {
        'success': 1,
        'url': quickpay.base_url
    }


@app.route('/ebank/gimme/<float:amount>')
@login_required
def route_gimme(amount):
    status = transfer(None, current_user, amount)

    if status == 'SUCCESS':
        return {'success': 1}
    
    return {
        'success': 0,
        'error': status
    }


@app.route('/ebank/ebl_to_roubles')
def route_ebl_to_roubles():
    return {
        'coef': cfx_config.ebl_to_roubles
    }

@app.route('/ebank/check_payments')
@login_required
def route_check_payments():
    return {
        'accepted': accept_payments(current_user.id)
    }


def get_available_card_styles(user):
    purchased = [] if user.id is None else user.purchased_ebank_card_styles
    free = EbankCardStyle.query.filter_by(price=0).all()
    return free + purchased


@app.route('/ebank/get_equipped_card_style')
@login_required
def route_get_equipped_card_style():
    if current_user.equipped_ebank_card_style is None \
        or not current_user.equipped_ebank_card_style.is_available_for(current_user):
        available = get_available_card_styles(current_user)
        if not available:
            return {'success': 0, 'error': 'NO_STYLES_AVAILABLE'}
        current_user.equipped_ebank_card_style = available[0]
        db.session.commit()

    return {
        'success': 1,
        'card_style': current_user.equipped_ebank_card_style.to_dict()
    }


@app.route('/ebank/get_available_card_styles')
def route_get_available_card_styles():
    return [
        s.to_dict() for s in get_available_card_styles(current_user)
    ]


@app.route('/ebank/get_all_card_styles')
def route_get_all_card_styles():
    return [
        {
            'card_style': s.to_dict(),
            'is_available': s.is_available_for(current_user),
            'is_equipped': s.is_equipped_by(current_user)
        } for s in EbankCardStyle.query.all()
    ]


@app.route('/ebank/buy_card_style/<int:style_id>')
@login_required
def route_buy_card_style(style_id):
    style = EbankCardStyle.query.get(style_id)
    
    if style is None:
        return json_response(False, error='STYLE_NOT_FOUND')

    if style.is_available_for(current_user):
        return json_response(False, error='AVAILABLE_ALREADY')
    
    pay_status = transfer(current_user, None, style.price, 'Покупка стиля карты')

    if pay_status != 'SUCCESS':
        return json_response(False, error=pay_status)
    
    style.buyers.append(current_user)
    
    db.session.commit()

    return json_response(True)


@app.route('/ebank/equip_card_style/<int:style_id>')
@login_required
def route_equip_card_style(style_id):
    style = EbankCardStyle.query.get(style_id)
    
    if style is None:
        return json_response(False, error='STYLE_NOT_FOUND')
    
    if not style.is_available_for(current_user):
        return json_response(False, error='STYLE_NOT_AVAILABLE')

    current_user.equipped_ebank_card_style = style

    db.session.commit()

    return json_response(True)


@app.route('/ebank/add_card_style', methods=['POST'])
def route_add_card_style():
    name = request.json['name']
    style_json = request.json['style_json']
    price = request.json['price']

    s = EbankCardStyle(name=name, price=price, style_json=style_json)

    db.session.add(s)
    db.session.commit()

    return json_response(True, id=s.id)


@app.route('/ebank/delete_card_style/<int:style_id>')
def route_delete_card_style(style_id):
    style = EbankCardStyle.query.get(style_id)

    if not style:
        return json_response(False, error="STYLE_NOT_FOUND")
    
    db.session.delete(style)
    db.session.commit()

    return json_response(True)

