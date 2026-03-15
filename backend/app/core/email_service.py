import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.port = int(os.getenv("EMAIL_PORT", 587))
        self.user = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.from_email = os.getenv("EMAIL_FROM")

    def send_email(self, to_email: str, subject: str, body: str, thread_id: str = None):
        if not all([self.user, self.password, self.from_email]):
            raise ValueError("Email credentials not fully configured in .env (EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM)")

        msg = MIMEMultipart()
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        
        # Unique Message-ID for tracking
        msg_id = make_msgid()
        msg["Message-ID"] = msg_id
        
        # Threading support
        if thread_id:
            msg["In-Reply-To"] = thread_id
            msg["References"] = thread_id

        # Check if body is HTML-like
        if "<p>" in body or "<html>" in body:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.send_message(msg)
                return msg_id
        except Exception as e:
            print(f"Error sending email: {e}")
            raise e

email_service = EmailService()
