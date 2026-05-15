import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Trophy, Crown, Loader2 } from "lucide-react";
import CampusLogo from "@/assets/campus-logo.png";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type LeaderEntry = {
  clerk_id: string;
  username: string;
  team_name: string;
  university: string;
  total_points: number;
  budget: number;
  squad_value: number;
  avatar?: string;
};

export default function Leagues() {
  const navigate = useNavigate();
  const [allEntries, setAllEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllEntries(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }`}</style>
      {/* Desktop View Header (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-center px-4 py-2 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <img src={CampusLogo} alt="Campus Gaffer" className="h-16 w-auto" />
      </header>

      {/* Mobile Header (Hidden on Desktop) */}
      <main className="container mx-auto px-6 py-8 md:py-16 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
            <div>
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Ranks & Leagues</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">Global and campus competition</p>
            </div>

            <div className="hidden md:flex items-center gap-4">
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : allEntries.length === 0 ? (
            <div className="text-center py-24">
              <Trophy className="w-20 h-20 text-slate-700 mx-auto mb-6" />
              <p className="text-xl font-black italic uppercase text-slate-500 tracking-widest">No leaderboard data yet</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mt-3">Start building your squad to compete</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* All Managers League */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xl md:text-2xl italic font-black text-primary uppercase tracking-widest">
                  All Managers
                </h3>
                <Trophy className="w-6 h-6 text-primary" />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {allEntries.map((item) => {
                  const rank = allEntries.indexOf(item) + 1;
                  return (
                    <div
                      key={item.clerk_id}
                      onClick={() => navigate(`/profile/${item.clerk_id}`)}
                      className="bg-card border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group text-left relative overflow-hidden shadow-2xl"
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="relative">
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-secondary transition-colors ${
                            rank === 1 ? "border-[3px] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-[float_3s_ease-in-out_infinite]" :
                            "border-2 border-white/10 group-hover:border-primary/40"
                          }`}>
                            <img src={item.avatar ? `https://api.dicebear.com/7.x/${item.avatar}/svg?seed=${item.clerk_id}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`} alt={item.team_name} className="w-full h-full object-cover" />
                          </div>
                          <div className={`absolute -top-1 -left-1 w-8 h-8 font-black text-xs flex items-center justify-center rounded-full border-2 border-background shadow-lg ${
                            rank === 1 ? "bg-amber-400 text-background" :
                            "bg-primary text-background"
                          }`}>
                            {rank === 1 ? <Crown className="w-4 h-4" /> : rank}
                          </div>
                          {rank === 1 && (
                            <div className="absolute -inset-4 rounded-full bg-amber-400/10 blur-xl animate-pulse" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg md:text-xl font-black text-white uppercase leading-none mb-2">{item.team_name}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">{item.username}</p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-6 relative z-10">
                        <div>
                          <p className="text-3xl md:text-4xl font-black italic text-primary leading-none">{item.total_points}</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase text-right mt-1 tracking-widest">PTS</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-primary transition-colors" />
                      </div>

                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
                        <Trophy className="w-32 h-32 text-primary" />
                      </div>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-all" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
