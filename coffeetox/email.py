from email.message import EmailMessage
import ssl
import smtplib
import random
import uuid
import datetime
from coffeetox import cfx_config

context = ssl.create_default_context()
smtp = smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context)
smtp.login(cfx_config.email_sender, cfx_config.email_app_pw)

class EmailConfirmationManager:
    def __init__(self):
        self.confirmations = {}

    def remove_old_confirmations(self):
        now = datetime.datetime.now()

        for k, v in self.confirmations.items():
            if (now - v['datetime']).seconds / 60 > cfx_config.email_conf_lifetime_minutes:
                del self.confirmations[k]

    def send_confirmation(self, email_address, payload, type='register'):
        confirmation_key = uuid.uuid4().hex
        confirmation_code = random.randint(10**5, 10**6 - 1)

        email = EmailMessage()
        email['From'] = cfx_config.email_sender
        email['To'] = email_address
        email['Subject'] = 'Подтверждение адреса почты'
        email.set_content(f'Код подтверждения: {confirmation_code}\nПокажите его всем, кому сможете!\nОн просрочится через {cfx_config.email_conf_lifetime_minutes} минут.')

        attempts = 5

        while attempts > 0:
            try:
                smtp.sendmail(cfx_config.email_sender, email_address, email.as_string())
            except smtplib.SMTPServerDisconnected:
                smtp.connect()
            else:
                break
            attempts -= 1
        else:
            raise Exception('Could not send email after multiple attempts')
        
        self.confirmations[confirmation_key] = {
            'type': type,
            'confirmation_code': confirmation_code,
            'payload': payload,
            'datetime': datetime.datetime.now()
        }
        
        return confirmation_key

    def complete_confirmation(self, key, code):
        self.remove_old_confirmations()

        if key in self.confirmations and str(self.confirmations[key]['confirmation_code']) == str(code):
            payload = self.confirmations[key]['payload']
            type = self.confirmations[key]['type']

            self.confirmations.pop(key)

            return payload, type
        
        return None, None

    def is_tag_about_to_be_registered(self, tag):
        self.remove_old_confirmations()

        for k, v in self.confirmations.items():
            if v['type'] == 'register' and v['payload']['tag'] == tag:
                return True
            
        return False


email_confirmation_manager = EmailConfirmationManager()
