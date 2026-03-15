import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import API_BASE_URL from "../config";

const DefineQuery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const campaignName = location.state?.campaignName || "New Campaign";
  
  const [userUrl, setUserUrl] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [targetEmployeeCount, setTargetEmployeeCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  const validateUrl = (url) => {
    if (!url.trim()) return false;
    const domainRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return domainRegex.test(url);
  };

  const handleUrlChange = (val) => {
    setUserUrl(val);
    if (validateUrl(val)) {
      setIsVerified(true);
      setError("");
    } else {
      setIsVerified(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    
    if (!isVerified) {
      setError("Mission Origin URL must be verified before deployment.");
      return;
    }
    if (!targetIndustry.trim()) {
      setError("Please specify the target industry.");
      return;
    }
    if (!targetLocation.trim()) {
      setError("Please specify the target location.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/campaigns`, {
        name: campaignName,
        user_url: userUrl,
        target_industry: targetIndustry,
        target_location: targetLocation,
        target_employee_count: targetEmployeeCount || null,
        query: `Targeting ${targetIndustry} in ${targetLocation}${targetEmployeeCount ? ' with size ' + targetEmployeeCount : ''}`,
      });
      
      const campaignId = response.data.id;
      navigate(`/campaign/${campaignId}`);
    } catch (error) {
      console.error("Error starting campaign:", error);
      setError("Deployment failed. System synchronization error.");
    } finally {
      setIsLoading(false);
    }
  };

  const canDeploy = isVerified && targetIndustry.trim().length > 3 && targetLocation.trim().length > 2 && !isLoading;

  return (
    <div className="min-h-[90vh] flex items-center justify-center relative px-6 overflow-hidden py-20">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] opacity-50" />
        <div className="absolute w-[400px] h-[400px] border border-brand-primary/5 rounded-full" />
        <div className="absolute w-[800px] h-[800px] border border-brand-primary/5 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[600px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-12 relative z-10 border border-zinc-100"
      >
        {/* Icon Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-brand-primary" />
          </div>
          <div>
             <h1 className="text-2xl font-black text-[#1e293b] tracking-tight leading-none italic uppercase">
              Mission Deployment
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">v3.0 Agentic Architecture</p>
          </div>
        </div>
        
        <form onSubmit={handleStart} className="space-y-8">
          {/* Phase 1: Mission Origin */}
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand-primary rounded-full" />
                  <label className="text-[12px] font-black text-[#1e293b] uppercase tracking-wider">
                    Mission Origin (URL)
                  </label>
                </div>
                <AnimatePresence>
                  {isVerified && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"
                    >
                      <Zap size={10} className="fill-emerald-500" /> Verified
                    </motion.span>
                  )}
                </AnimatePresence>
             </div>
             <div className="relative">
                <input
                  type="text"
                  value={userUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="e.g., ai-priori.solutions"
                  className={`w-full bg-zinc-50 border rounded-2xl px-6 py-4 text-[#1e293b] font-bold focus:bg-white outline-none transition-all placeholder:text-zinc-300 shadow-sm text-sm ${
                    isVerified ? "border-emerald-500/30 bg-emerald-50/5" : "border-zinc-200 focus:border-brand-primary"
                  }`}
                />
             </div>
          </div>

          {/* Phase 2: Targeting Protocol Refined */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <label className="text-[12px] font-black text-[#1e293b] uppercase tracking-wider">
                      Target Industry
                    </label>
                 </div>
                 <input
                    type="text"
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="e.g., SaaS, Fintech"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-[#1e293b] font-bold focus:bg-white focus:border-brand-primary outline-none transition-all placeholder:text-zinc-300 shadow-sm text-sm"
                 />
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full" />
                    <label className="text-[12px] font-black text-[#1e293b] uppercase tracking-wider">
                      Target Location
                    </label>
                 </div>
                 <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g., London, USA"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-[#1e293b] font-bold focus:bg-white focus:border-brand-primary outline-none transition-all placeholder:text-zinc-300 shadow-sm text-sm"
                 />
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <label className="text-[12px] font-black text-[#1e293b] uppercase tracking-wider">
                      Employee Count <span className="text-zinc-400 lowercase italic">(Optional)</span>
                    </label>
                  </div>
               </div>
               <input
                  type="text"
                  value={targetEmployeeCount}
                  onChange={(e) => setTargetEmployeeCount(e.target.value)}
                  placeholder="e.g., 51-200, 500+, 10-50"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-[#1e293b] font-bold focus:bg-white focus:border-brand-primary outline-none transition-all placeholder:text-zinc-300 shadow-sm text-sm"
               />
            </div>
          </div>

          <div className="relative pt-2">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-4 left-1 flex items-center gap-1.5 text-red-500 text-[11px] font-bold"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!canDeploy}
              className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-2xl transition-all ${
                canDeploy 
                ? "bg-black text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 cursor-pointer" 
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-70"
              }`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className={`w-5 h-5 ${canDeploy ? 'fill-brand-primary text-brand-primary' : 'text-zinc-300'}`} />}
              {isLoading ? "Synchronizing Subsystems..." : isVerified ? "Initialize Campaign Deployment" : "Verify URL to Enable"}
            </button>
          </div>
        </form>


        <div className="mt-10 text-center">
          <Link 
            to="/create" 
            className="text-zinc-400 hover:text-brand-primary text-[11px] font-black uppercase tracking-widest transition-colors"
          >
            Modify Mission Parameters
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DefineQuery;
