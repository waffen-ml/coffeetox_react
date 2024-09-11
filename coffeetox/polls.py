from coffeetox import db, app
from flask_login import login_required, current_user
from flask import request
from sqlalchemy.orm import backref


class PollOption(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.String(length=100), nullable=False)
    poll_id = db.Column(db.Integer(), db.ForeignKey('poll.id'), nullable=False)

    poll = db.relationship('Poll', back_populates='options', uselist=False)
    votes = db.relationship('PollVote', back_populates='option', cascade="all,delete", uselist=True)

    def get_voters(self):
        return [v.user for v in self.votes]

    def to_dict(self, include_voters):
        out = {
            'id': self.id,
            'label': self.label,
            'num_voters': len(self.votes)
        }

        if include_voters:
            out['voters'] = [u.to_dict() for u in self.get_voters()]
        
        return out


class PollVote(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    option_id = db.Column(db.Integer(), db.ForeignKey('poll_option.id'), nullable=False)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    
    option = db.relationship('PollOption', back_populates='votes', uselist=False)
    user = db.relationship('User', backref=backref('votes', cascade='all,delete'), uselist=False)


class Poll(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    is_anonymous = db.Column(db.Boolean(), default=False)
    title = db.Column(db.String(length=100), default='')
    options = db.relationship('PollOption', back_populates='poll', cascade='all,delete', uselist=True)

    def add_options(self, options):
        # do it after adding poll to db

        for option in options:
            opt_obj = PollOption(label=option, poll_id=self.id)
            db.session.add(opt_obj)

        db.session.commit()

    def get_user_vote(self, user):
        vote = PollVote.query\
            .join(PollOption, PollOption.id == PollVote.option_id)\
            .filter((PollVote.user_id == user.id) & (PollOption.poll_id == self.id))\
            .first()
        
        return vote
    
    def retract_user_vote(self, user):
        vote = self.get_user_vote(user)

        if vote is None:
            return False

        db.session.delete(vote)
        db.session.commit()

        return True

    def pass_user_vote(self, user, option):
        self.retract_user_vote(user)

        if user.id is None:
            return

        vote = PollVote(user_id=user.id, option_id=option.id)

        db.session.add(vote)
        db.session.commit()

    def to_dict(self, me=None):
        my_vote = None if me is None else self.get_user_vote(me)
        my_vote_id = None if my_vote is None else my_vote.option_id

        return {
            'options': [
                op.to_dict(include_voters=not self.is_anonymous) for op in self.options
            ],
            'num_voters': sum([len(op.votes) for op in self.options]),
            'my_vote_id': my_vote_id,
            'title': self.title,
            'is_anonymous': self.is_anonymous
        }
    

@app.route('/polls/vote/<int:option_id>')
@login_required
def route_vote(option_id):
    option = PollOption.query.get(option_id)
    retract = int(request.args.get('retract', 0))

    if option is None:
        return {
            'success': 0,
            'error': 'INVALID_OPTION_ID'
        }
    
    if retract:
        option.poll.retract_user_vote(current_user)
    else:
        option.poll.pass_user_vote(current_user, option)

    return {
        'success': 1
    }


