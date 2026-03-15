import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ArrowRight, AlertCircle } from "lucide-react";

const CreateCampaign = () => {
  const [campaignName, setCampaignName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setError("Please give your campaign a descriptive name.");
      return;
    }
    setError("");
    // In a real app, you might save state to context or localStorage here
    // For now, we pass it via state to the next route or just navigate
    navigate("/create/query", { state: { campaignName } });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative px-6 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] opacity-50" />
        <div className="absolute w-[400px] h-[400px] border border-brand-primary/5 rounded-full" />
        <div className="absolute w-[800px] h-[800px] border border-brand-primary/5 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-12 relative z-10 border border-zinc-100"
      >
        {/* Icon Header */}
        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-10">
          <Megaphone className="w-8 h-8 text-brand-primary" />
        </div>

        <h1 className="text-[32px] font-black text-[#1e293b] mb-4 tracking-tight leading-tight">
          Create New Campaign
        </h1>
        
        <p className="text-zinc-400 font-semibold mb-10 text-[15px] leading-relaxed">
          Give your campaign a descriptive name. This will help you <br className="hidden sm:block" />
          identify it later in your dashboard.
        </p>

        <form onSubmit={handleNext} className="space-y-8">
          <div className="space-y-3 relative">
             <label className="text-[13px] font-black text-[#1e293b] uppercase tracking-wider ml-1">
                Campaign Name
             </label>
             <input
               type="text"
               value={campaignName}
               onChange={(e) => {
                 setCampaignName(e.target.value);
                 if (error) setError("");
               }}
               placeholder="e.g., Q3 Enterprise Outreach"
               className={`w-full bg-zinc-50 border rounded-2xl px-6 py-5 text-[#1e293b] font-bold focus:bg-white outline-none transition-all placeholder:text-zinc-300 shadow-sm ${
                 error ? "border-red-500 bg-red-50/10 focus:border-red-500" : "border-zinc-200 focus:border-brand-primary"
               }`}
             />
             
             <AnimatePresence>
               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="absolute -bottom-8 left-1 flex items-center gap-1.5 text-red-500 text-[11px] font-bold"
                 >
                   <AlertCircle size={14} />
                   {error}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            Create Campaign
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            to="/" 
            className="text-zinc-400 hover:text-brand-primary text-[13px] font-bold transition-colors"
          >
            Cancel and return to dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCampaign;
