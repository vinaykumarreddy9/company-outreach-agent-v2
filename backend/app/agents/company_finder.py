import os
import json
import requests
import re
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# LangChain / OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Try to import search tools (Safe imports)
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

try:
    # On some systems this is 'from ddgs import DDGS', on others 'from duckduckgo_search import DDGS'
    # We follow the project's requirements.txt which lists 'ddgs'
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

# Load environment
load_dotenv()

# API Keys
ZENSERP_API_KEY = os.getenv("ZENSERP_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# --- DATA MODELS ---

class DeduplicatedCompany(BaseModel):
    name: str = Field(description="Clean, official company name.")
    linkedin_url: str = Field(description="LinkedIn company profile URL.")
    description: str = Field(description="Short snippet from search.")

class DeduplicationResult(BaseModel):
    companies: List[DeduplicatedCompany]

class CompanyValidation(BaseModel):
    name: str
    company_type: str = Field(description="The specific sub-vertical or niche (e.g., 'Precision Aerospace Manufacturing').")
    employee_count: str = Field(description="The exact headcount or range found in research (e.g., '501-1,000'). Use 'N/A' if unknown.")
    is_industry_match: bool = Field(description="True if the entity STRICTLY matches the target sector's primary operating nature.")
    is_primary_operator: bool = Field(description="CRITICAL: True ONLY if they are a core player (e.g. they ARE manufacturers), not just a supplier/software provider for that sector.")
    is_offering_synergy: bool = Field(description="True if there is a demonstrated ROI potential for our unique offerings.")
    synergy_score: int = Field(description="0-100 score.")
    val_reasoning: str = Field(description="Match analysis focusing on Primary vs Tertiary sector roles.")
    is_valid_lead: bool = Field(description="Final decision. True only if Synergy > 80% and is_primary_operator is True.")

# --- PIPELINE COMPONENTS ---

class CompanyFinderPipeline:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0,
            seed=42,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        self.tavily = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY and TavilyClient else None

    def get_domain(self, url: str) -> str:
        try:
            if not url or url == "unknown": return "unknown"
            domain = urlparse(url).netloc
            return domain[4:] if domain.startswith("www.") else domain
        except: return "unknown"

    def stage_1_recon(self, industry: str, location: str, size: str) -> list:
        query = f'site:linkedin.com/company "{industry}" "{location}"'
        if size: query += f' "{size}"'
        
        print(f" [Pipeline] Stage 1: Zenserp Recon for '{query}'")
        all_results = []
        headers = {"apikey": ZENSERP_API_KEY} if ZENSERP_API_KEY else {}
        
        for page in range(3): # Fetch 3 pages (30 results)
            params = {"q": query, "num": 10, "start": page * 10, "engine": "google"}
            try:
                response = requests.get('https://app.zenserp.com/api/v2/search', headers=headers, params=params)
                response.raise_for_status()
                page_results = response.json().get("organic", [])
                if not page_results: break
                all_results.extend(page_results)
            except Exception as e:
                print(f" [Pipeline] Recon Error Page {page+1}: {e}")
                break
        return all_results

    def stage_2_dedup(self, raw_results: list) -> List[DeduplicatedCompany]:
        if not raw_results: return []
        print(f" [Pipeline] Stage 2: Deduplicating {len(raw_results)} snippets...")
        structured_llm = self.llm.with_structured_output(DeduplicationResult)
        
        sys_prompt = "You are a Lead Auditor. Merge duplicates and aliases. Reject aggregators (Clutch, G2). Return clean company list."
        messages = [SystemMessage(content=sys_prompt), HumanMessage(content=json.dumps(raw_results, indent=2))]
        
        try:
            return structured_llm.invoke(messages).companies
        except Exception as e:
            print(f" [Pipeline] Dedup Error: {e}")
            return []

    def stage_3_research_one(self, company_name: str) -> dict:
        print(f" [Pipeline] Researching: {company_name}...")
        results = []
        site = "unknown"
        
        # 1. Tavily
        if self.tavily:
            try:
                resp = self.tavily.search(query=f'"{company_name}" official website about us', search_depth="advanced", max_results=3)
                t_results = resp.get('results', [])
                results.extend(t_results)
                for r in t_results:
                    url = r.get('url', '')
                    if not any(x in url.lower() for x in ["linkedin.com", "facebook.com", "twitter.com"]):
                        site = url; break
            except: pass

        # 2. DDGS Fallback
        if DDGS and (site == "unknown"):
            try:
                with DDGS() as ddgs:
                    ddg_results = list(ddgs.text(f'"{company_name}" official website', max_results=3))
                    for r in ddg_results:
                        results.append({"title": r['title'], "url": r['href'], "content": r['body']})
                        if site == "unknown": site = r['href']
            except: pass

        return {
            "name": company_name, 
            "website": site, 
            "domain": self.get_domain(site), 
            "raw_research": results
        }

    def stage_4_validate(self, industry: str, offerings: List[str], res_data: dict) -> CompanyValidation:
        structured_llm = self.llm.with_structured_output(CompanyValidation)
        off_str = ", ".join(offerings)
        
        sys_prompt = f"""Expert Lead Auditor. 
Target Sector: {industry}. 
Our Offerings: {off_str}. 

MISSION: 
1. Identify the EXACT company sub-vertical and employee size from research.
2. VERTICAL INTEGRITY AUDIT: You must distinguish between Primary Operators (Makers) and Tertiary Service Providers (Suppliers/Consultants). 
   - If Target is 'Manufacturing', only approve ACTUAL manufacturers.
   - REJECT if they are a supply/service/software company catering TO the sector.
   - REJECT if they are pure traders or distributors.
3. SYNERGY AUDIT: Match our offerings to their core pain points. 

CRITICAL: REJECT if Synergy < 80% or is_primary_operator is False."""
        context = json.dumps(res_data.get('raw_research', [])[:3], indent=2)
        
        msg = f"Company: {res_data['name']}\nWebsite: {res_data['website']}\nResearch Data:\n{context}"
        try:
            return structured_llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=msg)])
        except Exception as e:
            print(f" [Pipeline] Validation failed for {res_data['name']}: {e}")
            return CompanyValidation(name=res_data['name'], is_industry_match=False, is_offering_synergy=False, synergy_score=0, val_reasoning="Sync Error", is_valid_lead=False)

    def stage_3_synthesize(self, name: str, raw_research: List[Dict]) -> str:
        """
        Uses LLM to convert noisy search snippets into a clean, high-fidelity narrative.
        """
        if not raw_research:
            return "No verifiable research artifacts discovered."

        prompt = f"""You are a Lead Intelligence Analyst. 
RECON DATA for {name}:
{json.dumps(raw_research, indent=2)}

MISSION: 
- Transform these raw, noisy search snippets into a clean, human-readable intelligence report.
- CRITICAL: Do not miss any tangible data points (locations, specific products, employee size, tech stack).
- FORMAT: Use professional prose and clear bullet points. 
- QUALITY: Strictly remove all JSON noise, escaped characters (like \\u2019), and technical metadata.
- Output ONLY the formatted report."""

        messages = [
            SystemMessage(content="You are a meticulous Lead Intelligence Analyst. Output only high-fidelity, clean reports."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = self.llm.invoke(messages)
            return response.content.strip()
        except Exception as e:
            print(f" [Pipeline] Synthesis failed for {name}: {e}")
            return "Analysis pending synchronized review."

# --- PROD INTERFACE ---

def find_target_companies(target_criteria: dict, user_offerings: list):
    """
    Main entry point for the Company Finder Agent.
    Orchestrates the 4-stage ELITE pipeline.
    """
    pipeline = CompanyFinderPipeline()
    
    industry = target_criteria.get("industry", "Manufacturing")
    location = target_criteria.get("location", "UK")
    size = target_criteria.get("employee_count", "")

    # 1. Recon
    raw_candidates = pipeline.stage_1_recon(industry, location, size)
    if not raw_candidates: return

    # 2. Dedup
    unique_companies = pipeline.stage_2_dedup(raw_candidates)
    if not unique_companies: return

    # 3. Deep Research (Concurrent)
    research_results = []
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(pipeline.stage_3_research_one, c.name): c for c in unique_companies}
        for f in as_completed(futures):
            research_results.append((f.result(), futures[f]))

    # 4. Final Audit (Validation)
    for res_item, original_meta in research_results:
        print(f" [Pipeline] Auditing {res_item['name']}...")
        audit = pipeline.stage_4_validate(industry, user_offerings, res_item)
        
        # 5. Synthesis (Human Readable Reframe)
        print(f" [Pipeline] Synthesizing narrative for {res_item['name']}...")
        clean_research = pipeline.stage_3_synthesize(res_item['name'], res_item['raw_research'])

        is_valid = audit.is_valid_lead
        
        yield {
            "name": res_item['name'],
            "website": res_item['website'],
            "domain": res_item['domain'],
            "linkedin": original_meta.linkedin_url,
            "location": location,
            "company_type": audit.company_type,
            "employee_count": audit.employee_count,
            "description": original_meta.description,
            "deep_research": clean_research,
            "similarity_score": audit.synergy_score,
            "score_reason": audit.val_reasoning,
            "status": "NEW" if is_valid else "REJECTED",
            "rejection_reason": audit.val_reasoning if not is_valid else None
        }
