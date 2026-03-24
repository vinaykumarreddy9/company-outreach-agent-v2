import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Search, Users, Mail, 
  CheckCircle2, Loader2, AlertCircle,
  ArrowLeft, ExternalLink, Globe,
  Linkedin, MessageSquare, ChevronRight,
  Monitor, PhoneCall, FileBarChart,
  X, Edit3, Send, Trash, Maximize2, Clock, Calendar, Link2,
  TrendingUp, PieChart, Target, ShieldCheck
} from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../config";

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

const ensureAbsoluteUrl = (url) => {
  if (!url || url === "#" || url === "N/A") return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const cleanEmailReply = (body) => {
  if (!body) return "";
  const patterns = [
    /\n\s*On\s+.*\s+wrote:/i,
    /\n\s*-+\s*Original Message\s*-+/i,
    /\n\s*From:/i,
    /\n\s*> / 
  ];
  
  let cleaned = body;
  for (const pattern of patterns) {
    const splitIndex = cleaned.search(pattern);
    if (splitIndex !== -1) {
      cleaned = cleaned.substring(0, splitIndex).trim();
    }
  }
  return cleaned;
};

const DiscoveryTimer = ({ scheduledTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(scheduledTime) - new Date();
      if (diff <= 0) return "Starting Now";
      
      const parts = [];
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${mins}m`);
      
      setTimeLeft(parts.join(" "));
    };

    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [scheduledTime]);

  return (
    <div className="flex items-center gap-2 text-brand-primary font-black animate-pulse">
      <Clock size={14} />
      {timeLeft}
    </div>
  );
};

const CampaignWorkspace = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("research");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [draftEditData, setDraftEditData] = useState({ subject: "", body: "", email: "" });
  const [sendingId, setSendingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedReportCompany, setExpandedReportCompany] = useState(null);
  const [showHistoryDM, setShowHistoryDM] = useState(null);
  const [highlightedDraftId, setHighlightedDraftId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState([]);

  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

  const scrollToDraft = (dmId) => {
    if (!dmId || !campaign?.drafts) return;
    
    // Strategic Draft Identification Protocol
    const targetDraft = campaign.drafts.find(d => 
      String(d.decision_maker_id) === String(dmId) && 
      String(d.status).toUpperCase().includes("DRAFTED")
    );
    
    if (targetDraft) {
      const draftId = String(targetDraft.id);
      setHighlightedDraftId(draftId);
      
      // Delay scroll slightly to allow React state to propagate to DOM
      setTimeout(() => {
        const element = document.getElementById(`draft-card-${draftId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Auto-clear highlight after 5 seconds for better visibility
      setTimeout(() => {
        setHighlightedDraftId(null);
      }, 5000);
    }
  };
  const handleBatchDispatch = async () => {
    // Strategic Batch Deployment Protocol
    alert("Initiating Synchronized Batch Dispatch for all validated modules.");
  };

  const fetchCampaignDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/campaigns/${id}`);
      setCampaign(response.data);
    } catch (error) {
      console.error("Error fetching workspace details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();
    const interval = setInterval(fetchCampaignDetails, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaignDetails]);

  const handleSendMessage = async (draftId, name) => {
    setSendingId(draftId);
    try {
        await axios.post(`http://localhost:8000/drafts/${draftId}/send`);
        alert(`Mission Accomplished: Engagement protocol targeting ${name} has been deployed successfully.`);
        await fetchCampaignDetails();
    } catch (error) {
        console.error("Tactical Deployment Failure:", error);
        const errorDetail = error.response?.data?.detail || "Strategic deployment failed. Please check your communication protocols.";
        alert(`ERROR: ${errorDetail}`);
    } finally {
        setSendingId(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;
    setIsSaving(true);
    try {
      await axios.patch(`http://localhost:8000/drafts/${selectedDraft.id}`, draftEditData);
      await fetchCampaignDetails();
      setSelectedDraft(null);
      alert("Executive Protocol Refinement Synchronized.");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to synchronize refinement.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" strokeWidth={3} />
        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Reconstructing Workspace...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white p-10 text-center">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-3xl font-black text-[#1e293b]">Mission Not Found</h1>
        <Link to="/active" className="text-brand-primary font-black uppercase text-xs tracking-widest flex items-center gap-2">
          <ArrowLeft size={16} /> Return to Mission Control
        </Link>
      </div>
    );
  }

  const getDisplayStatus = () => {
    if (!campaign) return "NEW";
    
    // 1. If all companies are finalized
    const companies = campaign.target_companies || [];
    const allFinalized = companies.length > 0 && companies.every(c => 
      c.status === "DATE_AND_MEETING_SECURED" || c.status === "TERMINATED"
    );
    if (allFinalized) return "COMPLETED";

    // Strategic Backend Status Mapping
    switch (String(campaign.status).toUpperCase()) {
      case "RESEARCHING_USER_COMPANY": return "RESEARCHING";
      case "FINDING_TARGET_COMPANIES": return "IDENTIFYING TARGETS";
      case "FINDING_DECISION_MAKERS": return "MAPPING STAKEHOLDERS";
      case "DRAFTING_EMAILS": return "DRAFTING OUTREACH";
      case "COMPLETED": return "MONITORING";
      default: return campaign.status || "NEW";
    }
  };

  const hasDrafts = campaign.drafts_count > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* 1. Tactical Ribbon Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/active" className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
            <ArrowLeft size={20} strokeWidth={3} />
          </Link>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Mission</span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight italic uppercase truncate max-w-[200px]">
              {campaign.name}
            </h1>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button 
            onClick={() => setActiveTab("research")}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${activeTab === "research" ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Search size={16} strokeWidth={3} />
            Research
          </button>
          
          <AnimatePresence>
            {hasDrafts && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <button 
                  onClick={() => setActiveTab("monitor")}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${activeTab === "monitor" ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Monitor size={16} strokeWidth={3} />
                  Monitor
                </button>
                <button 
                  onClick={() => setActiveTab("discovery")}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${activeTab === "discovery" ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <PhoneCall size={16} strokeWidth={3} />
                  Discovery Call
                </button>
                <button 
                  onClick={() => setActiveTab("report")}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${activeTab === "report" ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FileBarChart size={16} strokeWidth={3} />
                  Report
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end mr-4">
             <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Operation Lifecycle</span>
             <span className="text-[11px] font-black text-slate-900 border-b-2 border-brand-primary tracking-tighter uppercase">{getDisplayStatus()}</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
             <Bot size={20} />
           </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-10 max-w-[1600px] mx-auto">
        {activeTab === "research" && (
          <div className="flex flex-col gap-12">
            {/* Quadrant 1: Mission Briefing (Analyzer + User Intel) */}
            <section className="w-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <Bot size={20} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Mission Strategic Briefing</h2>
              </div>
              
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  {campaign.user_intel && campaign.user_intel.company_name !== "Synchronizing Identity..." ? (
                    <>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corporate Identity Profile</p>
                          <div className="flex items-center gap-4">
                            <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
                              {campaign.user_intel.company_name}
                            </h3>
                            <a 
                              href={ensureAbsoluteUrl(campaign.user_intel.website)} 
                              target="_blank" rel="noreferrer"
                              className="p-3 bg-brand-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
                            >
                              <ExternalLink size={18} strokeWidth={3} />
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Campaign Integrity</p>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black border border-emerald-100">
                           VALIDATED
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4 w-full">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Loader2 size={18} className="text-brand-primary animate-spin" />
                            <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Parallel Synchronizer Active</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing v3 High-Aesthetic Agents</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: "10%" }}
                            animate={{ width: "70%" }}
                            transition={{ duration: 10, ease: "easeInOut" }}
                            className="h-full bg-brand-primary"
                          />
                       </div>
                       <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${campaign.user_intel?.company_name !== "Synchronizing Identity..." ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />
                             Identity Research
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${campaign.target_industry ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />
                             Targeting Protocol Initialized
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  {/* Left Column: Deep Intelligence Analysis */}
                  <div className="lg:col-span-8 p-10 space-y-10">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 underline decoration-brand-primary/30 underline-offset-8">Market Presence Analytics</h4>
                      <p className="text-slate-600 font-semibold leading-relaxed text-[15px] whitespace-pre-wrap">
                        {campaign.user_intel?.deep_research || "Synchronizing corporate intelligence logs..."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 underline decoration-brand-primary/30 underline-offset-8">Solution Portfolio & Value Props</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.user_intel ? (
                          JSON.parse(campaign.user_intel.offerings || "[]").map((o, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:border-brand-primary/30 transition-colors">
                              {o}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 italic text-sm">Identifying core capabilities...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Targeting Parameters (Analysis Hub) */}
                  <div className="lg:col-span-4 p-10 bg-slate-50/20">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">Mission Targeting Parameters</h4>
                    
                    {campaign.target_industry ? (
                      <div className="space-y-6">
                        {[
                          { label: "Target Sector", value: campaign.target_industry },
                          { label: "Geographic Location", value: campaign.target_location || "Global" }
                        ].map((filter, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{filter.label}</span>
                            <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{filter.value || "Universal"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="flex flex-col items-center gap-4 py-20 text-slate-300">
                          <Search size={32} strokeWidth={1.5} className="animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Calibrating Parameters...</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Quadrant 2: Target Intelligence Grid */}
            <section className="w-full">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Users size={20} strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Lead Reconnaissance & Pipeline</h2>
                 </div>
                 <div className="px-4 py-2 bg-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    {campaign.target_companies_count} Vetted Organizations ({campaign.target_companies.length} Raw)
                 </div>
               </div>

               {campaign.target_companies.length === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-6 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <Loader2 size={40} className="text-brand-primary animate-spin" strokeWidth={3} />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Hunting for lead artifacts...</p>
                 </div>
               ) : (
                <div className="space-y-12">
                   {/* Approved Companies Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {campaign.target_companies.filter(co => co.status !== 'REJECTED').map((company) => (
                       <motion.div 
                         key={company.id}
                        whileHover={{ y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                        onClick={() => setSelectedCompany(company)}
                        className="bg-white rounded-[40px] p-10 cursor-pointer group relative overflow-hidden transition-all shadow-sm"
                      >
                         <div className="absolute top-0 right-0 p-8 text-slate-200">
                            <Maximize2 size={20} strokeWidth={3} />
                         </div>

                         <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 pr-10">
                               <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight truncate uppercase italic">
                                  {company.name}
                               </h4>
                               <span className="flex-shrink-0 px-3 py-1 text-[11px] font-black rounded-lg border bg-brand-primary/10 text-brand-primary border-brand-primary/10">
                                  APPROVED
                               </span>
                            </div>

                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Intelligence Artifacts</p>
                               <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Monitor size={14} />
                                     </div>
                                     <p className="text-xs font-bold text-slate-600 truncate">{company.location || "Location Synchronizing..."}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Mail size={14} />
                                     </div>
                                     <p className="text-xs font-bold text-slate-600 truncate">{company.contact_email || "Email Discovery Active..."}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <PhoneCall size={14} />
                                     </div>
                                     <p className="text-xs font-bold text-slate-600 truncate">{company.contact_number || "Awaiting Contact Probe..."}</p>
                                  </div>
                               </div>
                               <p className="text-slate-500 font-semibold text-sm leading-relaxed line-clamp-3 italic pt-2">
                                  "{company.deep_research || "Conducting in-depth organization analysis..."}"
                               </p>
                            </div>
                            
                            <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                               <a 
                                 href={ensureAbsoluteUrl(company.website)} target="_blank" rel="noreferrer" 
                                 className="flex-grow flex items-center justify-center py-3.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-brand-primary/10 hover:text-brand-primary hover:scale-[1.05] active:scale-95 transition-all"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <Globe size={20} />
                               </a>
                               <a 
                                 href={ensureAbsoluteUrl(company.linkedin)} target="_blank" rel="noreferrer" 
                                 className="flex-grow flex items-center justify-center py-3.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-[#0077b5]/10 hover:text-[#0077b5] hover:scale-[1.05] active:scale-95 transition-all"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <Linkedin size={20} />
                               </a>
                            </div>
                         </div>
                      </motion.div>
                     ))}
                   </div>
                   
                   {/* Rejected Companies Grid */}
                   {campaign.target_companies.some(co => co.status === 'REJECTED') && (
                     <div className="pt-10 border-t-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-3 mb-8 opacity-70">
                           <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                              <AlertCircle size={20} strokeWidth={3} />
                           </div>
                           <div>
                             <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Rejected Artifacts</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed strategic alignment criteria</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                          {campaign.target_companies.filter(co => co.status === 'REJECTED').map((company) => (
                            <div 
                              key={company.id}
                              className="bg-slate-50 rounded-[40px] p-10 relative overflow-hidden border border-slate-200"
                            >
                               <div className="space-y-6">
                                  <div className="flex items-center justify-between gap-4 pr-10">
                                     <h4 className="text-2xl font-black text-slate-400 tracking-tighter leading-tight truncate uppercase italic">
                                        {company.name}
                                     </h4>
                                     <span className="flex-shrink-0 px-3 py-1 text-[11px] font-black rounded-lg border bg-red-50 text-red-500 border-red-100">
                                        REJECTED
                                     </span>
                                  </div>

                                  <div className="space-y-4">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Intelligence Artifacts</p>
                                     <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                              <Monitor size={14} />
                                           </div>
                                           <p className="text-xs font-bold text-slate-500 truncate">{company.location || "Location Synchronizing..."}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                              <Mail size={14} />
                                           </div>
                                           <p className="text-xs font-bold text-slate-500 truncate">{company.contact_email || "Email Discovery Active..."}</p>
                                        </div>
                                     </div>
                                     <p className="text-slate-500 font-semibold text-sm leading-relaxed line-clamp-3 italic pt-2">
                                        "{company.deep_research || "Conducting in-depth organization analysis..."}"
                                     </p>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
               )}
            </section>

            {/* Quadrant 3: Stakeholder Mapping */}
            <section className="w-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                      <Users size={20} strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Decision Maker & Stakeholder Intel</h2>
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    {campaign.dms_count || 0} Qualified Stakeholders
                 </div>
               </div>

               {campaign.dms_count === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-6 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <Loader2 size={40} className="text-indigo-500 animate-spin" strokeWidth={3} />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Identifying high-value stakeholders...</p>
                 </div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {campaign.dms.map((dm) => {
                     const company = campaign.target_companies.find(c => c.id === dm.target_company_id);
                     return (
                       <motion.div 
                         key={dm.id}
                         whileHover={{ y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                         transition={{ type: "spring", stiffness: 300 }}
                         className="bg-white rounded-[40px] p-10 relative overflow-hidden transition-all group shadow-sm"
                       >
                          <div className="flex flex-col h-full space-y-8">
                             <div className="flex items-center gap-5">
                                <div className="h-16 w-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-2xl uppercase shadow-sm">
                                   {dm.name.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic">{dm.name}</h4>
                                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{dm.position}</p>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Corporate Role & Influence</p>
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                   <p className="text-sm font-black text-slate-700 uppercase italic tracking-tight">{company?.name || "Target Organization"}</p>
                                </div>
                                <p className="text-slate-500 font-semibold text-sm leading-relaxed italic line-clamp-2">
                                   "{dm.similarity_score?.reason || "Extracting strategic alignment markers..."}"
                                </p>
                             </div>

                             <div className="pt-6 border-t border-slate-50 mt-auto">
                                <a 
                                  href={ensureAbsoluteUrl(dm.linkedin)} target="_blank" rel="noreferrer"
                                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-50 rounded-2xl text-slate-400 hover:bg-[#0077b5]/10 hover:text-[#0077b5] hover:scale-[1.02] active:scale-95 transition-all font-black text-[11px] uppercase tracking-widest"
                                >
                                   <Linkedin size={18} /> Network Protocol
                                </a>
                             </div>
                          </div>
                       </motion.div>
                     );
                   })}
                </div>
               )}
            </section>

            {/* Quadrant 4: Email Arsenal Preview */}
            <section className="w-full">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                      <Mail size={20} strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Outreach Protocol Development</h2>
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    {campaign.drafts_count || 0} Engagement Modules
                 </div>
               </div>

               {campaign.drafts_count === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-6 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <Loader2 size={40} className="text-brand-primary animate-spin" strokeWidth={3} />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Generating personalized outreach protocols...</p>
                 </div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {campaign.drafts.map((draft) => {
                     const dm = campaign.dms.find(d => d.id === draft.decision_maker_id);
                     const company = campaign.target_companies.find(c => c.id === dm?.target_company_id);
                     const prospectEmail = dm?.email || `${dm?.name.toLowerCase().replace(/ /g, ".")}@${company?.website?.replace(/(https?:\/\/|www\.|\/)/g, "")}`;
                     
                     return (
                       <motion.div 
                         key={draft.id}
                         onClick={() => setActiveTab("monitor")}
                         whileHover={{ y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                         transition={{ type: "spring", stiffness: 300 }}
                         className="bg-white rounded-[40px] p-10 relative overflow-hidden transition-all group flex flex-col h-[460px] cursor-pointer shadow-sm"
                       >
                          <div className="flex flex-col h-full">
                             <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Protocol Stakeholder</p>
                                   <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{dm?.name}</h4>
                                   <div className="flex flex-col gap-0.5">
                                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{company?.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 italic lowercase">{prospectEmail}</p>
                                   </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                   <Users size={20} />
                                </div>
                             </div>

                             <div className="space-y-4 flex-grow overflow-hidden">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 group-hover:border-brand-primary/20 transition-colors">
                                   <p className="text-[9px] font-black text-slate-300 uppercase underline decoration-brand-primary/30 mb-2">Engagement Subject Line</p>
                                   <p className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-1">{draft.subject}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex-grow group-hover:border-brand-primary/20 transition-colors">
                                   <p className="text-[9px] font-black text-slate-300 uppercase underline decoration-brand-primary/30 mb-3">Narrative Snippet</p>
                                   <p className="text-[13px] font-semibold text-slate-600 italic leading-relaxed line-clamp-4">
                                      "{draft.body}"
                                   </p>
                                </div>
                             </div>

                             <div className="pt-8 mt-auto flex items-center justify-end border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-brand-primary transition-colors">Review Engagement Protocol →</p>
                             </div>
                          </div>
                       </motion.div>
                     );
                   })}
                </div>
               )}
            </section>
          </div>
        )}

        {activeTab === "monitor" && (
           <div className="max-w-[1440px] mx-auto space-y-10">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Outreach Review & Launch</h2>
                    <p className="text-slate-400 font-bold">Review your personalized drafts and start your outreach campaign.</p>
                 </div>
                 <button 
                   onClick={handleBatchDispatch}
                   className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
                 >
                    <Send size={18} strokeWidth={3} />
                    Synchronized Batch Dispatch
                 </button>
              </div>

              {/* Engagement Tracker: Live Performance Hub */}
              <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm mb-12">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                      <FileBarChart size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Active Engagement Tracker</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Outreach Lifecycle Monitoring</p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospect</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Status</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mission Pulse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">                       {(campaign.dms || []).filter(dm => !["NEW", "SYNCED"].includes(dm.status)).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-10 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300">
                              <Loader2 className="animate-spin" size={32} />
                              <p className="text-xs font-black uppercase tracking-widest">Awaiting first deployment...</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (campaign.dms || []).filter(dm => !["NEW", "SYNCED"].includes(dm.status)).map((dm) => {
                          // Type-Agnostic Organization Sync Protocol
                          const company = campaign.target_companies.find(c => String(c.id) === String(dm.target_company_id));
                          
                          // Determine status display
                          let displayStatus = "Waiting for Reply";
                          let statusColor = "bg-blue-50 text-blue-500 border-blue-100";
                          let dotColor = "bg-blue-500";
                          
                          if (dm.status === "TERMINATED") {
                            displayStatus = "Terminated";
                            statusColor = "bg-slate-100 text-slate-400 border-slate-200";
                            dotColor = "bg-slate-300";
                          } else if (dm.status === "DATE_AND_MEETING_SECURED") {
                            displayStatus = "Meeting Secured";
                            statusColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                            dotColor = "bg-emerald-500 shadow-emerald-500/20";
                          } else if (dm.status.includes("DRAFTED")) {
                            displayStatus = "Action Required (Approval)";
                            statusColor = "bg-orange-50 text-orange-600 border-orange-100";
                            dotColor = "bg-orange-500 animate-pulse";
                          } else if (dm.status === "DISCOVERY_CALL" || dm.status === "WAITING_FOR_REPLY") {
                            displayStatus = "Discovery Protocol";
                            statusColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                            dotColor = "bg-emerald-500";
                          }
                          
                          return (
                            <tr key={dm.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm">
                                    {dm.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-black text-slate-900 tracking-tight uppercase italic">{dm.name}</p>
                                      {dm.reply_intent && (
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${
                                          dm.reply_intent === 'POSITIVE' ? 'bg-emerald-500 text-white border-emerald-600' :
                                          dm.reply_intent === 'NEGATIVE' ? 'bg-rose-500 text-white border-rose-600' :
                                          'bg-amber-400 text-white border-amber-500'
                                        }`}>
                                          {dm.reply_intent}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dm.position || "Stakeholder"}</p>
                                  </div>
                                  <button 
                                    onClick={() => setShowHistoryDM(dm)}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg text-slate-300 hover:text-brand-primary transition-all shadow-sm"
                                    title="View Communication History"
                                  >
                                    <MessageSquare size={14} strokeWidth={3} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{company?.name || "Target System"}</p>
                                  <div className="flex items-center gap-2 text-slate-300">
                                     <Globe size={10} />
                                     <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[120px]">{company?.website?.replace(/(https?:\/\/|www\.|\/)/g, "") || "Direct Connect"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-6">
                                <div 
                                  onClick={() => dm.status.includes("DRAFTED") && scrollToDraft(dm.id)}
                                  className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border ${statusColor} text-[10px] font-black uppercase tracking-widest ${dm.status.includes("DRAFTED") ? "cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm" : ""}`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                  {displayStatus}
                                  {dm.status.includes("DRAFTED") && <ChevronRight size={10} strokeWidth={4} />}
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight">
                                  {(() => {
                                    if (dm.status === "TERMINATED") return "Mission Complete";
                                    if (dm.status === "DATE_AND_MEETING_SECURED") return "Discovery Call Scheduled";
                                    if (dm.status.includes("DRAFTED")) {
                                       return `SIGNAL CAPTURED: ${dm.reply_intent || "ANALYZING"}`;
                                    }
                                    if (dm.status === "INITIAL_SENT") return "Waiting for Initial Protocol";
                                    if (dm.status.includes("FOLLOWUP") && dm.status.includes("SENT")) return `Waiting for Follow-up #${dm.followup_count || 1}`;
                                    if (dm.status === "WAITING_FOR_REPLY" || dm.status === "DISCOVERY_CALL") return "Waiting for Discovery Reply";
                                    return "Active Engagement";
                                  })()}
                                </p>
                                <div className="flex flex-col items-end gap-1 mt-1">
                                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic leading-none">
                                    {dm.status.includes("DRAFTED") ? "Awaiting Executive Authorization" : "Awaiting Interaction Signal"}
                                  </p>
                                  {dm.logs && dm.logs.length > 0 && dm.status.includes("DRAFTED") && (
                                    <p className="text-[11px] font-semibold text-brand-primary italic max-w-[200px] truncate bg-brand-primary/5 px-2 py-0.5 rounded-md">
                                      "{(dm.logs.find(l => l.direction === 'RECEIVED')?.body || "").slice(0, 50)}..."
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}

                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                   <Mail size={20} strokeWidth={3} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Pending Approvals</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execute executive authorization</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                 {(campaign.drafts || []).filter(d => {
                    const dm = campaign.dms.find(dm => dm.id === d.decision_maker_id);
                    return String(d.status).includes("DRAFTED") && dm?.status !== "TERMINATED" && dm?.status !== "DISCOVERY_CALL";
                 }).length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                      <CheckCircle2 size={48} className="text-emerald-500" />
                      <div className="text-center">
                        <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter mb-1">Queue Initialized</h4>
                        <p className="text-slate-400 font-bold text-sm">No modules currently awaiting executive authorization.</p>
                      </div>
                    </div>
                 ) : (
                    (campaign.drafts || []).filter(d => {
                       const dm = campaign.dms.find(dm => dm.id === d.decision_maker_id);
                       return String(d.status).includes("DRAFTED") && dm?.status !== "TERMINATED" && dm?.status !== "DISCOVERY_CALL";
                    }).map((draft) => {
                    const dm = campaign.dms.find(d => d.id === draft.decision_maker_id);
                    const co = campaign.target_companies.find(c => c.id === dm?.target_company_id);
                    const prospectEmail = dm?.email || `${dm?.name.toLowerCase().replace(/ /g, ".")}@${co?.website?.replace(/(https?:\/\/|www\.|\/)/g, "")}`;

                    return (
                      <motion.div 
                        key={draft.id}
                        id={`draft-card-${draft.id}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -5, scale: 1.01, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                        onClick={() => {
                           const email = dm?.email || `${dm?.name.toLowerCase().replace(/ /g, ".")}@${co?.website?.replace(/(https?:\/\/|www\.|\/)/g, "")}`;
                           setDraftEditData({ subject: draft.subject, body: draft.body, email: email });
                           setSelectedDraft(draft);
                        }}
                        className={`bg-white rounded-[40px] p-10 shadow-sm transition-all relative overflow-hidden group cursor-pointer flex flex-col h-[420px] ${String(highlightedDraftId) === String(draft.id) ? 'ring-8 ring-blue-500 ring-offset-8 border-2 border-blue-500 scale-[1.03] z-[100] shadow-2xl shadow-blue-500/40 animate-pulse' : ''}`}
                      >
                         <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Mail size={120} strokeWidth={1} />
                         </div>

                         <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none mb-2">Protocol Target</p>
                                  <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{dm?.name}</h4>
                                  <div className="flex flex-col gap-0.5">
                                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{co?.name}</p>
                                     <p className="text-[10px] font-bold text-slate-400 italic lowercase">{prospectEmail}</p>
                                  </div>
                               </div>
                               <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                  <Users size={20} />
                                </div>
                            </div>

                            <div className="space-y-4 flex-grow overflow-hidden mb-8">
                               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-300 uppercase underline decoration-brand-primary/30 mb-2">Subject Header</p>
                                  <p className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-1">{draft.subject}</p>
                               </div>
                               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex-grow">
                                  <p className="text-[9px] font-black text-slate-300 uppercase underline decoration-brand-primary/30 mb-3">Narrative Snippet</p>
                                  <p className="text-[13px] font-semibold text-slate-600 italic leading-relaxed line-clamp-4">
                                     "{draft.body}"
                                  </p>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 mt-auto">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleSendMessage(draft.id, dm?.name);
                                 }}
                                 disabled={sendingId === draft.id || draft.status === "DEPLOYED"}
                                 className={`py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${draft.status === "DEPLOYED" ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-brand-primary text-white shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 shadow-lg"}`}
                               >
                                  {sendingId === draft.id ? <Loader2 size={14} className="animate-spin" /> : (draft.status === "DEPLOYED" ? <CheckCircle2 size={14} strokeWidth={3} /> : <Send size={14} strokeWidth={3} />)}
                                   {sendingId === draft.id ? "Deploying..." : "Authorize"}
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Terminate logic
                                  }}
                                  className="py-3.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                   <Trash size={14} strokeWidth={3} />
                                   Terminate
                                </button>
                             </div>
                          </div>
                        </motion.div>
                     );
                  })
                 )}
              </div>
           </div>
        )}

        {activeTab === "discovery" && (
           <div className="max-w-[1440px] mx-auto space-y-16">
              {/* Part 1: Engagement Outreach Drafts (Discovery) */}
              <section>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Edit3 size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Engagement Outreach Drafts</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Discovery Phase Invitation Controls</p>
                    </div>
                  </div>
                  <div className="px-6 py-2 bg-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    {(campaign.dms || []).filter(dm => dm.status === "DISCOVERY_CALL" || dm.status === "WAITING_FOR_REPLY").length} Active Protocols
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(campaign.dms || []).filter(dm => dm.status === "DISCOVERY_CALL" || dm.status === "WAITING_FOR_REPLY").map(dm => {
                    const dmDrafts = (campaign.drafts || []).filter(d => d.decision_maker_id === dm.id);
                    const draft = dmDrafts[dmDrafts.length - 1];
                    const co = campaign.target_companies.find(c => c.id === dm.target_company_id);
                    
                    if (!draft) return null;

                    return (
                      <motion.div 
                        key={dm.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group"
                      >
                         <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${dm.status === "WAITING_FOR_REPLY" ? "bg-orange-50 text-orange-500" : "bg-indigo-50 text-indigo-500"}`}>
                                    {dm.status === "WAITING_FOR_REPLY" ? "Awaiting Reply" : "Ready to Draft"}
                                  </span>
                                  {dm.reply_intent && (
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                                      dm.reply_intent === 'POSITIVE' ? 'bg-emerald-500 text-white border-emerald-600' :
                                      dm.reply_intent === 'NEGATIVE' ? 'bg-rose-500 text-white border-rose-600' :
                                      'bg-amber-400 text-white border-amber-500'
                                    }`}>
                                      {dm.reply_intent}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic pt-2">{dm.name}</h4>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{co?.name}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setDraftEditData({ subject: draft.subject, body: draft.body, email: dm.email });
                                  setSelectedDraft(draft);
                                }}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              >
                                <Maximize2 size={18} />
                              </button>
                            </div>

                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50 flex-grow mb-8 italic">
                               <p className="text-[9px] font-black text-slate-300 uppercase underline decoration-indigo-500/30 mb-3 tracking-widest">Discovery Request Bundle</p>
                               <p className="text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 mb-2">{draft.subject}</p>
                               <p className="text-[13px] font-semibold text-slate-600 leading-relaxed line-clamp-4">
                                  "{draft.body}"
                                </p>
                            </div>

                            <button 
                               onClick={() => handleSendMessage(draft.id, dm.name)}
                               disabled={sendingId === draft.id || dm.status === "WAITING_FOR_REPLY"}
                               className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${dm.status === "WAITING_FOR_REPLY" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"}`}
                            >
                               {sendingId === draft.id ? <Loader2 size={16} className="animate-spin" /> : (dm.status === "WAITING_FOR_REPLY" ? <Clock size={16} /> : <Send size={16} />)}
                               {dm.status === "WAITING_FOR_REPLY" ? "In Orbit (Waiting)" : "Deploy Discovery Protocol"}
                            </button>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* Part 2: Strategic Meeting Intel (Booked) */}
              <section>
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Calendar size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Strategic Meeting Intel</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Confirmed Stakeholder Engagements</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Repository</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Target (IST)</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Countdown Protocol</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Coordinate (Link)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {(campaign.dms || []).filter(dm => dm.status === "DATE_AND_MEETING_SECURED").length === 0 ? (
                             <tr>
                               <td colSpan="5" className="px-10 py-20 text-center">
                                  <div className="flex flex-col items-center gap-4 text-slate-300">
                                    <Bot size={48} strokeWidth={1} className="opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest tracking-widest italic animate-pulse">Scanning for confirmed bookings...</p>
                                  </div>
                               </td>
                             </tr>
                           ) : (
                             (campaign.dms || []).filter(dm => dm.status === "DATE_AND_MEETING_SECURED").map((dm) => {
                               const co = campaign.target_companies.find(c => c.id === dm.target_company_id);
                               return (
                                 <tr key={dm.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-8">
                                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{co?.name}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] font-black">
                                            {dm.name.charAt(0)}
                                          </div>
                                          <p className="text-sm font-bold text-slate-600">{dm.name}</p>
                                       </div>
                                    </td>
                                    <td className="px-10 py-8">
                                       <p className="text-[11px] font-black text-slate-800 uppercase tabular-nums">
                                          {new Date(dm.scheduled_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ' @')}
                                       </p>
                                    </td>
                                    <td className="px-10 py-8">
                                       <DiscoveryTimer scheduledTime={dm.scheduled_time} />
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                       <a 
                                         href={dm.meeting_link} target="_blank" rel="noreferrer"
                                         className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                       >
                                         <Link2 size={14} strokeWidth={3} />
                                         Access Bridge
                                       </a>
                                    </td>
                                 </tr>
                               );
                             })
                           )}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </section>
           </div>
        )}

        {activeTab === "report" && (
           <div className="max-w-[1200px] mx-auto space-y-12">
              {/* Report Header: Aggregate Intelligence */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Total Profiled", value: campaign.target_companies_count, icon: Search, color: "text-brand-primary", bg: "bg-brand-primary/10" },
                  { label: "Avg Alignment", value: `${Math.round(campaign.target_companies.reduce((acc, c) => acc + (c.similarity_score?.score || 0), 0) / (campaign.target_companies_count || 1))}%`, icon: Target, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                  { label: "Total Prospects", value: (campaign.dms || []).length, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company List: Multi-Threaded Intelligence Repository */}
              <section className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                      <PieChart size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Organizational Intelligence Repository</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vertical Campaign Audit</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {campaign.target_companies.filter(co => (campaign.dms || []).some(dm => dm.target_company_id === co.id)).map((company) => {
                    const companyDMs = (campaign.dms || []).filter(dm => dm.target_company_id === company.id);
                    const isExpanded = expandedReportCompany === company.id;
                    
                    return (
                      <div key={company.id} className="flex flex-col border-b border-slate-100 last:border-0">
                        <div 
                          onClick={() => setExpandedReportCompany(isExpanded ? null : company.id)}
                          className="px-10 py-6 hover:bg-slate-50 transition-all cursor-pointer group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-6 flex-grow">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'}`}>
                              <Globe size={20} />
                            </div>
                            <div>
                              <h4 className={`text-lg font-black uppercase italic tracking-tight transition-colors ${isExpanded ? 'text-brand-primary' : 'text-slate-900 group-hover:text-brand-primary'}`}>
                                {company.name}
                              </h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Organization</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-12">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Alignment</p>
                              <span className="text-sm font-black text-brand-primary">{company.similarity_score?.score || 0}%</span>
                            </div>
                            
                            <div className="text-right w-32">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Prospects</p>
                              <div className="flex items-center justify-end gap-2 text-slate-600">
                                 <Users size={14} strokeWidth={3} />
                                 <span className="text-sm font-black">{companyDMs.length}</span>
                              </div>
                            </div>

                            <div className={`text-slate-200 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-brand-primary' : 'group-hover:text-brand-primary'}`}>
                               <ChevronRight size={20} strokeWidth={3} />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden bg-slate-50/50"
                            >
                              <div className="px-10 pb-10 pt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                  {[
                                    { label: "Phone Protocol", value: company.contact_number, icon: PhoneCall },
                                    { label: "HQ Coordinates", value: company.location, icon: Globe },
                                    { label: "Corporate Email", value: company.contact_email, icon: Mail }
                                  ].map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                                      <div className="flex items-center gap-3 mb-2">
                                        <item.icon size={14} className="text-brand-primary" />
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                                      </div>
                                      <p className="text-xs font-black text-slate-900 truncate uppercase tabular-nums">{item.value || "N/A"}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="h-[1px] flex-grow bg-slate-200" />
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Mapped Stakeholders</span>
                                  <div className="h-[1px] flex-grow bg-slate-200" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {companyDMs.map((dm) => (
                                    <div 
                                      key={dm.id}
                                      className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between group/dm hover:border-brand-primary/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover/dm:bg-brand-primary/10 group-hover/dm:text-brand-primary transition-colors">
                                          {dm.name.charAt(0)}
                                        </div>
                                        <div>
                                          <button 
                                            onClick={() => setShowHistoryDM(dm)}
                                            className="text-sm font-black text-slate-900 uppercase italic tracking-tight hover:text-brand-primary transition-colors cursor-pointer text-left"
                                          >
                                            {dm.name}
                                          </button>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dm.position}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <a 
                                          href={ensureAbsoluteUrl(dm.linkedin)} 
                                          target="_blank" rel="noreferrer"
                                          className="p-2 text-slate-300 hover:text-[#0077b5] transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Linkedin size={16} />
                                        </a>
                                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                          dm.status === "DATE_AND_MEETING_SECURED" ? "bg-emerald-50 text-emerald-500" : 
                                          dm.status.includes("SENT") ? "bg-blue-50 text-blue-500" : 
                                          "bg-slate-100 text-slate-400"
                                        }`}>
                                          {dm.status.replace(/_/g, " ")}
                                        </div>
                                        {dm.reply_intent && (
                                          <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm border ${
                                            dm.reply_intent === 'POSITIVE' ? 'bg-emerald-500 text-white border-emerald-600' :
                                            dm.reply_intent === 'NEGATIVE' ? 'bg-rose-500 text-white border-rose-600' :
                                            'bg-amber-400 text-white border-amber-500'
                                          }`}>
                                            {dm.reply_intent}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
           </div>
        )}
      </main>

      {/* Target Intel Professional Overlay */}
      <AnimatePresence>
        {selectedCompany && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCompany(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
              >
                 <button 
                   onClick={() => setSelectedCompany(null)}
                   className="absolute top-8 right-8 w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all z-10"
                 >
                   <X size={24} />
                 </button>

                 <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-12 space-y-10 border-r border-slate-100 bg-slate-50/50">
                       <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-brand-primary">
                          <Globe size={40} />
                       </div>
                       <div className="space-y-4">
                          <h2 className="text-4xl font-black text-slate-900 leading-tight uppercase italic">{selectedCompany.name}</h2>
                          <a href={ensureAbsoluteUrl(selectedCompany.website)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-primary font-black text-sm hover:underline">
                             {selectedCompany.website} <ExternalLink size={16} />
                          </a>
                       </div>
                       
                       <div className="space-y-6 pt-10 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Matching Protocol</span>
                             <span className="text-2xl font-black text-slate-900">{selectedCompany.similarity_score?.score}%</span>
                          </div>
                          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm font-bold text-slate-500 italic text-sm leading-relaxed">
                             "{selectedCompany.similarity_score?.reason}"
                          </div>

                          <div className="space-y-4 pt-6">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Strategic Intelligence</p>
                             <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 group hover:border-brand-primary/30 transition-all">
                                   <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                                      <Monitor size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">HQ Location</p>
                                      <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{selectedCompany.location || "N/A"}</p>
                                   </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 group hover:border-brand-primary/30 transition-all">
                                   <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                                      <Mail size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Corporate Email</p>
                                      <p className="text-xs font-black text-slate-700 tracking-tight lowercase">{selectedCompany.contact_email || "N/A"}</p>
                                   </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4 group hover:border-brand-primary/30 transition-all">
                                   <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                                      <PhoneCall size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Direct Line</p>
                                      <p className="text-xs font-black text-slate-700 tracking-tight">{selectedCompany.contact_number || "N/A"}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-12 space-y-10">
                       <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 underline decoration-brand-primary/30 underline-offset-4">Deep Research & Strategic Rational</h3>
                          <div className="prose prose-slate max-w-none">
                             <p className="text-slate-600 font-semibold leading-relaxed text-[15px] whitespace-pre-wrap">
                                {selectedCompany.deep_research}
                             </p>
                          </div>
                       </div>

                       <div className="pt-10 border-t border-slate-100 flex items-center gap-4">
                           <a 
                             href={ensureAbsoluteUrl(selectedCompany.linkedin)} 
                             target="_blank" 
                             rel="noreferrer"
                             className="flex-grow flex items-center justify-center gap-3 py-4 bg-[#0077b5] text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-blue-500/20"
                           >
                              <Linkedin size={20} /> LinkedIn Protocol
                           </a>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Engagement Protocol Modal */}
      <AnimatePresence>
        {selectedDraft && (() => {
          const dm = campaign.dms.find(d => d.id === selectedDraft.decision_maker_id);
          const co = campaign.target_companies.find(c => c.id === dm?.target_company_id);

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDraft(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
              >
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                         <Mail size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Executive Protocol Refinement</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stakeholder Analysis Hub</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setSelectedDraft(null)}
                     className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                   >
                      <X size={24} />
                   </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-10 space-y-8">
                   {/* Identity Side-by-Side */}
                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">Stakeholder</p>
                         <p className="text-xl font-black text-slate-900 tracking-tight">{dm?.name}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">Organization</p>
                         <p className="text-xl font-black text-slate-900 tracking-tight">{co?.name}</p>
                      </div>
                   </div>

                   {/* Editable Fields */}
                   <div className="space-y-6">
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 focus-within:border-brand-primary transition-colors">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 underline decoration-brand-primary/30">Deployment Coordinate (Email)</p>
                         <input 
                           value={draftEditData.email}
                           onChange={(e) => setDraftEditData({ ...draftEditData, email: e.target.value })}
                           className="w-full bg-transparent font-black text-slate-900 outline-none text-lg tracking-tight"
                         />
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 focus-within:border-brand-primary transition-colors">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 underline decoration-brand-primary/30">Strategic Subject Line</p>
                         <input 
                           value={draftEditData.subject}
                           onChange={(e) => setDraftEditData({ ...draftEditData, subject: e.target.value })}
                           className="w-full bg-transparent font-black text-slate-900 outline-none text-xl tracking-tight"
                         />
                      </div>
                      <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 focus-within:border-brand-primary transition-colors">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 underline decoration-brand-primary/30">Narrative Protocol Body</p>
                         <textarea 
                           value={draftEditData.body}
                           onChange={(e) => setDraftEditData({ ...draftEditData, body: e.target.value })}
                           className="w-full bg-transparent font-semibold text-slate-600 outline-none text-[16px] leading-relaxed min-h-[300px] resize-none"
                         />
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="grid grid-cols-2 gap-8 pt-4">
                      <button 
                        onClick={() => setSelectedDraft(null)}
                        className="w-full py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                         Discard Changes
                      </button>
                      <button 
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                         {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={3} />}
                         Synchronize & Save
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Interaction History Drawer */}
      <AnimatePresence>
        {showHistoryDM && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDM(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-primary shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Mission Engagement Chain</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{showHistoryDM.name} • {campaign.target_companies.find(c => c.id === showHistoryDM.target_company_id)?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryDM(null)} className="p-3 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-10 space-y-10 bg-slate-50/30 relative">
                {/* Vertical Timeline Line (The Chain) */}
                <div className="absolute left-[59px] top-10 bottom-10 w-0.5 bg-slate-200" />

                {/* Node 1: Targeting Strategy (The Origin) */}
                <div className="relative flex gap-8">
                   <div className="z-10 bg-white w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                      <Target size={18} strokeWidth={3} />
                   </div>
                   <div 
                      onClick={() => toggleNodeExpansion('strategy')}
                      className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex-grow cursor-pointer hover:border-brand-primary/20 transition-all"
                   >
                      <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">Stage 0: Targeting Strategy</p>
                      <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight mb-2">Strategic Alignment Identification</p>
                      <p className={`text-sm font-semibold text-slate-500 italic leading-relaxed ${expandedNodes.includes('strategy') ? '' : 'line-clamp-3'}`}>
                         "{showHistoryDM.similarity_score?.reason || "Lead identified through high-intent LinkedIn reconnaissance."}"
                      </p>
                   </div>
                </div>

                {/* Combined Interaction Timeline (The Chain) */}
                {(!showHistoryDM.logs || showHistoryDM.logs.length === 0) ? (
                  <div className="relative flex gap-8 opacity-40">
                    <div className="z-10 bg-slate-100 w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                       <Clock size={18} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col justify-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Live Engagement Response...</p>
                    </div>
                  </div>
                ) : (
                  [...showHistoryDM.logs].reverse().map((log, i) => {
                    const isFirstLog = i === 0;
                    return (
                      <div key={i} className="relative flex gap-8">
                         <div className={`z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm shrink-0 ${log.direction === 'SENT' ? 'bg-indigo-500 border-indigo-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white'}`}>
                            {log.direction === 'SENT' ? (isFirstLog ? <Bot size={18} strokeWidth={3} /> : <Mail size={18} strokeWidth={3} />) : <MessageSquare size={18} strokeWidth={3} />}
                         </div>
                         <div className={`p-6 rounded-[24px] border shadow-sm flex-grow ${log.direction === 'SENT' ? 'bg-indigo-50/5 border-indigo-100' : 'bg-emerald-50/10 border-emerald-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                               <p className={`text-[9px] font-black uppercase tracking-widest ${log.direction === 'SENT' ? 'text-indigo-400' : 'text-emerald-500'}`}>
                                  {log.direction === 'SENT' ? (isFirstLog ? 'Mission Alpha: Inaugural Signal' : 'Mission Outbound') : 'Signal Captured'} • {formatTimeAgo(log.received_at)}
                               </p>
                               <div className="p-1 px-2 rounded-md bg-white border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Sync ID: #{String(log.id).slice(-4)}</div>
                            </div>
                            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight mb-1">Subject: {log.subject}</p>
                            <p className={`text-sm font-semibold leading-relaxed whitespace-pre-wrap ${log.direction === 'SENT' ? 'text-slate-500 italic' : 'text-slate-700 font-medium'}`}>
                               {cleanEmailReply(log.body)}
                            </p>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignWorkspace;
