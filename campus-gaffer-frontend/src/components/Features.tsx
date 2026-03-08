import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const features = [
  {
    title: "BUILD YOUR DYNASTY",
    content: "$100M virtual budget. 15-player squads. Scout real talent from your campus leagues.",
    id: "01"
  },
  {
    title: "MASTER THE MARKET",
    content: "Weekly transfer deadlines. Play the fierce campus transfer market and optimize your lineup.",
    id: "02"
  },
  {
    title: "LIVE GLORY",
    content: "Scoring powered by real match data. Watch your mates' performance turn into fantasy points.",
    id: "03"
  }
]

export default function Features() {
  return (
    <section className="py-32 px-6 md:px-12 bg-background border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto relative z-10">
        <div className="flex items-center gap-6 mb-20">
          <div className="h-[2px] w-20 bg-primary shadow-[0_0_10px_rgba(255,22,68,0.8)]" />
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter text-foreground uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            THE INTRAMURAL REVOLUTION
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((feature) => (
            <Card key={feature.id} className="relative overflow-hidden group bg-zinc-900/20 border-white/5 hover:border-primary/50 hover:bg-zinc-900/40 transition-all duration-500">
               <div className="absolute top-0 right-0 p-6 font-mono text-xs text-zinc-600 tracking-[0.2em] group-hover:text-primary/50 transition-colors">
                  REF: {feature.id}
               </div>
               
               <CardHeader className="pt-10">
                  <div className="w-12 h-[2px] bg-primary mb-6 group-hover:w-full transition-all duration-500 shadow-[0_0_8px_rgba(255,22,68,0.5)]" />
                  <CardTitle className="text-3xl italic tracking-tighter text-foreground group-hover:translate-x-2 transition-transform duration-300">
                     {feature.title}
                  </CardTitle>
               </CardHeader>
               
               <CardContent className="pt-4 text-zinc-400 font-mono text-sm leading-relaxed">
                  {feature.content}
               </CardContent>
               
               {/* Cyber decorative element */}
               <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-1 bg-primary mb-1" />
                  <div className="w-1 h-1 bg-primary/50" />
               </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
