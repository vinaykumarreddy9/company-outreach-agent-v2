from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.integrations.search import search_provider
from pydantic import BaseModel, Field
from typing import List
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

# We use gpt-4o-mini for efficient extraction and auditing
llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0,
)

class DecisionMakerSchema(BaseModel):
    name: str = Field(description="Full Name of the stakeholder")
    position: str = Field(description="Exact and current official title")
    linkedin: str = Field(description="Full LinkedIn profile URL")
    seniority_score: int = Field(description="Score based on executive seniority (0-100)")
    score_reason: str = Field(description="Justification for their active seniority status and current role verification")

class DMFinderResponse(BaseModel):
    decision_makers: List[DecisionMakerSchema] = Field(description="List of validated high-level stakeholders")

def clean_linkedin_url(url: str) -> str:
    """Strips tracking parameters from LinkedIn URLs."""
    if not url: return "unknown"
    # Basic regex to keep the core profile path
    match = re.search(r'(https?://[a-z]+\.linkedin\.com/in/[a-zA-Z0-9_-]+)', url)
    return match.group(1) if match else url

def find_decision_makers(company_name: str, location: str):
    """
    Inputs: Registered company name and city/region.
    Logic:
    1. Two-pass search (C-Suite vs leadership) using Tavily Advanced & DDGS with Location Fencing.
    2. LLM-based extraction, high-fidelity audit (Current vs Former), and deduplication.
    3. Yields Top 3 most senior stakeholders.
    """
    print(f" [DM Finder] Starting localized stakeholder research for: {company_name} in {location}")
    
    # 1. Dual-Tier Query Strategy with Location Fencing
    # We include the location to avoid finding DMs from different branches/companies with same names.
    queries = [
        f'site:linkedin.com/in "{company_name}" "{location}" ("CEO" OR "CTO" OR "Founder" OR "Managing Director")',
        f'site:linkedin.com/in "{company_name}" "{location}" ("VP" OR "Director" OR "Head of")'
    ]
    
    all_raw_results = []
    seen_urls = set()
    
    # 2. Parallel Search Execution
    for q in queries:
        try:
            results = search_provider.parallel_search(q)
            for r in results:
                if r['url'] not in seen_urls:
                    all_raw_results.append(r)
                    seen_urls.add(r['url'])
        except Exception as e:
            print(f" [DM Finder] Search failed for query '{q}': {e}")
            
    if not all_raw_results:
        print(f" [DM Finder] Zero candidates found for {company_name} in {location}")
        return []

    # 3. LLM Audit with Location Context
    structured_llm = llm.with_structured_output(DMFinderResponse)
    
    sys_prompt = f"""
    You are a Stakeholder Auditor. Analyze the search results for the company "{company_name}" located in "{location}" to extract and verify decision-makers.
    
    AUDIT CORE RULES:
    1. CURRENT ROLE & LOCATION: Strictly reject anyone marked as "Former" or whose snippet implies they left. Prioritize those explicitly working in the "{location}" region.
    2. HIGH SENIORITY: Target C-Suite (CEO, CTO, etc.), VP, Director, and Head of departments.
    3. DEDUPLICATE: If the same person appears in multiple results, merge them into ONE unique entry.
    4. CLEAN URLS: Ensure LinkedIn URLs are valid.
    5. SCORING: 
       - 90-100: C-Suite/Founders
       - 80-89: VP/Directors
       - 70-79: Head level
       - < 70: Ignore
    6. LIMIT: Return Top 3 unique, highest-scoring stakeholders.
    """
    
    messages = [
        SystemMessage(content=sys_prompt),
        HumanMessage(content=f"Company: {company_name}\nLocation: {location}\nSearch Results (JSON):\n{json.dumps(all_raw_results[:20], indent=2)}")
    ]
    
    try:
        print(f" [DM Finder] Verifying {len(all_raw_results)} snippets for {company_name} ({location})...")
        response = structured_llm.invoke(messages)
        
        final_dms = []
        for dm in response.decision_makers:
            if dm.seniority_score >= 70:
                dm_dict = dm.model_dump()
                dm_dict['similarity_score'] = dm.seniority_score
                dm_dict['linkedin'] = clean_linkedin_url(dm.linkedin)
                final_dms.append(dm_dict)
        
        # Ensure Top 3
        top_3 = sorted(final_dms, key=lambda x: x['similarity_score'], reverse=True)[:3]
        print(f" [DM Finder] Success: Verified {len(top_3)} local stakeholders for {company_name}.")
        return top_3
        
    except Exception as e:
        print(f" [DM Finder] LLM Verification failed: {e}")
        return []
