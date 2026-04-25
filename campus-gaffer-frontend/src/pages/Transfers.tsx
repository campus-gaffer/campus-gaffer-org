import { useState, useEffect } from "react";
import { Bell, Users, PlusCircle, Search, TrendingUp, Filter, Settings } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

const MOCK_PLAYERS = [
  { id: 1, name: "Henderson", team: "Arts & Humanities", price: 8.5, role: "FWD", form: "+2.4", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver" },
  { id: 2, name: "Davies", team: "Engineering", price: 6.2, role: "MID", form: "+1.1", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah" },
];

export default function Transfers() {
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/players")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map((p: any) => ({
            id: p.ID,
            name: p.name,
            team: p.university,
            price: p.price,
            role: p.position,
            form: `+${p.weekly_points || 0}`,
            img: p.img_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
          }));
          setPlayers(mapped);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("Using mock data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
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
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Transfer Market</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">Optimize your season squad</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-secondary/50 px-8 py-5 rounded-[2rem] border border-white/5 text-center shadow-xl">
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Available Budget</span>
                <span className="text-2xl md:text-4xl font-black italic text-primary tracking-tighter">$14.5M</span>
              </div>
              <button className="hidden md:flex p-6 bg-secondary/50 border border-white/5 rounded-[2rem] hover:bg-secondary transition-colors text-slate-400">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Market Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="SEARCH PLAYERS..."
                    className="w-full bg-secondary/50 border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-sm font-black tracking-widest focus:outline-none focus:border-primary/50 uppercase placeholder:text-slate-700 shadow-xl"
                  />
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  {['ALL', 'FWD', 'MID', 'DEF', 'GK'].map((cat, i) => (
                    <button key={cat} className={`px-8 py-4 rounded-2xl text-[10px] md:text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${i === 0 ? 'bg-primary text-background shadow-xl shadow-primary/20' : 'bg-secondary/50 text-slate-500 border border-white/5 hover:border-primary/30 hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                  <button className="p-4 bg-secondary/50 border border-white/5 rounded-2xl text-primary hover:bg-primary hover:text-background transition-all shadow-xl">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Player Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-card/20 rounded-[2.5rem] animate-pulse border border-white/5" />
                  ))
                ) : players.map((player: any) => (
                  <div key={player.id} className="bg-card border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden text-left shadow-2xl">
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-secondary border border-white/10 group-hover:border-primary/40 transition-all overflow-hidden relative shadow-inner">
                        <img src={player.img} alt={player.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 right-0 bg-primary/20 backdrop-blur-md px-2 py-1 rounded-tl-xl text-[8px] md:text-[10px] font-black text-primary">
                          {player.role}
                        </div>
                      </div>
                      <div>
                        <p className="text-lg md:text-xl font-black text-white uppercase leading-none mb-2 group-hover:text-primary transition-colors">{player.name}</p>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">{player.team}</p>
                      </div>
                    </div>

                    <div className="text-right relative z-10">
                      <div className="flex flex-col items-end gap-1 mb-4">
                        <p className="text-2xl md:text-3xl font-black italic text-white tracking-tighter leading-none">£{player.price}M</p>
                        <p className={`text-[9px] md:text-[10px] font-black italic italic leading-none ${player.form.startsWith('+') ? 'text-primary' : 'text-rose-500'}`}>{player.form}% FORM</p>
                      </div>
                      <button className="w-12 h-12 md:w-14 md:h-14 bg-secondary/80 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-primary hover:text-background transition-all group-hover:scale-110 shadow-lg">
                        <PlusCircle className="w-6 h-6 md:w-8 md:h-8" />
                      </button>
                    </div>

                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                      <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* Selection Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-10 h-fit sticky top-32 text-center shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-primary/5 rotate-45 group-hover:rotate-0 transition-transform">
                  <TrendingUp className="w-48 h-48" />
                </div>

                <div className="relative z-10">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary mb-6 animate-pulse">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Squad Revisions</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">Select players to swap</p>

                  <div className="bg-background/40 border border-white/5 rounded-[2rem] p-10 mb-10 flex flex-col items-center justify-center gap-6 group-hover:border-primary/20 transition-colors">
                    <div className="w-12 h-12 border-2 border-dashed border-slate-800 rounded-full flex items-center justify-center">
                      <PlusCircle className="w-6 h-6 text-slate-800" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-[160px]">Select players from market to begin trade</p>
                  </div>

                  <button disabled className="w-full py-6 bg-primary/10 border border-primary/20 rounded-[2rem] text-primary/40 font-black text-sm tracking-[0.3em] uppercase transition-all">
                    CONFIRM TRANSFERS
                  </button>
                  <p className="text-[10px] font-bold text-slate-800 uppercase italic tracking-widest mt-6">Point penalties apply for excessive trades</p>
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
