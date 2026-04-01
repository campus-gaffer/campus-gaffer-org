import { Button } from "@/components/ui/button"
import HeroImage from "@/assets/campus-gaffer-hero.jpeg"
import { ArrowRight, Trophy, Zap, Star } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 px-6 md:px-12 bg-background">
      {/* Background patterns/grid */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#00E676 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      {/* Neon Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto grid lg:grid-cols-2 gap-16 relative z-10 items-center">
        <div className="flex flex-col justify-center space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-xs tracking-widest uppercase">
              <Zap className="w-4 h-4 fill-primary" />
              <span>Season Active • 2026</span>
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black leading-[0.8] tracking-tighter text-foreground uppercase italic drop-shadow-[0_0_30px_rgba(0,230,118,0.2)]">
              OWN THE <br />
              <span className="text-primary inline-block transform -skew-x-6">CAMPUS</span>
            </h1>
          </div>

          <p className="text-muted-foreground text-xl md:text-2xl font-medium leading-relaxed max-w-xl border-l-4 border-primary pl-8 py-2">
            The premier fantasy sports platform for university intramural leagues.
            Draft real students. Score real points. Become a campus legend.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            <Button className="font-bold tracking-widest px-12 h-20 text-xl bg-primary text-background hover:bg-primary/90 rounded-2xl shadow-[0_0_40px_rgba(0,230,118,0.4)] transition-all hover:scale-105 active:scale-95 flex gap-3 items-center">
              START YOUR SEASON
              <ArrowRight className="w-6 h-6" />
            </Button>
            <Button variant="outline" className="font-bold tracking-widest px-12 h-20 text-xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-2xl transition-all">
              HOW IT WORKS
            </Button>
          </div>

          <div className="flex items-center gap-8 pt-8 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">12K+</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Managers</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">$0</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entry Fee</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">50+</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Universities</span>
            </div>
          </div>
        </div>

        <div className="relative flex justify-end items-center animate-in fade-in zoom-in slide-in-from-right-12 duration-1000 delay-200">
          <div className="relative w-full max-w-2xl transform-gpu group perspective-1000 transition-all duration-700 hover:rotate-y-6">
            <div className="aspect-[4/5] relative rounded-[3rem] overflow-hidden border-2 border-primary/20 bg-secondary shadow-2xl">
              <img
                src={HeroImage}
                alt="Student Athletes"
                className="object-cover w-full h-full brightness-75 contrast-125 saturate-50 group-hover:scale-105 transition-transform duration-[2s]"
              />

              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

              {/* Floating UI Elements */}
              <div className="absolute top-10 left-10 p-6 bg-background/80 backdrop-blur-xl rounded-3xl border border-primary/30 z-30 shadow-2xl animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-primary tracking-widest uppercase">WEEKLY CHAMP</div>
                    <div className="font-black text-xl text-white">Alex Johnson</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 right-10 p-6 bg-primary backdrop-blur-xl rounded-3xl z-30 shadow-2xl animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-background fill-background" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-background/80 tracking-widest uppercase">MATCH RATING</div>
                    <div className="font-black text-2xl text-background">9.8 / 10</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background glow behind image */}
            <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-[4rem]" />
          </div>
        </div>
      </div>
    </section>
  )
}
