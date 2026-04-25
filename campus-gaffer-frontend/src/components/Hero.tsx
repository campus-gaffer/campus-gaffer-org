import { Button } from "@/components/ui/button"
import HeroImage from "@/assets/campus-gaffer-hero.jpeg"
import { ArrowRight, Trophy, Zap, Star, Flame, Swords, BadgeCheck } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 px-6 md:px-12 bg-background">
      {/* Dotted grid pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#00E676 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}
      />
      
      {/* Stadium spotlight glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto grid lg:grid-cols-2 gap-16 relative z-10 items-center">
        {/* LEFT — Text content */}
        <div className="flex flex-col justify-center space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
          
          {/* Live badge */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-primary/10 border-2 border-primary/30 rounded-full animate-pulse">
              <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_12px_rgba(0,230,118,0.8)]" />
              <span className="text-primary font-black text-xs tracking-[0.3em] uppercase">Season Active • 2026</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-4 py-3 bg-secondary/50 border border-white/5 rounded-full">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="text-slate-400 font-black text-[10px] tracking-[0.2em] uppercase">HOT RIGHT NOW</span>
            </div>
          </div>

          {/* Main heading — cartoonishly huge */}
          <div className="space-y-4">
            <h1 className="text-7xl md:text-8xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter text-white uppercase italic">
              <span className="inline-block transform -skew-x-3 hover:skew-x-0 transition-transform duration-300">OWN</span>
              <br />
              <span className="inline-block transform -skew-x-3 hover:skew-x-0 transition-transform duration-300">THE</span>
              <br />
              <span className="text-primary inline-block transform -skew-x-6 drop-shadow-[0_0_60px_rgba(0,230,118,0.6)] animate-pulse">
                CAMPUS
              </span>
            </h1>
          </div>

          {/* Subtitle with border accent */}
          <p className="text-slate-400 text-xl md:text-2xl font-bold leading-relaxed max-w-xl border-l-[3px] border-primary pl-8 py-2 italic">
            The premier fantasy sports platform for university intramural leagues.
            Draft real students. Score real points. <span className="text-primary not-italic">Become a campus legend.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 pt-4">
            <Button className="font-black italic tracking-[0.15em] px-10 h-20 text-xl bg-primary text-background hover:bg-primary/90 rounded-2xl shadow-[0_0_50px_rgba(0,230,118,0.5)] transition-all hover:scale-105 active:scale-95 flex gap-3 items-center group">
              <Swords className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              START YOUR SEASON
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="font-black italic tracking-[0.15em] px-10 h-20 text-xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-2xl transition-all">
              HOW IT WORKS
            </Button>
          </div>

          {/* Animated stats bar */}
          <div className="flex items-center gap-8 pt-8 border-t-2 border-white/5">
            {[
              { value: "12K+", label: "ACTIVE MANAGERS", icon: Zap },
              { value: "$0", label: "ENTRY FEE", icon: BadgeCheck },
              { value: "50+", label: "UNIVERSITIES", icon: Trophy },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white italic">{stat.value}</span>
                  <span className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Hero image with floating badges */}
        <div className="relative flex justify-center items-center animate-in fade-in zoom-in slide-in-from-right-12 duration-1000 delay-200">
          <div className="relative w-full max-w-xl transform-gpu">
            
            {/* Main image card */}
            <div className="aspect-[4/5] relative rounded-[3rem] overflow-hidden border-2 border-primary/20 bg-secondary shadow-[0_0_80px_rgba(0,230,118,0.15)] group hover:shadow-[0_0_120px_rgba(0,230,118,0.25)] transition-all duration-700">
              <img
                src={HeroImage}
                alt="Student Athletes"
                className="object-cover w-full h-full brightness-75 contrast-125 saturate-50 group-hover:scale-105 transition-transform duration-[2s]"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[3rem]" />
              
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,230,118,0.03)_2px,rgba(0,230,118,0.03)_4px)] pointer-events-none" />
            </div>

            {/* Floating badge top-left — WEEKLY CHAMP */}
            <div className="absolute -top-4 -left-4 p-5 bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-primary/40 z-30 shadow-[0_0_40px_rgba(0,230,118,0.3)] animate-bounce-slow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-primary fill-primary" />
                </div>
                <div>
                  <div className="font-black text-[10px] text-primary tracking-[0.2em] uppercase">WEEKLY CHAMP</div>
                  <div className="font-black text-xl text-white italic">Alex Johnson</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-slate-400">9.8 RATING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge bottom-right — LIVE NOW */}
            <div className="absolute -bottom-4 -right-4 p-5 bg-primary/95 backdrop-blur-xl rounded-3xl z-30 shadow-[0_0_40px_rgba(0,230,118,0.5)] animate-float">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-background/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-background rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
                <div>
                  <div className="font-black text-[10px] text-background/80 tracking-[0.2em] uppercase">LIVE MATCHES</div>
                  <div className="font-black text-2xl text-background italic">3 GAMES</div>
                </div>
              </div>
            </div>
          </div>

          {/* Background glow behind image */}
          <div className="absolute -inset-10 bg-primary/20 blur-[100px] -z-10 rounded-[4rem] animate-pulse" />
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-[8px] font-black text-slate-600 tracking-[0.3em] uppercase">SCROLL</span>
        <div className="w-5 h-8 rounded-full border-2 border-slate-700 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
