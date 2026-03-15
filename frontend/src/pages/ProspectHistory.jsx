import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, MessageSquare, Linkedin, Mail, 
  MapPin, Clock, ShieldCheck, ExternalLink,
  Loader2, Bot, Calendar, Sparkles
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
  return date.toLocaleString();
};

const ProspectHistory = () => {
  const { id, dmId } = useParams();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/campaigns/${id}/stakeholders/${dmId}/history`);
        setProspect(response.data);
      } catch (error) {
        console.error("Error fetching prospect history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [dmId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" strokeWidth={3} />
        <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Retrieving Interaction Logs...</p>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#f8fafc] p-10 text-center">
        <Bot className="w-16 h-16 text-slate-300" />
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">Stakeholder Not Located</h1>
        <button 
          onClick={() => navigate(-1)} 
          className="text-brand-primary font-black uppercase text-xs tracking-widest flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Mission Control
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Tactical Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder Intelligence</span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">
              {prospect.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
            prospect.status === "BOOKED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
            prospect.status.includes("SENT") ? "bg-blue-50 text-blue-500 border-blue-100" : 
            "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            Status: {prospect.status.replace(/_/g, " ")}
          </div>
        </div>
      </header>

      <main className="pt-32 px-10 max-w-[1200px] mx-auto space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left: Identity Profile */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm sticky top-32"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-24 w-24 rounded-[32px] bg-brand-primary/5 flex items-center justify-center text-brand-primary font-black text-4xl uppercase shadow-inner">
                  {prospect.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{prospect.name}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{prospect.position}</p>
                </div>
              </div>

              <div className="mt-10 space-y-6 pt-10 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Organization</span>
                  <span className="text-sm font-black text-slate-700 uppercase italic">{prospect.company_name}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contact Nodes</span>
                  <a href={`mailto:${prospect.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-brand-primary/5 transition-all group">
                    <Mail size={16} className="text-slate-400 group-hover:text-brand-primary" />
                    <span className="text-xs font-bold text-slate-600 truncate">{prospect.email || "Email pending sync"}</span>
                  </a>
                  <a href={prospect.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-[#0077b5]/5 transition-all group">
                    <Linkedin size={16} className="text-slate-400 group-hover:text-[#0077b5]" />
                    <span className="text-xs font-bold text-slate-600">LinkedIn Protocol</span>
                    <ExternalLink size={12} className="ml-auto text-slate-300" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Interaction Timeline */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                <MessageSquare size={20} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Communication History & Logs</h2>
            </div>

            <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200">
              {prospect.logs.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 border border-slate-200 border-dashed text-center">
                  <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No active deployments found in registry.</p>
                </div>
              ) : (
                prospect.logs.map((log, idx) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-20"
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-[30px] top-6 w-3 h-3 rounded-full border-4 border-white shadow-sm z-10 ${
                      log.direction === "SENT" ? "bg-brand-primary" : "bg-emerald-500"
                    }`} />

                    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className={`px-8 py-4 flex items-center justify-between border-b border-slate-50 ${
                        log.direction === "SENT" ? "bg-slate-50/50" : "bg-emerald-50/20"
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            log.direction === "SENT" ? "bg-brand-primary text-white" : "bg-emerald-500 text-white"
                          }`}>
                            {log.direction}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-tighter">
                            {formatTimeAgo(log.received_at)}
                          </span>
                        </div>
                        <ShieldCheck size={14} className="text-slate-200" />
                      </div>
                      
                      <div className="p-8 space-y-4">
                        <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase italic leading-tight">
                          Subject: {log.subject}
                        </h4>
                        <div className="h-[1px] w-12 bg-brand-primary/20" />
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                          "{log.body}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProspectHistory;
