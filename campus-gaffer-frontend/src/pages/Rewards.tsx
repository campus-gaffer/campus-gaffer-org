import { Bell, ArrowLeft, Gift, Sparkles, Lock } from "lucide-react";
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
        <div className="max-w-2xl mx-auto">
          {/* Mystery Section */}
          <section className="bg-card border border-white/5 rounded-[4rem] p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Decorative background elements */}
            <div className="absolute top-[-60px] right-[-60px] w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute bottom-[-60px] left-[-60px] w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

            <div className="relative z-10 flex flex-col items-center gap-8">
              {/* Mystery Icon */}
              <div className="w-28 h-28 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center group hover:bg-primary/20 hover:border-primary/40 transition-all shadow-xl shadow-primary/5 animate-pulse">
                <Lock className="w-14 h-14 text-primary/60 group-hover:text-primary/80 transition-colors" />
              </div>

              {/* Badge */}
              <div className="flex items-center gap-2 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary tracking-[0.3em]">SEASON 1 — COMING SOON</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>

              {/* Title */}
              <div className="space-y-3">
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none">
                  MYSTERY
                </h2>
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-primary leading-none">
                  REWARDS
                </h2>
              </div>

              {/* Description */}
              <p className="text-slate-500 font-bold text-xs md:text-sm tracking-[0.2em] max-w-md leading-relaxed">
                Weekly prizes for top managers are being locked in. First season drops soon.
              </p>

              {/* Divider */}
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              {/* Stats hint */}
              <div className="flex items-center gap-2 text-slate-600">
                <Gift className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest">PRIZES UNLOCK AT SEASON START</span>
                <Gift className="w-4 h-4" />
              </div>
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
