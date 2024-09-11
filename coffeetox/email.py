from email.message import EmailMessage
import ssl
import smtplib
import uuid
import datetime
import config


def send_email(to_email, subject='', content=''):
    context = ssl.create_default_context()
    smtp = smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context)
    smtp.login(config.email_sender, config.email_app_pw)

    email = EmailMessage()
    email['From'] = config.email_sender
    email['To'] = to_email
    email['Subject'] = subject
    email.set_content(content)
    
    smtp.sendmail(config.email_sender, to_email, email.as_string())

    smtp.quit()


class EmailConfirmationManager:
    def __init__(self):
        self.confirmations = {}

    def remove_old(self):
        now = datetime.datetime.now()

        for k, v in list(self.confirmations.items()):
            if (now - v['datetime']).seconds / 60 > config.email_conf_lifetime_minutes:
                del self.confirmations[k]

    def send(self, email_address, subject, content, payload, type='register'):
        key = uuid.uuid4().hex

        send_email(
            email_address,
            subject=subject,
            content=content.format(key=key)
        )

        self.confirmations[key] = {
            'type': type,
            'payload': payload,
            'datetime': datetime.datetime.now()
        }

    def complete(self, key):
        self.remove_old()

        if key not in self.confirmations:
            return None
        
        return self.confirmations.pop(key)['payload']


email_confirmation_manager = EmailConfirmationManager()
