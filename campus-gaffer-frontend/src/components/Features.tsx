import { Users, TrendingUp, Trophy, ArrowUpRight, Sparkles, Target, Zap } from "lucide-react"
import { SignInButton } from '@clerk/clerk-react'

const features = [
  {
    title: "BUILD YOUR DYNASTY",
    subtitle: "SCOUT & DRAFT",
    content: "$100M virtual budget. 15-player squads. Scout real talent from your campus leagues and build an unstoppable roster.",
    icon: Users,
    accent: "from-violet-500/20 to-primary/5",
    id: "01",
  },
  {
    title: "MASTER THE MARKET",
    subtitle: "TRADE & PROFIT",
    content: "Weekly transfer deadlines. Play the fierce campus transfer market. Buy low, sell high, optimize your lineup.",
    icon: TrendingUp,
    accent: "from-blue-500/20 to-primary/5",
    id: "02",
  },
  {
    title: "LIVE GLORY",
    subtitle: "REAL-TIME POINTS",
    content: "Scoring powered by real match data. Watch your mates' performance turn into fantasy points in real-time.",
    icon: Trophy,
    accent: "from-amber-500/20 to-primary/5",
    id: "03",
  },
]

export default function Features() {
  const scrollToCTA = () => document.getElementById('features-cta')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="features-section" className="py-24 md:py-32 px-6 md:px-12 bg-background border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-5">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border-2 border-violet-500/20 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-400 font-semibold text-[10px] tracking-[0.3em] uppercase">HOW IT WORKS</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-12 w-1.5 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white uppercase leading-[0.9]">
                THE INTRAMURAL<br />
                <span className="text-violet-400">REVOLUTION</span>
              </h2>
            </div>
          </div>
          
          <p className="text-slate-400 font-medium text-base max-w-sm uppercase tracking-widest leading-relaxed border-l-2 border-violet-500/30 pl-5">
            EXPERIENCE THE EXCITEMENT OF PRO FANTASY SPORTS, SCALED FOR YOUR UNIVERSITY CAMPUS.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="relative overflow-hidden group bg-card/50 backdrop-blur-sm border border-white/5 hover:border-violet-500/40 rounded-[2.5rem] p-1 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_0_50px_rgba(139,92,246,0.1)]"
            >
              {/* Gradient accent at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} rounded-t-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="p-8 pt-10">
                {/* Big number background */}
                <div className="absolute top-6 right-8 text-5xl font-bold text-white/[0.03] group-hover:text-violet-500/[0.08] transition-colors select-none">
                  {feature.id}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border-2 border-violet-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-violet-600 group-hover:border-violet-500 transition-all duration-500 mb-6 shadow-[0_0_25px_rgba(139,92,246,0.1)]">
                  <feature.icon className="w-8 h-8 text-violet-400 group-hover:text-white transition-colors" />
                </div>

                {/* Subtitle tag */}
                <span className="inline-block text-[9px] font-bold text-violet-400 tracking-[0.15em] uppercase mb-2 bg-violet-500/5 px-3 py-1 rounded-full border border-violet-500/10">
                  {feature.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors mb-3 leading-tight">
                  {feature.title}
                </h3>

                {/* Content */}
                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">
                  {feature.content}
                </p>

                {/* CTA */}
                <button onClick={scrollToCTA} className="flex items-center gap-2 text-violet-400 font-bold text-sm tracking-[0.1em] uppercase group/btn cursor-pointer">
                  <span>LEARN MORE</span>
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>

              {/* Hover glow */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
            </div>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div id="features-cta" className="mt-16 md:mt-24 p-10 md:p-14 bg-gradient-to-br from-violet-600/10 to-violet-600/5 border-2 border-violet-500/20 rounded-[2.5rem] text-center relative overflow-hidden group hover:border-violet-500/40 transition-all duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
              <span className="text-violet-400 font-semibold text-[10px] tracking-[0.3em] uppercase">READY TO DOMINATE?</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase">
              YOUR <span className="text-violet-400">LEGACY</span> STARTS NOW
            </h3>
            <p className="text-slate-400 font-medium text-base max-w-xl mx-auto">
              Join thousands of students already battling for campus supremacy.
            </p>
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button className="inline-flex items-center gap-3 bg-violet-600 text-white font-bold tracking-[0.1em] uppercase px-10 py-4 rounded-2xl hover:bg-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] text-base cursor-pointer">
                <Target className="w-4 h-4" />
                START YOUR SEASON
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    </section>
  )
}
