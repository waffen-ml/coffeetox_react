from email.message import EmailMessage
import ssl
import smtplib
import random
import uuid
import datetime

EMAIL_SENDER = 'mrkostinilya@gmail.com'
EMAIL_PASSWORD = 'ogql qywh ialc sfpk'
CONFIRMATION_LIFETIME_MINUTES = 5

context = ssl.create_default_context()
smtp = smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context)
smtp.login(EMAIL_SENDER, EMAIL_PASSWORD)
confirmations = {}

def send_email_confirmation(email_address, reg_data):

    confirmation_key = uuid.uuid4().hex
    confirmation_code = random.randint(10**5, 10**6 - 1)

    confirmations[confirmation_key] = {
        'confirmation_code': confirmation_code,
        'data': reg_data,
        'datetime': datetime.datetime.now()
    }

    email = EmailMessage()
    email['From'] = EMAIL_SENDER
    email['To'] = email_address
    email['Subject'] = 'Подтверждение адреса почты'
    email.set_content(f'Код подтверждения: {confirmation_code}\nПокажите его всем, кому сможете!\nОн просрочится через 5 минут.')

    smtp.sendmail(EMAIL_SENDER, email_address, email.as_string())

    return confirmation_key

def remove_old_confirmations():
    now = datetime.datetime.now()

    for k, v in confirmations.items():
        if (now - v['datetime']).seconds / 60 > CONFIRMATION_LIFETIME_MINUTES:
            del confirmations[k]
        
def confirm_email(key, code):
    remove_old_confirmations()

    if key in confirmations and str(confirmations[key]['confirmation_code']) == str(code):
        return confirmations.pop(key)['data']
    
    return None

def contains_tag(tag):
    remove_old_confirmations()

    for k, v in confirmations.items():
        if v['data']['tag'] == tag:
            return True
    return False