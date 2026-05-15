import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SignInButton } from '@clerk/clerk-react'
import HeroImage from "@/assets/campus-gaffer-hero.jpeg"
import { ArrowRight, Trophy, Flame, Swords, BadgeCheck, Sparkles } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Hero() {
  const [topManager, setTopManager] = useState("Alex Johnson");
  const [topRating, setTopRating] = useState("9.8");
  const [liveCount, setLiveCount] = useState(3);

  useEffect(() => {
    // Fetch top manager
    fetch(API_URL + "/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTopManager(data[0].username);
          setTopRating(Math.min(10, Math.round((data[0].total_points / 50) * 10) / 10).toFixed(1));
        }
      })
      .catch(() => {});

    // Fetch live match count
    fetch(API_URL + "/matches")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLiveCount(data.filter((m: any) => m.is_live).length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 px-6 md:px-12 bg-background">
      {/* Dotted grid pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#8B5CF6 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}
      />
      
      {/* Violet spotlight glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/5 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-500/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 relative z-10 items-center">
        {/* LEFT — Text content */}
        <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
          
          {/* Live badge */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border-2 border-violet-500/30 rounded-full">
              <div className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
              <span className="text-violet-400 font-semibold text-xs tracking-[0.3em] uppercase">Season Active • 2026</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border border-white/5 rounded-full">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-slate-400 font-semibold text-[10px] tracking-[0.2em] uppercase">Hot Right Now</span>
            </div>
          </div>

          {/* Main heading — big but not cartoonishly huge */}
          <div className="space-y-3">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.92] tracking-tight text-white uppercase">
              OWN<br />
              THE<br />
              <span className="text-violet-400 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                CAMPUS
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl border-l-[3px] border-violet-500/50 pl-6 py-1">
            The premier fantasy sports platform for university intramural leagues.
            Draft real students. Score real points. <span className="text-violet-300 font-semibold">Become a campus legend.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <Button className="font-bold tracking-[0.1em] px-8 h-16 text-base bg-violet-600 text-white hover:bg-violet-500 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.03] active:scale-95 flex gap-3 items-center group cursor-pointer">
                <Swords className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                START YOUR SEASON
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignInButton>
            <Button
              variant="outline"
              onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="font-bold tracking-[0.1em] px-8 h-16 text-base border-2 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5 rounded-2xl transition-all cursor-pointer"
            >
              HOW IT WORKS
            </Button>
          </div>

          {/* Animated stats bar */}
          <div className="flex items-center gap-8 pt-6 border-t border-white/5">
            {[
              { value: "$0", label: "ENTRY FEE", icon: BadgeCheck },
              { value: "50+", label: "UNIVERSITIES", icon: Trophy },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:scale-110 transition-all">
                  <stat.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{stat.value}</span>
                  <span className="text-[9px] font-semibold text-slate-500 tracking-[0.15em] uppercase">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Hero image */}
        <div className="relative flex justify-center items-center animate-in fade-in zoom-in slide-in-from-right-12 duration-1000 delay-200">
          <div className="relative w-full max-w-xl transform-gpu">
            
            {/* Main image card */}
            <div className="aspect-[4/5] relative rounded-[2rem] overflow-hidden border-2 border-violet-500/20 bg-secondary shadow-[0_0_60px_rgba(139,92,246,0.12)] group hover:shadow-[0_0_100px_rgba(139,92,246,0.2)] transition-all duration-700">
              <img
                src={HeroImage}
                alt="Student athletes in action on campus"
                className="object-cover w-full h-full brightness-90 saturate-[1.1] group-hover:scale-105 transition-transform duration-[2s]"
              />
              {/* Violet gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-[2rem]" />
              
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(139,92,246,0.02)_2px,rgba(139,92,246,0.02)_4px)] pointer-events-none" />
            </div>

            {/* Floating badge top-left — WEEKLY CHAMP */}
            <div className="absolute -top-3 -left-3 p-4 bg-card/95 backdrop-blur-xl rounded-2xl border-2 border-violet-500/30 z-30 shadow-[0_0_30px_rgba(139,92,246,0.25)] animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-violet-400 fill-violet-400/30" />
                </div>
                <div>
                  <div className="font-bold text-[9px] text-violet-400 tracking-[0.2em] uppercase">WEEKLY CHAMP</div>
                  <div className="font-bold text-lg text-white">{topManager}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-[9px] font-medium text-slate-400">{topRating} RATING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge bottom-right — LIVE NOW */}
            <div className="absolute -bottom-3 -right-3 p-4 bg-violet-600/95 backdrop-blur-xl rounded-2xl z-30 shadow-[0_0_30px_rgba(139,92,246,0.4)] animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <div className="font-bold text-[9px] text-white/70 tracking-[0.2em] uppercase">LIVE MATCHES</div>
                  <div className="font-bold text-xl text-white">{liveCount} GAMES</div>
                </div>
              </div>
            </div>
          </div>

          {/* Background glow behind image */}
          <div className="absolute -inset-10 bg-violet-500/20 blur-[100px] -z-10 rounded-[4rem]" />
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
        <span className="text-[7px] font-semibold text-slate-600 tracking-[0.3em] uppercase">SCROLL</span>
        <div className="w-4 h-7 rounded-full border-2 border-slate-700 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-violet-500 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
