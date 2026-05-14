import { useState, useEffect } from "react";
import { Bell, Trophy, Medal, ArrowLeft, Loader2, Gift, Star, Zap, Sparkles } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type Reward = {
  week: number;
  rank_1_prize: string;
  rank_2_prize: string;
  rank_3_prize: string;
  active: boolean;
};

export default function Rewards() {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/rewards")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRewards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden uppercase">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg italic font-black tracking-wider text-primary">Weekly Rewards</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="w-6 h-6 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background shadow-lg"></span>
        </button>
      </header>

      <main className="container mx-auto px-6 py-8 md:py-16 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
            <div className="text-left">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Weekly Rewards</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">Climb the ranks and claim your prizes</p>
            </div>
            <Gift className="w-12 h-12 text-primary/30 hidden md:block" />
          </div>

          {/* Podium */}
          <section className="bg-card border border-white/5 rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-tr-full" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-black text-primary tracking-[0.3em]">THIS WEEK'S PRIZES</span>
                <Sparkles className="w-6 h-6 text-primary" />
              </div>

              {loading ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
              ) : rewards.length === 0 ? (
                <div className="py-12">
                  <Trophy className="w-20 h-20 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-black italic text-lg">No active rewards yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  {/* Silver - 2nd */}
                  <div className="order-2 md:order-2 bg-secondary/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 group hover:border-slate-400/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-slate-400/20 border-2 border-slate-400/40 flex items-center justify-center">
                      <Medal className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black italic text-slate-400">2ND</div>
                    <div className="text-xs font-black text-slate-400 tracking-widest">{rewards[0]?.rank_2_prize || "—"}</div>
                  </div>

                  {/* Gold - 1st */}
                  <div className="order-1 md:order-1 md:-mt-8 bg-card border-2 border-primary/40 rounded-[2.5rem] p-10 flex flex-col items-center gap-6 group hover:border-primary shadow-xl shadow-primary/10 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-6 py-1.5 rounded-full text-[10px] font-black text-background tracking-widest shadow-lg">TOP PRIZE</div>
                    <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-primary fill-primary" />
                    </div>
                    <div className="text-3xl font-black italic text-primary">1ST</div>
                    <div className="text-sm font-black text-white tracking-wider">{rewards[0]?.rank_1_prize || "—"}</div>
                  </div>

                  {/* Bronze - 3rd */}
                  <div className="order-3 md:order-3 bg-secondary/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 group hover:border-amber-700/30 transition-all">
                    <div className="w-16 h-16 rounded-full bg-amber-700/20 border-2 border-amber-700/40 flex items-center justify-center">
                      <Medal className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black italic text-amber-600">3RD</div>
                    <div className="text-xs font-black text-amber-600/70 tracking-widest">{rewards[0]?.rank_3_prize || "—"}</div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-center justify-center gap-2 text-slate-600">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest">REWARDS RESET EVERY GAMEWEEK</span>
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </section>

          {/* Upcoming Weeks */}
          {rewards.length > 1 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-1 text-left">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="text-xl italic font-black text-primary tracking-widest">Future Prizes</h3>
              </div>
              <div className="space-y-4">
                {rewards.slice(1).map(r => (
                  <div key={r.week} className="bg-card border border-white/5 rounded-[2rem] p-8 flex items-center justify-between group hover:border-primary/20 transition-all cursor-default relative overflow-hidden shadow-xl text-left">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/50 border border-white/5 flex items-center justify-center">
                        <span className="text-xl font-black text-primary">W{r.week}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black text-white leading-none">GAMEWEEK {r.week}</p>
                        <div className="flex flex-wrap gap-3">
                          <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase">1st: {r.rank_1_prize}</span>
                          <span className="text-[9px] font-black bg-slate-500/10 text-slate-400 px-2 py-1 rounded uppercase">2nd: {r.rank_2_prize}</span>
                          <span className="text-[9px] font-black bg-amber-700/10 text-amber-600 px-2 py-1 rounded uppercase">3rd: {r.rank_3_prize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Info Card */}
          <section className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 text-center">
            <h3 className="text-2xl font-black italic text-white uppercase mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8 text-left max-w-2xl mx-auto">
              {[
                { step: "01", title: "BUILD YOUR SQUAD", desc: "Select 6 players within a $100M budget to compete each gameweek." },
                { step: "02", title: "EARN POINTS", desc: "Your players score points based on their real-world match performances." },
                { step: "03", title: "WIN PRIZES", desc: "Top 3 managers in each university win campus rewards every week!" },
              ].map(item => (
                <div key={item.step}>
                  <div className="text-4xl font-black italic text-primary/20 mb-2">{item.step}</div>
                  <h4 className="text-sm font-black text-white mb-2">{item.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
