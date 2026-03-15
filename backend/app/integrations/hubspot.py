import os
from hubspot import HubSpot
from hubspot.crm.contacts import SimplePublicObjectInputForCreate, SimplePublicObjectInput
from dotenv import load_dotenv

load_dotenv()

HUBSPOT_ACCESS_TOKEN = os.getenv("HUBSPOT_ACCESS_TOKEN")

class HubSpotProvider:
    def __init__(self):
        self.client = HubSpot(access_token=HUBSPOT_ACCESS_TOKEN) if HUBSPOT_ACCESS_TOKEN else None

    def create_lead(self, dm: dict, company_name: str):
        if not self.client:
            print("HubSpot not configured.")
            return None
        
        try:
            properties = {
                "firstname": dm.get("name", "").split(" ")[0],
                "lastname": dm.get("name", "").split(" ")[-1] if " " in dm.get("name", "") else "",
                "jobtitle": dm.get("position", ""),
                "company": company_name,
                "lifecyclestage": "lead",
                "hs_lead_status": "NEW"
            }
            simple_public_object_input_for_create = SimplePublicObjectInputForCreate(properties=properties)
            api_response = self.client.crm.contacts.basic_api.create(simple_public_object_input_for_create=simple_public_object_input_for_create)
            return api_response.id
        except Exception as e:
            print(f"HubSpot contact creation error: {e}")
            return None

    def update_lead_status(self, hubspot_id: str, status: str):
        if not self.client or not hubspot_id: return
        try:
            properties = {"hs_lead_status": status}
            simple_public_object_input = SimplePublicObjectInput(properties=properties)
            self.client.crm.contacts.basic_api.update(contact_id=hubspot_id, simple_public_object_input=simple_public_object_input)
            print(f"HubSpot Status Updated: {hubspot_id} -> {status}")
        except Exception as e:
            print(f"HubSpot update error: {e}")

hubspot_provider = HubSpotProvider()
