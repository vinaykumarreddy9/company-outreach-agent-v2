# Company Outreach Agent v2

A high-fidelity, autonomous outreach system designed to discover companies, identify decision-makers, and manage the entire booking lifecycle from initial email to meeting confirmation.

## 🚀 Key Features

### 1. Autonomous Company & DM Discovery
- **Deep Research**: Uses Exa and Tavily to research companies deeply based on industry and location.
- **Stakeholder Identification**: Finds and validates key decision-makers using Zenserp and custom filtering logic.
- **HubSpot Integration**: Automatically syncs discovered leads to your HubSpot CRM.

### 2. Intelligent Multi-Phase Emailing
- **Hyper-Personalized Content**: Generates emails referencing company-specific research.
- **Autonomous Follow-ups**: Manages up to 11 follow-up nudges if no reply is received.
- **Intent Classification**: Uses GPT-4o-mini to classify replies into Positive, Neutral, or Negative intents.

### 3. Auto-Booking Protocol (Production Grade)
- **Natural Language Extraction**: Extracts date/time/timezone from prospect replies even from casual phrasing.
- **Contextual Timezone Inference**: If a prospect doesn't mention a timezone, the agent uses their company location to infer the correct zone.
- **IST Normalization**: Automatically converts all international times to **Indian Standard Time (IST)** with 10.5h (EST) or custom offsets.
- **Calendly Sync**: Integration with Calendly API to check availability and programmatically "secure" meeting slots.

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL (Neon), Celery, Redis.
- **Frontend**: React, Vite, Framer Motion, Tailwind CSS.
- **AI/LLM**: GPT-4o-mini, LangChain, LangGraph.
- **Search**: Tavily, Exa AI, Zenserp.
- **Integrations**: HubSpot, Calendly, IMAP/SMTP.

## 📦 Deployment

The application is optimized for **Render (Free Tier)**.

### Backend Setup
1. Deploy as a Web Service.
2. Build Command: `cd backend && pip install -r requirements.txt`
3. Start Command: `cd backend && chmod +x render-start.sh && ./render-start.sh`
4. Set environment variables (refer to `backend/.env.example`).

### Frontend Setup
1. Deploy as a Static Site.
2. Build Command: `cd frontend && npm install && npm run build`
3. Publish Directory: `frontend/dist`
4. Set Environment Variable: `VITE_API_BASE_URL` to your backend URL.

## ⚙️ Development

```bash
# Run locally (uses fallback SQLite if no NEON_DB_URL is provided)
./run.bat
```

## 📄 License
MIT
