generated_password_length = 10
feed_limit = 4
bcrypt_salt = 5
host = "0.0.0.0"

dev = False

if dev:
    email_confirmation = True
    port = 80
    ssl = False
else:
    email_confirmation = True
    port = 443
    ssl = True

max_accounts_per_email = 3
secret_key = "kheres"
react_app_folder = "client"
email_sender = "mrkostinilya@gmail.com"
email_app_pw = "ogql qywh ialc sfpk"
email_conf_lifetime_minutes = 5
user_files_folder = "user_files"
yoomoney_token = "4100118633515143.1627D68B27A4F61683D6553FC9166AE7822D418FD50913A69ED4E83349FF24B5EE2C9B5D739797C50CDE0BDD6454090CA695670C06C246AA23DF036F09C183FC3CFFECB78BFB3DC6E5CD620BA3EE10D171C7A1BD049B7572541A6902A336D5697D647E9BFBE64A6310DAA430760C773963D7A05E23244C7D05EE8032214C0BD0"
yoomoney_account_id = "4100118633515143"
ebl_to_roubles = 8.5397

