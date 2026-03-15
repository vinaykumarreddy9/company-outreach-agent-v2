import { Link, useLocation } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Create Campaign", path: "/create" },
    { name: "Active Campaigns", path: "/active" },
    { name: "Inactive Campaigns", path: "/inactive" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white">
      {/* Blue Top Accent Bar */}
      <div className="h-1.5 w-full bg-brand-primary" />
      
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
           <img 
             src="/logo.jpg" 
             alt="Corporate Logo" 
             className="h-9 w-auto object-contain rounded-lg"
           />
           <div className="h-8 w-[1px] bg-slate-100 mx-1" />
           <div className="flex flex-col">
             <span className="font-black text-sm tracking-widest text-[#1e293b] leading-none uppercase">
                Enterprise
             </span>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Command
             </span>
           </div>
        </Link>

        {/* Navigation Links - Centered */}
        <nav className="flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-[12px] font-bold uppercase tracking-widest transition-colors relative h-16 flex items-center ${
                isActive(link.path) ? "text-brand-primary" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
              )}
            </Link>
          ))}
        </nav>

        {/* Spacing Offset for symmetry */}
        <div className="w-[140px] hidden lg:block" />
      </div>
    </header>
  );
};

export default Navbar;
