import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        # Port 465 (SSL) works on Render. Port 587 (STARTTLS) is blocked on free tier.
        self.host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.port = int(os.getenv("EMAIL_PORT", 465))
        self.user = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.from_email = os.getenv("EMAIL_FROM")

    def send_email(self, to_email: str, subject: str, body: str, thread_id: str = None):
        # Re-read env at send time to pick up Render's runtime env vars
        user = self.user or os.getenv("EMAIL_USER")
        password = self.password or os.getenv("EMAIL_PASSWORD")
        from_email = self.from_email or os.getenv("EMAIL_FROM")

        if not all([user, password, from_email]):
            raise ValueError("Email credentials not configured (EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM)")

        msg = MIMEMultipart()
        msg["From"] = from_email
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
            # Use SMTP_SSL (port 465) — works on all Render tiers unlike STARTTLS (port 587)
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.host, self.port, context=context) as server:
                server.login(user, password)
                server.send_message(msg)
                print(f"[EMAIL] Successfully sent to {to_email}")
                return msg_id
        except Exception as e:
            print(f"[EMAIL] Error sending to {to_email}: {e}")
            raise e

email_service = EmailService()
