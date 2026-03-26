import React, { useState } from "react";
import { 
  MessageSquare, History, Folder, 
  Download, Zap, Linkedin, Globe, 
  ChevronRight, MoreHorizontal,
  Table as TableIcon, Users, User,
  Mail, CheckCircle2, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LeadLedger = ({ campaign }) => {
  const [activeView, setActiveView] = useState("COMPANIES"); // COMPANIES or CONTACTS
  const rawCompanies = campaign?.target_companies || [];
  
  // Tactical Sorting Protocol: Approved targets first, Rejected artifacts last
  const companies = [...rawCompanies].sort((a, b) => {
    if (a.status === 'REJECTED' && b.status !== 'REJECTED') return 1;
    if (a.status !== 'REJECTED' && b.status === 'REJECTED') return -1;
    return 0;
  });

  // Extract and Flatten Contacts (Decision Makers)
  const contacts = companies
    .filter(c => c.status !== 'REJECTED')
    .flatMap(company => 
      (company.dms || []).map(dm => ({
        ...dm,
        companyName: company.name
      }))
    );

  const getStatusBadge = (status) => {
    const s = (status || "NEW").toUpperCase().replace(/_/g, " ");
    let colors = "bg-slate-50 text-slate-400 border-slate-100";
    
    if (s.includes("DRAFTED")) colors = "bg-amber-50 text-amber-600 border-amber-100";
    if (s.includes("SENT")) colors = "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (s.includes("BOOKED")) colors = "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (s.includes("TERMINATED")) colors = "bg-rose-50 text-rose-500 border-rose-100";
    if (s.includes("SYNCED") || s === "NEW") colors = "bg-slate-100 text-slate-600 border-slate-200";

    return (
      <span className={`px-2 py-1 text-[9px] font-black rounded-md border uppercase tracking-tighter whitespace-nowrap ${colors}`}>
        {s}
      </span>
    );
  };
  
  const ensureAbsoluteUrl = (url) => {
    if (!url || url === "#" || url === "N/A") return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center text-brand-primary">
            <Layers size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
              {campaign?.name || "Target Mission"} Ledger
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Users size={10} /> {companies.length} Organizations
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1">
                <User size={10} /> {contacts.length} Decision Makers
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-4 shadow-inner">
            <button 
              onClick={() => setActiveView("COMPANIES")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "COMPANIES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <TableIcon size={14} />
              Companies
            </button>
            <button 
              onClick={() => setActiveView("CONTACTS")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === "CONTACTS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Users size={14} />
              Contacts
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Download size={14} />
            Export
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 bg-brand-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.05] active:scale-95 transition-all">
            <Zap size={14} fill="currentColor" />
            Enrich
          </button>
        </div>
      </div>

      {/* Main Grid Table */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-5 w-16">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                  </th>
                  {activeView === "COMPANIES" ? (
                    <>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-16">ID</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Company Name</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Linkedin</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Website</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">UT/HQ</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Size</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Vertical</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 w-16">Rank</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Prospect Name</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Organization</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">LinkedIn</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100">Verified Email</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(activeView === "COMPANIES" ? companies : contacts).map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-5">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                    </td>
                    
                    {activeView === "COMPANIES" ? (
                      <>
                        <td className="px-6 py-5 text-sm font-bold text-slate-400 tabular-nums border-r border-slate-100">
                          {index + 1}
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tight italic truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100 w-12">
                          <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-brand-primary hover:scale-110 transition-transform block">
                            <Linkedin size={16} />
                          </a>
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100 w-12">
                          <a href={ensureAbsoluteUrl(item.website)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-primary transition-colors block">
                            <Globe size={16} />
                          </a>
                        </td>
                        <td className="px-6 py-5 text-[10px] font-bold text-slate-600 border-r border-slate-100 uppercase truncate max-w-[120px]">
                          {item.location || "N/A"}
                        </td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 border-r border-slate-100 tabular-nums uppercase whitespace-nowrap">
                          {item.employee_count || "-"}
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md truncate max-w-[120px] block">
                            {item.company_type || "General Industry"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {item.status === 'REJECTED' ? (
                            <span className="px-3 py-1 text-[10px] font-black rounded-lg border bg-rose-50 text-rose-500 border-rose-100 uppercase tracking-tighter shadow-sm shadow-rose-100/50">
                               REJECTED
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-[10px] font-black rounded-lg border bg-emerald-50 text-emerald-500 border-emerald-100 uppercase tracking-tighter shadow-sm shadow-emerald-100/50">
                               APPROVED
                            </span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5 text-sm font-bold text-slate-400 tabular-nums border-r border-slate-100">
                          {index + 1}
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100">
                           <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                              {item.position}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100">
                          <span className="text-xs font-black text-slate-600 uppercase tracking-tight italic bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {item.companyName}
                          </span>
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100 w-12">
                          <a href={ensureAbsoluteUrl(item.linkedin)} target="_blank" rel="noreferrer" className="text-brand-primary hover:scale-110 transition-transform block">
                            <Linkedin size={16} />
                          </a>
                        </td>
                        <td className="px-6 py-5 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 tabular-nums underline decoration-slate-200 underline-offset-4 decoration-dotted">
                              {item.email || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getStatusBadge(item.status)}
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <p className="flex items-center gap-2"><ShieldCheck size={12} className="text-brand-primary" /> Multi-Layer Audit v3.1</p>
          <p className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Enterprise Readiness Verified</p>
        </div>
        <p>© 2026 Mission Intelligence Suite</p>
      </div>
    </div>
  );
};

export default LeadLedger;
