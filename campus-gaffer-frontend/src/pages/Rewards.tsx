import { Bell, ArrowLeft, Gift, Sparkles, Lock, Trophy, Medal, Star, Zap } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import { useNavigate } from "react-router-dom";

export default function Rewards() {
  const navigate = useNavigate();

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
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
            <div className="text-left">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Weekly Rewards</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">Climb the ranks and claim your prizes</p>
            </div>
            <Gift className="w-12 h-12 text-primary/30 hidden md:block" />
          </div>

          {/* Mystery Hero Card */}
          <section className="bg-card border border-white/5 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-80px] right-[-80px] w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-80px] left-[-80px] w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

            <div className="relative z-10 flex flex-col items-center gap-8">
              {/* Lock Icon */}
              <div className="w-32 h-32 rounded-[3rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center group hover:bg-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5">
                <Lock className="w-16 h-16 text-primary/60 group-hover:text-primary/80 transition-colors" />
              </div>

              {/* Badge */}
              <div className="flex items-center gap-2 bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary tracking-[0.3em]">SEASON 1 — COMING SOON</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none">
                  MYSTERY
                </h2>
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-primary leading-none">
                  REWARDS
                </h2>
              </div>

              <p className="text-slate-500 font-bold text-xs md:text-sm tracking-[0.2em] max-w-lg leading-relaxed">
                Weekly prizes for top managers are being locked in. The first season drops soon with exclusive campus rewards.
              </p>

              <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <div className="flex items-center gap-2 text-slate-600">
                <Gift className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest">PRIZES UNLOCK AT SEASON START</span>
                <Gift className="w-4 h-4" />
              </div>
            </div>
          </section>

          {/* Prize Tier Preview */}
          <section className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 opacity-60 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-amber-700/20 border-2 border-amber-700/30 flex items-center justify-center mx-auto">
                <Medal className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-black italic text-amber-600">3RD</div>
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-black text-slate-600 tracking-widest">TBD</span>
              </div>
            </div>
            <div className="bg-card border-2 border-primary/30 rounded-[2.5rem] p-10 text-center space-y-6 shadow-xl shadow-primary/5 relative -mt-4 md:-mt-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-6 py-1.5 rounded-full text-[10px] font-black text-background tracking-widest shadow-lg">TOP PRIZE</div>
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <div className="text-3xl font-black italic text-primary">1ST</div>
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] font-black text-primary/60 tracking-widest">MYSTERY</span>
              </div>
            </div>
            <div className="bg-card border border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 opacity-60 hover:opacity-80 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-slate-400/20 border-2 border-slate-400/30 flex items-center justify-center mx-auto">
                <Medal className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-2xl font-black italic text-slate-400">2ND</div>
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-slate-600" />
                <span className="text-[10px] font-black text-slate-600 tracking-widest">TBD</span>
              </div>
            </div>
          </section>

          {/* Roadmap */}
          <section className="bg-secondary/20 border border-white/5 rounded-[3rem] p-12 md:p-16 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary" />
            <div className="space-y-12 relative z-10">
              <div className="flex items-center gap-3 text-left">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="text-xl italic font-black text-primary tracking-widest">SEASON ROADMAP</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                {[
                  { phase: "01", title: "PRE-SEASON", desc: "Squad building, learning the platform. Points tracking and leaderboard active.", status: "LIVE" },
                  { phase: "02", title: "SEASON 1", desc: "First competitive season. Weekly prizes, exclusive campus rewards unlock.", status: "COMING SOON" },
                  { phase: "03", title: "CHAMPIONSHIP", desc: "Top managers compete for the season trophy. Grand prizes awarded.", status: "COMING SOON" },
                ].map(item => (
                  <div key={item.phase} className="bg-card/50 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-black italic text-primary/20">{item.phase}</span>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.status === 'LIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary/10 text-primary border border-primary/20'}`}>{item.status}</span>
                    </div>
                    <h4 className="text-sm font-black text-white tracking-wider">{item.title}</h4>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed tracking-widest">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom Note */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-slate-600 bg-card/50 border border-white/5 rounded-full px-6 py-3">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-widest">REWARDS RESET EVERY GAMEWEEK</span>
              <Zap className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
