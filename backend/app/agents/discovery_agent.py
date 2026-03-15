from pydantic import BaseModel, Field
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0,
    seed=42,
)

class ScheduleExtraction(BaseModel):
    date: Optional[str] = Field(description="The date of the meeting in YYYY-MM-DD format, or null if not found")
    time: Optional[str] = Field(description="The time of the meeting in HH:MM format (24h), or null if not found")
    timezone: Optional[str] = Field(description="The timezone mentioned (e.g., IST, PST, EST), or null if not found")
    reasoning: str = Field(description="Why you extracted this date/time")

SCHEDULING_PROMPT = """You are a Scheduling Intelligence Agent (High Precision).
Analyze the following email reply from a prospect and extract the proposed meeting date, time, and timezone.

Email Reply:
"{reply_text}"

Current Reference Date (Today): {current_date}
Company Location Context: {location_context}

Instructions:
1. Extract the specific date and time. If they say "tomorrow", "next Monday", or "friday at 4", calculate it correctly based on the reference date.
2. Identify the timezone. 
   - If mentioned explicitly (IST, PST, EST, etc.), use that.
   - If NOT mentioned, use the provided Company Location Context ({location_context}) to infer the most likely timezone for that region.
3. Convert time to 24h format (HH:MM).
4. If they give multiple slots, pick the FIRST one.

IMPORTANT: Always prioritize accuracy. If the date is 20/03/2026, return exactly 2026-03-20.
"""

def extract_schedule_info(reply_text: str, current_date: str, location_context: str):
    structured_llm = llm.with_structured_output(ScheduleExtraction)
    prompt = ChatPromptTemplate.from_template(SCHEDULING_PROMPT)
    chain = prompt | structured_llm
    
    try:
        extraction = chain.invoke({
            "reply_text": reply_text, 
            "current_date": current_date,
            "location_context": location_context
        })
        return extraction.model_dump()
    except Exception as e:
        print(f"Schedule Extraction Error: {e}")
        return None

DISCOVERY_DRAFTER_PROMPT = """You are a Strategic Deal Closer.
Draft a high-touch Discovery Call request email.

User Company Info: {user_company_intel}
Decision Maker: {dm_name} ({dm_position}) at {target_company}
Prospect's Last Interest: "{last_interest_context}"

Goal: Ask for a 15-minute discovery call. Be professional, organic, and reference their previous reply to show it's a person writing this, not a bot.
"""

class DiscoveryEmailResponse(BaseModel):
    subject: str = Field(description="The professional subject line")
    body: str = Field(description="The organic email body")

def draft_discovery_request(user_intel: dict, dm_name: str, dm_position: str, target_company: str, last_interest: str):
    structured_llm = llm.with_structured_output(DiscoveryEmailResponse)
    prompt = ChatPromptTemplate.from_template(DISCOVERY_DRAFTER_PROMPT)
    chain = prompt | structured_llm
    
    try:
        response = chain.invoke({
            "user_company_intel": str(user_intel),
            "dm_name": dm_name,
            "dm_position": dm_position,
            "target_company": target_company,
            "last_interest_context": last_interest
        })
        return response.model_dump()
    except Exception as e:
        print(f"Discovery Draft Error: {e}")
        return None
