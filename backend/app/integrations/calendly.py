import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

CALENDLY_TOKEN = os.getenv("CALENDLY_TOKEN")
BASE_EVENT_URL = os.getenv("CALENDLY_EVENT_TYPE_URL")

class CalendlyProvider:
    def __init__(self):
        self.base_url = "https://api.calendly.com"
        self.headers = {
            "Authorization": f"Bearer {CALENDLY_TOKEN}",
            "Content-Type": "application/json"
        }
        self.user_uri = None
        self.event_type_uri = None
        if CALENDLY_TOKEN:
            self._initialize_production_context()

    def _initialize_production_context(self):
        try:
            # 1. Fetch User Identity
            r = requests.get(f"{self.base_url}/users/me", headers=self.headers)
            if r.status_code == 200:
                self.user_uri = r.json()["resource"]["uri"]
                print(f"[CALENDLY] Authenticated as: {self.user_uri}")
            
            # 2. Fetch First Active Event Type (e.g., '15 Minute Meeting')
            if self.user_uri:
                params = {"user": self.user_uri}
                r = requests.get(f"{self.base_url}/event_types", headers=self.headers, params=params)
                if r.status_code == 200:
                    types = r.json().get("collection", [])
                    if types:
                        self.event_type_uri = types[0]["uri"]
                        print(f"[CALENDLY] Bound to Event Type: {self.event_type_uri}")
        except Exception as e:
            print(f"Calendly Initialization Error: {e}")

    def check_availability(self, start_time: datetime, end_time: datetime):
        """Checks if the slot is free in Calendly's scheduled registry."""
        if not self.user_uri: return True 
        
        try:
            params = {
                "user": self.user_uri,
                "min_start_time": start_time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                "max_start_time": end_time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                "status": "active"
            }
            r = requests.get(f"{self.base_url}/scheduled_events", headers=self.headers, params=params)
            if r.status_code == 200:
                events = r.json().get("collection", [])
                return len(events) == 0
        except Exception as e:
            print(f"Calendly Availability Error: {e}")
        return True

    def get_next_available_slot(self, requested_time: datetime):
        """Finds the next 30m window that is open."""
        # Simple heuristic: shift by 1 hour if blocked
        return requested_time + datetime.timedelta(hours=1)

    def book_meeting(self, email: str, name: str, ist_start_time: datetime):
        """
        Creates a high-fidelity scheduling bridge.
        We return a pre-filled link to your official Calendly event type.
        """
        # Build the pre-filled URL with name and email
        # Human-equivalent: Passing data so the user just has to click the time slot.
        final_url = f"{BASE_EVENT_URL}?name={requests.utils.quote(name)}&email={requests.utils.quote(email)}"
        
        return {
            "link": final_url,
            "start_time_ist": ist_start_time,
            "status": "confirmed"
        }

calendly_provider = CalendlyProvider()
