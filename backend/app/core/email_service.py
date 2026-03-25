import os
import smtplib
import ssl
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("EMAIL_FROM")

        # SMTP fallback (local dev only)
        self.host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.port = 465  # Hardcoded — Render blocks 587
        self.user = os.getenv("EMAIL_USER")
        self.password = os.getenv("EMAIL_PASSWORD")

    def send_email(self, to_email: str, subject: str, body: str, thread_id: str = None) -> str:
        resend_key = self.resend_api_key or os.getenv("RESEND_API_KEY")
        from_email = self.from_email or os.getenv("EMAIL_FROM")

        if resend_key:
            return self._send_via_resend(resend_key, from_email, to_email, subject, body, thread_id)
        else:
            print("[EMAIL] No RESEND_API_KEY found — falling back to SMTP (local dev only)")
            return self._send_via_smtp(to_email, subject, body, thread_id)

    def _send_via_resend(self, api_key: str, from_email: str, to_email: str, subject: str, body: str, thread_id: str = None) -> str:
        """HTTP-based sending via Resend API — works on all cloud platforms including Render free tier."""
        is_html = "<p>" in body or "<html>" in body

        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
        }

        if is_html:
            payload["html"] = body
        else:
            payload["text"] = body

        if thread_id:
            payload["headers"] = {
                "In-Reply-To": thread_id,
                "References": thread_id
            }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            msg_id = response.json().get("id", "resend-ok")
            print(f"[EMAIL] Resend SUCCESS → {to_email} (id: {msg_id})")
            return msg_id
        except requests.HTTPError as e:
            error_body = e.response.text if e.response else str(e)
            print(f"[EMAIL] Resend HTTP error: {error_body}")
            raise Exception(f"Resend API error: {error_body}")
        except Exception as e:
            print(f"[EMAIL] Resend failed: {e}")
            raise e

    def _send_via_smtp(self, to_email: str, subject: str, body: str, thread_id: str = None) -> str:
        """Raw SMTP fallback — only works in local environments with open ports."""
        user = self.user or os.getenv("EMAIL_USER")
        password = self.password or os.getenv("EMAIL_PASSWORD")
        from_email = self.from_email or os.getenv("EMAIL_FROM")

        if not all([user, password, from_email]):
            raise ValueError("Email credentials missing: EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM")

        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg_id = make_msgid()
        msg["Message-ID"] = msg_id

        if thread_id:
            msg["In-Reply-To"] = thread_id
            msg["References"] = thread_id

        if "<p>" in body or "<html>" in body:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(self.host, self.port, context=context) as server:
            server.login(user, password)
            server.send_message(msg)
            print(f"[EMAIL] SMTP SUCCESS → {to_email}")
            return msg_id

email_service = EmailService()
