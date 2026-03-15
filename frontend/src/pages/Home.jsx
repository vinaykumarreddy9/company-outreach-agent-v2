import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Zap, Cpu, BarChart3, Mail, Globe, Settings, Users, FileText, LayoutDashboard } from "lucide-react";

const Home = () => {
  const features = [
    {
      title: "Deep Research",
      description: "Our AI agents scan LinkedIn, company news, and earnings calls to find the perfect compelling hook for every single prospect.",
      icon: <Search className="w-6 h-6 text-brand-primary" />,
      color: "bg-indigo-50",
    },
    {
      title: "Hyper-Personalization",
      description: "Generate completely unique, highly relevant emails that look and feel like you spent 30 minutes writing each one manually.",
      icon: <Zap className="w-6 h-6 text-brand-primary" />,
      color: "bg-indigo-50",
    },
    {
      title: "Scalable Delivery",
      description: "Send thousands of personalized emails automatically. Manage replies, track performance, and scale your pipeline effortlessly.",
      icon: <Cpu className="w-6 h-6 text-brand-primary" />,
      color: "bg-indigo-50",
    }
  ];

  return (
    <div className="flex flex-col relative overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-6 text-center max-w-[1440px] mx-auto w-full">

        <h1 className="text-[54px] md:text-[80px] font-black leading-[1.1] mb-8 tracking-tighter text-[#1e293b]">
          Outreach that feels <br />
          <span className="text-brand-primary">Human</span>, <span className="text-brand-secondary">yet Scalable</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-14 leading-relaxed font-semibold">
          Stop sending generic spam. Our AI agent researches your prospects, 
          deeply understands their business, and crafts hyper-personalized 
          emails that actually get replies.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/create"
            className="w-full sm:w-auto px-10 py-4.5 bg-brand-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/40 hover:scale-105 transition-all active:scale-95"
          >
            <Zap className="w-5 h-5 fill-white" />
            Start New Campaign
          </Link>
          <Link
            to="/active"
            className="w-full sm:w-auto px-10 py-4.5 bg-white border border-zinc-100 text-[#1e293b] rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all shadow-sm"
          >
            <BarChart3 className="w-5 h-5 text-brand-primary" />
            Active Campaigns
          </Link>
        </div>
      </section>

      {/* Stats/Intelligence Title Section */}
      <section className="py-16 px-6 text-center max-w-[1440px] mx-auto w-full">
         <h2 className="text-4xl md:text-[52px] font-black text-[#1e293b] mb-8 tracking-tighter mt-10">
            The intelligence engine for modern <br /> sales teams
         </h2>
         <p className="text-lg text-zinc-400 font-semibold mb-20 max-w-3xl mx-auto leading-relaxed">
            We handle the heavy lifting of research and personalization, so your team <br />
            can focus on what they do best: closing deals.
         </p>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {features.map((feature, i) => (
               <div key={i} className="bg-white border border-zinc-100 p-10 rounded-[32px] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-start text-left">
                  <div className="bg-brand-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8">
                     {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black text-[#1e293b] mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-[#64748b] font-semibold leading-relaxed text-base">
                     {feature.description}
                  </p>
               </div>
            ))}
         </div>
      </section>

      {/* Platform Action Section */}
      <section className="py-20 px-6 bg-zinc-50/50 w-full flex flex-col items-center">
         <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-[52px] font-black text-[#1e293b] mb-6 tracking-tight">
               See the platform in action
            </h2>
            <p className="text-lg text-zinc-400 font-semibold">
               Manage your entire outreach workflow from a single, powerful dashboard.
            </p>
         </div>

         <div className="w-full max-w-[1440px] relative">
            <div className="absolute inset-0 bg-brand-primary/10 blur-[120px] rounded-full scale-125 opacity-30" />
            
            <div className="relative bg-white border border-zinc-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] rounded-[40px] p-4 group overflow-hidden">
               <div className="bg-[#f8fafc] rounded-[32px] overflow-hidden flex min-h-[640px]">
                  {/* Dashboard Sidebar */}
                  <div className="w-64 bg-white border-r border-zinc-100 p-6 flex flex-col gap-8 hidden lg:flex">
                     <div className="px-4 py-3 bg-brand-primary text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 mb-4">
                        New Campaign
                     </div>
                     <div className="flex flex-col gap-2">
                        {[
                           { icon: <LayoutDashboard size={18} />, name: "Dashboard", active: false },
                           { icon: <Globe size={18} />, name: "Campaigns", active: true },
                           { icon: <FileText size={18} />, name: "Templates", active: false },
                           { icon: <Users size={18} />, name: "Contacts", active: false },
                           { icon: <BarChart3 size={18} />, name: "Analytics", active: false },
                           { icon: <Settings size={18} />, name: "Settings", active: false },
                        ].map((item, i) => (
                           <div key={i} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${item.active ? 'bg-zinc-50 text-brand-primary shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50'}`}>
                              {item.icon}
                              {item.name}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Dashboard Main Content */}
                  <div className="flex-grow p-10 flex flex-col gap-10">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[28px] font-black text-[#1e293b] tracking-tight">Active Campaigns</h3>
                     </div>

                     <div className="flex flex-col lg:flex-row gap-8">
                        {/* Table Mockup */}
                        <div className="flex-grow bg-white border border-zinc-100 rounded-[24px] shadow-sm p-8">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest border-b border-zinc-50">
                                    <th className="pb-5">Campaign Name</th>
                                    <th className="pb-5">Status</th>
                                    <th className="pb-5">Sent</th>
                                    <th className="pb-5 text-right">Replies</th>
                                 </tr>
                              </thead>
                              <tbody className="text-sm">
                                 {[
                                    { name: "Q3 Lead Gen", status: "Running", sent: "1248", replies: "45%" },
                                    { name: "Q2 Lead Gen", status: "Paused", sent: "3215", replies: "31%" },
                                    { name: "Partnership Outreach", status: "Paused", sent: "328", replies: "48%" },
                                    { name: "Event Follow-up", status: "Paused", sent: "231", replies: "52%" },
                                 ].map((row, i) => (
                                    <tr key={i} className="text-[#1e293b] font-bold group border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50">
                                       <td className="py-5 flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-indigo-200" />
                                          {row.name}
                                       </td>
                                       <td className="py-5 font-black text-[10px] uppercase">
                                          <span className={`px-3 py-1.5 rounded-full ${row.status === 'Running' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                             {row.status}
                                          </span>
                                       </td>
                                       <td className="py-5 text-zinc-400 font-medium">{row.sent}</td>
                                       <td className="py-5 text-right text-brand-primary font-black">{row.replies}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>

                        {/* Charts Mockup */}
                        <div className="w-full lg:w-[340px] flex flex-col gap-8">
                            <div className="aspect-square bg-white border border-zinc-100 rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                    <div className="absolute inset-0 rounded-full border-[12px] border-zinc-50 border-t-brand-primary animate-[spin_3s_linear_infinite]" />
                                    <div className="text-3xl font-black text-brand-primary">48%</div>
                                </div>
                                <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Average Reply Rate</p>
                            </div>
                            <div className="flex-grow bg-white border border-zinc-100 rounded-[24px] p-8 flex flex-col justify-end shadow-sm">
                                <div className="flex items-end gap-3 h-24 mb-6">
                                    {[30, 70, 45, 90, 60, 35].map((h, i) => (
                                       <div key={i} className="flex-grow bg-brand-primary/10 rounded-full relative group cursor-pointer overflow-hidden border border-brand-primary/5">
                                          <div style={{ height: `${h}%` }} className="absolute bottom-0 left-0 right-0 bg-brand-primary rounded-full transition-all group-hover:scale-110" />
                                       </div>
                                    ))}
                                </div>
                                <p className="text-[#1e293b] font-black text-center text-sm">Campaign Evolution</p>
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Home;
