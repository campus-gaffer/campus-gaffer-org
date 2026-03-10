import { Button } from "@/components/ui/button"
import HeroImage from "@/assets/campus-gaffer-hero.jpeg"

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20 px-6 md:px-12 bg-background">
      {/* Background patterns/grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#FF1644 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
      />
      
      {/* Neon Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto grid lg:grid-cols-2 gap-12 relative z-10">
        <div className="flex flex-col justify-center space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] tracking-[0.3em] uppercase">
              STATUS: SEASON ACTIVE 2026
            </div>
            <h1 className="text-7xl lg:text-9xl font-black leading-[0.85] tracking-tighter text-foreground uppercase italic drop-shadow-[0_0_15px_rgba(255,22,68,0.3)]">
              OWN THE <br />
              <span className="text-primary">CAMPUS</span>
            </h1>
          </div>
          
          <p className="text-muted-foreground text-lg md:text-xl font-mono leading-relaxed max-w-lg border-l-2 border-primary/20 pl-6">
            The premier fantasy sports platform for university intramural leagues. 
            Draft real students. Score real points. Become a campus legend.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <Button variant="crimson" size="lg" className="font-mono tracking-widest px-10 h-16 text-lg shadow-[0_0_25px_rgba(255,22,68,0.5)]">
              START YOUR SEASON
            </Button>
            <Button variant="crimsonOutline" size="lg" className="font-mono tracking-widest px-10 h-16 text-lg hover:shadow-[0_0_25px_rgba(255,22,68,0.3)]">
              HOW IT WORKS
            </Button>
          </div>
        </div>

        <div className="relative flex justify-end items-center animate-in fade-in zoom-in duration-1000">
          {/* Abstract background shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary/5 blur-[150px] rounded-full pointer-events-none animate-pulse" />
          
          <div className="relative w-full max-w-3xl scale-[1.1] transform-gpu group translate-x-12">
             <div className="aspect-[4/3] relative overflow-hidden">
                {/* Multi-directional blending masks */}
                <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_120px_rgba(2,2,2,1)]" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent z-20" />
                <div className="absolute top-0 left-0 w-1/4 h-full bg-gradient-to-r from-background to-transparent z-20" />
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-background to-transparent z-20" />
                
                {/* Neon scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-40 w-full -translate-y-full animate-[scanline_6s_linear_infinite] z-30 pointer-events-none opacity-50" />

                <div className="absolute inset-0 flex items-center justify-center z-10">
                   <div className="w-full h-full flex items-center justify-center contrast-110 saturate-[0.8] brightness-90 transition-all duration-1000">
                      <img 
                        src={HeroImage}
                        alt="Student Athletes" 
                        className="object-cover w-full h-full"
                      />
                   </div>
                </div>

                <div className="absolute top-8 left-8 p-4 bg-primary/10 border border-primary/20 backdrop-blur-sm z-30">
                   <div className="font-mono text-[10px] text-primary mb-1 tracking-[0.3em] uppercase">SYSTEM STATUS</div>
                   <div className="font-heading font-black text-2xl italic text-foreground tracking-tighter uppercase">LEGEND ACTIVE</div>
                </div>

                <div className="absolute bottom-8 left-8 p-4 bg-black/40 backdrop-blur-sm z-30 border-l-2 border-primary">
                   <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary animate-pulse" />
                      <div className="w-2 h-2 bg-primary/60" />
                      <div className="w-2 h-2 bg-primary/30" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
