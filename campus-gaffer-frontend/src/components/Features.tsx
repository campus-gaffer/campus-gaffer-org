import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, TrendingUp, Trophy, ArrowUpRight } from "lucide-react"

const features = [
  {
    title: "BUILD YOUR DYNASTY",
    content: "$100M virtual budget. 15-player squads. Scout real talent from your campus leagues.",
    icon: Users,
    id: "01"
  },
  {
    title: "MASTER THE MARKET",
    content: "Weekly transfer deadlines. Play the fierce campus transfer market and optimize your lineup.",
    icon: TrendingUp,
    id: "02"
  },
  {
    title: "LIVE GLORY",
    content: "Scoring powered by real match data. Watch your mates' performance turn into fantasy points.",
    icon: Trophy,
    id: "03"
  }
]

export default function Features() {
  return (
    <section className="py-32 px-6 md:px-12 bg-background border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
          <div className="space-y-4">
            <div className="h-1.5 w-24 bg-primary rounded-full shadow-[0_0_20px_rgba(0,230,118,0.6)]" />
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-foreground uppercase leading-tight">
              THE INTRAMURAL<br />
              <span className="text-primary">REVOLUTION</span>
            </h2>
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-sm uppercase tracking-widest leading-relaxed">
            Experience the excitement of professional fantasy sports, scaled for your university campus.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.id} className="relative overflow-hidden group bg-secondary/30 border-white/5 hover:border-primary/50 hover:bg-secondary/50 transition-all duration-500 rounded-[2.5rem] p-4">
              <div className="absolute top-8 right-8 text-4xl font-black text-white/5 group-hover:text-primary/10 transition-colors">
                {feature.id}
              </div>

              <CardHeader className="pt-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                  <feature.icon className="w-8 h-8 text-primary group-hover:text-background transition-colors" />
                </div>
                <CardTitle className="text-3xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-2 pb-8 text-slate-400 font-medium text-lg leading-relaxed">
                {feature.content}
              </CardContent>

              <div className="px-6 pb-6">
                <button className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase group/btn">
                  Learn More
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>

              {/* Cyber decorative element */}
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
