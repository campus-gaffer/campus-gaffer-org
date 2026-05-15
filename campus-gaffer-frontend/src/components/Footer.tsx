import { Link } from "react-router-dom"
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import CampusLogo from "@/assets/campus-logo.png"

export default function Footer() {
  return (
    <footer className="py-20 px-8 border-t-2 border-white/5 bg-background relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Main footer content */}
        <div className="grid md:grid-cols-3 gap-12 items-start">
          
          {/* Brand column */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <SignedIn>
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <img src={CampusLogo} alt="Campus Gaffer" className="h-10 w-auto" />
              </Link>
            </SignedIn>
            <SignedOut>
              <Link to="/" className="flex items-center gap-3 group">
                <img src={CampusLogo} alt="Campus Gaffer" className="h-10 w-auto" />
              </Link>
            </SignedOut>
            <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] text-center md:text-left italic">
              BECOME A CAMPUS LEGEND.
            </p>
          </div>

          {/* Links column */}
          <div className="flex flex-col items-center gap-6">
            <span className="text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase">NAVIGATION</span>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { name: "LEAGUES", path: "/leagues" },
                { name: "RULES", path: "/rules" },
                { name: "ABOUT", path: "/about" },
                { name: "SCORES", path: "/scores" },
              ].map(link => (
                <Link key={link.name} to={link.path} className="font-black text-xs text-slate-400 hover:text-primary tracking-[0.2em] uppercase transition-colors relative group">
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>
            
            {/* Legal links */}
            <div className="flex gap-6 pt-4">
              <a href="#" className="font-bold text-[10px] text-slate-600 hover:text-slate-400 tracking-widest uppercase transition-colors">PRIVACY</a>
              <a href="#" className="font-bold text-[10px] text-slate-600 hover:text-slate-400 tracking-widest uppercase transition-colors">TERMS</a>
              <a href="#" className="font-bold text-[10px] text-slate-600 hover:text-slate-400 tracking-widest uppercase transition-colors">SUPPORT</a>
            </div>
          </div>

          {/* Status column */}
          <div className="flex flex-col items-center md:items-end gap-6">
            <span className="text-[10px] font-black text-slate-600 tracking-[0.3em] uppercase">SYSTEM STATUS</span>
            
            <div className="flex flex-col gap-4 items-center md:items-end">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">SEASON 2026 ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        </div>
      </div>
    </footer>
  )
}
