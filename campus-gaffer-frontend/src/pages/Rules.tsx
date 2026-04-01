import { Bell, Target, Shield, Zap, Star } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const SCORING_RULES = [
  { action: "Goal Scored (FWD)", points: 4 },
  { action: "Goal Scored (MID)", points: 5 },
  { action: "Goal Scored (DEF/GK)", points: 6 },
  { action: "Assist", points: 3 },
  { action: "Clean Sheet (DEF/GK)", points: 4 },
  { action: "Clean Sheet (MID)", points: 1 },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden uppercase">
      {/* Desktop View Header (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header (Hidden on Desktop) */}
      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="Profile" />
          </div>
          <h1 className="text-lg italic font-extrabold tracking-wider text-primary">CAMPUS GAFFER</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="w-6 h-6 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
        </button>
      </header>

      <main className="container mx-auto px-6 py-8 md:py-16 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
            <div className="text-left">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Gameplay Rules</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] font-sans mt-2">Everything you need to master the game</p>
            </div>
            <Shield className="w-12 h-12 text-primary/30 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Point Scoring Column */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl md:text-2xl italic font-black text-primary uppercase tracking-widest">Point Scoring</h3>
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-4">
                {SCORING_RULES.map((rule, idx) => (
                  <div key={idx} className="bg-card border border-white/5 rounded-[2.5rem] p-10 flex items-center justify-between group hover:border-primary/20 transition-all cursor-default shadow-2xl relative overflow-hidden">
                    <span className="text-xs md:text-sm font-black text-slate-400 tracking-[0.3em] uppercase leading-none relative z-10">{rule.action}</span>
                    <span className="text-2xl md:text-4xl font-black italic text-primary leading-none group-hover:scale-110 transition-transform relative z-10">{rule.points} PTS</span>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/20 group-hover:bg-primary transition-all duration-300"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
                      <Target className="w-20 h-20 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mechanics & Chips Column */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-12">
              <div className="bg-secondary/30 border border-white/5 rounded-[3rem] p-12 md:p-16 space-y-12 text-left relative overflow-hidden group shadow-2xl">
                <div className="flex items-center gap-6 text-primary relative z-10">
                  <Shield className="w-12 h-12" />
                  <h3 className="text-3xl md:text-5xl italic font-black text-white tracking-widest uppercase italic leading-none">Squad & Budget</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-12 relative z-10">
                  {[
                    { title: "Team Size", desc: "6 PLAYERS (1 GK, 2 DEF, 2 MID, 1 FWD). YOUR SQUAD MUST ADHERE TO THIS FORMATION AT ALL TIMES." },
                    { title: "Budget Limit", desc: "$100M TOTAL SQUAD VALUE ALLOWED. MANAGE YOUR BUDGET WISELY TO SECURE TOP TALENT." },
                    { title: "Transfers", desc: "1 FREE TRANSFER PER GAMEWEEK. ADDITIONAL TRANSFERS INCUR A -4 POINT PENALTY ON TOTAL SCORE." },
                    { title: "Captaincy", desc: "YOUR CAPTAIN EARNS DOUBLE POINTS. VICE-CAPTAIN TAKES OVER IF THE MAIN CAPTAIN IS BENCHED." }
                  ].map(item => (
                    <div key={item.title} className="space-y-4">
                      <h4 className="text-primary font-black text-sm tracking-[0.2em]">{item.title}</h4>
                      <p className="text-[11px] md:text-xs font-bold text-slate-400 leading-relaxed tracking-widest font-sans">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="absolute -top-20 -right-20 text-primary/5 rotate-45 group-hover:rotate-12 transition-transform">
                  <Zap className="w-80 h-80" />
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl md:text-2xl italic font-black text-primary uppercase tracking-widest">Power Chips</h3>
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { title: "TRIPLE CAPTAIN", icon: <Star />, desc: "TRIPLE YOUR CAPTAIN'S POINTS FOR A SINGLE GAMEWEEK." },
                    { title: "FREE HIT", icon: <Zap />, desc: "UNLIMITED FREE TRANSFERS FOR ONE WEEK ONLY." },
                    { title: "WILDCARD", icon: <Shield />, desc: "RESET YOUR WHOLE SQUAD PERMANENTLY WITHOUT PENALTY." }
                  ].map(chip => (
                    <div key={chip.title} className="bg-card border border-white/5 p-10 rounded-[2.5rem] flex flex-col gap-6 text-center group hover:border-primary/40 transition-all cursor-default relative overflow-hidden shadow-2xl">
                      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto text-primary group-hover:scale-110 group-hover:rotate-12 transition-all shadow-inner border border-white/5">
                        {chip.icon}
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">{chip.title}</h4>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase leading-relaxed tracking-widest font-sans">{chip.desc}</p>
                      </div>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
