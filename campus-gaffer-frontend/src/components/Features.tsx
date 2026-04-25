import { Users, TrendingUp, Trophy, ArrowUpRight, Sparkles, Target, Zap } from "lucide-react"

const features = [
  {
    title: "BUILD YOUR DYNASTY",
    subtitle: "SCOUT & DRAFT",
    content: "$100M virtual budget. 15-player squads. Scout real talent from your campus leagues and build an unstoppable roster.",
    icon: Users,
    accent: "from-emerald-500/20 to-primary/5",
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
  return (
    <section className="py-32 px-6 md:px-12 bg-background border-t-2 border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="space-y-6">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border-2 border-primary/20 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary font-black text-xs tracking-[0.3em] uppercase">HOW IT WORKS</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-14 w-2 bg-primary rounded-full shadow-[0_0_20px_rgba(0,230,118,0.6)]" />
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">
                THE INTRAMURAL<br />
                <span className="text-primary">REVOLUTION</span>
              </h2>
            </div>
          </div>
          
          <p className="text-slate-400 font-bold text-lg max-w-sm uppercase tracking-widest leading-relaxed italic border-l-2 border-primary/30 pl-6">
            EXPERIENCE THE EXCITEMENT OF PRO FANTASY SPORTS, SCALED FOR YOUR UNIVERSITY CAMPUS.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="relative overflow-hidden group bg-card/50 backdrop-blur-sm border-2 border-white/5 hover:border-primary/40 rounded-[3rem] p-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_60px_rgba(0,230,118,0.15)]"
            >
              {/* Gradient accent at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} rounded-t-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="p-8 pt-10">
                {/* Big number background */}
                <div className="absolute top-6 right-8 text-6xl font-black text-white/[0.03] group-hover:text-primary/[0.08] transition-colors select-none italic">
                  {feature.id}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all duration-500 mb-8 shadow-[0_0_30px_rgba(0,230,118,0.15)]">
                  <feature.icon className="w-10 h-10 text-primary group-hover:text-background transition-colors" />
                </div>

                {/* Subtitle tag */}
                <span className="inline-block text-[10px] font-black text-primary tracking-[0.2em] uppercase mb-3 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                  {feature.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-3xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors mb-4 leading-tight">
                  {feature.title}
                </h3>

                {/* Content */}
                <p className="text-slate-400 font-medium text-base leading-relaxed mb-8">
                  {feature.content}
                </p>

                {/* CTA */}
                <button className="flex items-center gap-2 text-primary font-black text-sm tracking-[0.15em] uppercase group/btn">
                  <span>LEARN MORE</span>
                  <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>

              {/* Hover glow */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
            </div>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div className="mt-24 p-10 md:p-14 bg-card/50 backdrop-blur-sm border-2 border-primary/20 rounded-[3rem] text-center relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,230,118,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary font-black text-[10px] tracking-[0.3em] uppercase">READY TO DOMINATE?</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
              YOUR <span className="text-primary">LEGACY</span> STARTS NOW
            </h3>
            <p className="text-slate-400 font-bold text-lg max-w-xl mx-auto">
              Join thousands of students already battling for campus supremacy.
            </p>
            <button className="inline-flex items-center gap-3 bg-primary text-background font-black italic tracking-[0.15em] uppercase px-10 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,230,118,0.4)] text-lg">
              <Target className="w-5 h-5" />
              START YOUR SEASON
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
