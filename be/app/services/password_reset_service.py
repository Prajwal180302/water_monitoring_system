import hashlib
import hmac
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage

from flask import current_app

from app.extensions import db
from app.models.password_reset_model import PasswordResetToken
from app.models.user_model import User


def _hash(token: str) -> str:
    return hmac.new(current_app.config["SECRET_KEY"].encode(), token.encode(), hashlib.sha256).hexdigest()


def request_reset(email: str) -> None:
    user = User.query.filter_by(email=email).first()
    if not user:
        return
    PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).update({"used_at": datetime.utcnow()})
    token = secrets.token_urlsafe(32)
    record = PasswordResetToken(user_id=user.id, token_hash=_hash(token), expires_at=datetime.utcnow() + timedelta(minutes=15))
    db.session.add(record)
    db.session.commit()
    url = f"{current_app.config['PASSWORD_RESET_URL']}?token={token}"
    if current_app.config["PASSWORD_RESET_CONSOLE"]:
        current_app.logger.warning("Local password-reset link for %s: %s", user.email, url)
        return
    message = EmailMessage()
    message["Subject"] = "Reset your Water Monitoring password"
    message["From"] = current_app.config["SMTP_FROM"]
    message["To"] = user.email
    message.set_content(f"Open this link within 15 minutes to reset your password: {url}")
    with smtplib.SMTP(current_app.config["SMTP_HOST"], current_app.config["SMTP_PORT"]) as smtp:
        if current_app.config["SMTP_TLS"]:
            smtp.starttls()
        if current_app.config["SMTP_USERNAME"]:
            smtp.login(current_app.config["SMTP_USERNAME"], current_app.config["SMTP_PASSWORD"])
        smtp.send_message(message)


def reset_password(token: str, password: str) -> bool:
    record = PasswordResetToken.query.filter_by(token_hash=_hash(token), used_at=None).first()
    if not record or record.expires_at < datetime.utcnow():
        return False
    user = db.session.get(User, record.user_id)
    if not user:
        return False
    import bcrypt
    user.password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    record.used_at = datetime.utcnow()
    db.session.commit()
    return True
