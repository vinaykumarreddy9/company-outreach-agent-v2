from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import requests
from pydantic import BaseModel, Field
from typing import List
import json
import os
from dotenv import load_dotenv

load_dotenv()

ZENSERP_API_KEY = os.getenv("ZENSERP_API_KEY")

llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0,
)

class CompanyProfile(BaseModel):
    name: str = Field(description="Official company name")
    website: str = Field(description="Verified website URL or 'unknown'")
    linkedin: str = Field(description="LinkedIn company URL")
    location: str = Field(description="HQ or office location")
    employee_count: str = Field(description="Employee count range")
    description: str = Field(description="Business focus snippet")
    deep_research: str = Field(description="Analysis of why this company is a high-value target")
    similarity_score: int = Field(description="Score from 0-100 based on synergy")
    score_reason: str = Field(description="Reasoning for the assigned score")
    stage_1_passed: bool = Field(description="True if location matches criteria")

class ExtractedCompanies(BaseModel):
    companies: List[CompanyProfile] = Field(description="List of extracted and audited unique companies")

def perform_zenserp_search(q: str, pages: int = 3) -> list:
    all_results = []
    headers = {"apikey": ZENSERP_API_KEY} if ZENSERP_API_KEY else {}
    
    print(f" [Zenserp] Searching {pages} pages for: {q}")
    for page in range(pages):
        start = page * 10
        params = {
            "q": q,
            "num": 10,
            "start": start,
            "engine": "google",
        }
        try:
            response = requests.get('https://app.zenserp.com/api/v2/search', headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            page_results = data.get("organic", [])
            if not page_results: 
                print(f" [Zenserp] No more results on page {page+1}")
                break
            all_results.extend(page_results)
            print(f" [Zenserp] Page {page+1} found {len(page_results)} results.")
        except Exception as e:
            print(f" [Zenserp] Error on page {page+1}: {e}")
            break
    return all_results

def find_target_companies(target_criteria: dict, user_offering: list):
    user_offering_str = ", ".join(user_offering)
    industry = target_criteria.get("industry", "N/A")
    location = target_criteria.get("location", target_criteria.get("region", "N/A"))
    emp_count = target_criteria.get("employee_count")
    
    # 1. Dynamic LinkedIn Query
    if emp_count:
        query = f'site:linkedin.com/company "{industry}" "{location}" "{emp_count}"'
    else:
        query = f'site:linkedin.com/company "{industry}" "{location}"'
    
    # 2. Sequential 3-Page Fetch (Total 30 results expected)
    raw_results = perform_zenserp_search(query, pages=3)
    
    if not raw_results:
        print(" [Finder] Zero results found.")
        return

    # 3. LLM Extraction & Deduplication Node
    structured_llm = llm.with_structured_output(ExtractedCompanies)
    
    emp_hint = f"Desired Employee Count: {emp_count}" if emp_count else "Any size (Startup to Enterprise)."
    
    sys_prompt = f"""
    You are a Senior Lead Generation Auditor. Your task is to extract, verify, and deduplicate high-fidelity target companies from raw Google Search snippets.
    
    TARGET CRITERIA:
    - Target Industry: {industry}
    - Target Location: {location}
    - {emp_hint}
    - User Offering (Synergy): {user_offering_str}
    
    SCORING ENGINE RULES:
    1. EXTRACT: Only extract legitimate companies. Ignore aggregators (G2, Clutch, etc.) unless they are specifically about the company.
    2. DEDUPLICATE: Merge multiple snippets for the same entity into one high-quality entry.
    3. LOCATION VALIDATION (stage_1_passed): 
       - Set to True if the snippet confirms they are in "{location}" OR have a significant regional presence/branch there.
       - Set to False if they are strictly located elsewhere with no mention of "{location}".
    4. SYNERGY AUDIT (similarity_score 0-100):
       - Compare the target's business model with: "{user_offering_str}".
       - 90-100: Perfect match (e.g., they need our software to run their business).
       - 70-89: Good match (complementary services/audience).
       - < 70: Low synergy or irrelevant industry.
    5. DATA COMPLETENESS: Ensure website is 'unknown' if not found, rather than guessing.
    6. OUTPUT LIMIT: Return exactly the top 15 most relevant unique companies. If fewer than 15 exist, return all relevant ones.
    
    Think step-by-step for each raw result before adding to the output.
    """
    
    messages = [
        SystemMessage(content=sys_prompt),
        HumanMessage(content=f"Raw Search Results:\n{json.dumps(raw_results, indent=2)}")
    ]
    
    try:
        print(f" [Finder] LLM Audit & Deduplication of {len(raw_results)} candidates...")
        response = structured_llm.invoke(messages)
        
        # Binary validation for the database worker
        for co in response.companies[:15]:
            result = co.model_dump()
            
            # Map for worker compatibility
            result["rejection_reason"] = "Location or Industry mismatch" if not co.stage_1_passed or co.similarity_score < 70 else None
            result["contact_email"] = "N/A"
            result["contact_number"] = "N/A"
            
            yield result
            
    except Exception as e:
        print(f" [Finder] LLM Error: {e}")
