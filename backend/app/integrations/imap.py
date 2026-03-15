import imaplib
import email
from email.header import decode_header
import os
from dotenv import load_dotenv

load_dotenv()

class IMAPProvider:
    def __init__(self):
        self.host = os.getenv("IMAP_SERVER", "imap.gmail.com")
        self.user = os.getenv("IMAP_USER") or os.getenv("EMAIL_USER")
        self.password = os.getenv("IMAP_PASSWORD") or os.getenv("EMAIL_PASSWORD")
        
    def get_latest_replies(self):
        """Polls the inbox for UNSEEN messages and extracts metadata for threading."""
        # Refresh from env in case they was set dynamically
        if not self.user: self.user = os.getenv("IMAP_USER") or os.getenv("EMAIL_USER")
        if not self.password: self.password = os.getenv("IMAP_PASSWORD") or os.getenv("EMAIL_PASSWORD")
        if not self.host: self.host = os.getenv("IMAP_SERVER", "imap.gmail.com")

        if not all([self.host, self.user, self.password]):
            print(f"IMAP config missing: host={self.host}, user={self.user}, pass={'SET' if self.password else 'MISSING'}")
            return []
            
        try:
            # Connect to the server
            mail = imaplib.IMAP4_SSL(self.host)
            mail.login(self.user, self.password)
            mail.select("inbox")
            
            # Search for unread messages
            status, messages = mail.search(None, 'UNSEEN')
            
            if status != 'OK' or not messages[0]:
                mail.logout()
                return []
                
            replies = []
            for num in messages[0].split():
                status, data = mail.fetch(num, '(RFC822)')
                for response_part in data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Decode Subject
                        subject_raw = msg.get("Subject", "")
                        decoded_parts = decode_header(subject_raw)
                        subject = ""
                        for part, encoding in decoded_parts:
                            if isinstance(part, bytes):
                                subject += part.decode(encoding if encoding else 'utf-8', errors='ignore')
                            else:
                                subject += str(part)
                            
                        from_ = msg.get("From", "")
                        
                        # Extract Body
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                content_type = part.get_content_type()
                                content_disposition = str(part.get("Content-Disposition"))
                                if content_type == "text/plain" and "attachment" not in content_disposition:
                                    try:
                                        body = part.get_payload(decode=True).decode(errors='ignore')
                                        break
                                    except:
                                        pass
                        else:
                            body = msg.get_payload(decode=True).decode(errors='ignore')
                            
                        # Strategic Header Extraction
                        msg_id = (msg.get("Message-ID") or "").strip()
                        in_reply_to = (msg.get("In-Reply-To") or "").strip()
                        references = (msg.get("References") or "").strip()
                        
                        replies.append({
                            "message_id": msg_id,
                            "in_reply_to": in_reply_to,
                            "references": references,
                            "from": from_,
                            "subject": subject,
                            "body": body,
                            "date": msg.get("Date")
                        })
                        print(f"[IMAP] Captured potential reply: {subject} from {from_} (ID: {msg_id})")
                        
            # Mark as seen if necessary (or let the worker handle it)
            # mail.store(num, '+FLAGS', '\\Seen') 
            
            mail.close()
            mail.logout()
            return replies
        except Exception as e:
            print(f"IMAP Extraction Error: {e}")
            return []

imap_provider = IMAPProvider()
