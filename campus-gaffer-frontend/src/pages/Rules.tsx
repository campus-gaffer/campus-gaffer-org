import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Shield, Zap, Target } from "lucide-react";

const SCORING_RULES = [
  { action: "Goal Scored (FWD)", points: 4 },
  { action: "Goal Scored (MID)", points: 5 },
  { action: "Goal Scored (DEF/GK)", points: 6 },
  { action: "Assist", points: 3 },
  { action: "Clean Sheet (DEF/GK)", points: 4 },
  { action: "Clean Sheet (MID)", points: 1 },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-black text-white font-heading">
      <DashboardNav />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Gameplay Rules</h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Everything you need to master the game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Point System */}
          <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl lg:col-span-1">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3 text-primary">
                <Target className="w-6 h-6" />
                <CardTitle className="italic tracking-widest">POINT SCORING</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {SCORING_RULES.map((rule, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-black/40 border-l-2 border-primary/20">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300">{rule.action}</span>
                    <span className="text-xl font-black italic text-primary">{rule.points} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Squad Management */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Shield className="w-6 h-6" />
                  <CardTitle className="italic tracking-widest text-white">SQUAD & BUDGET</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 font-mono text-xs text-zinc-400 leading-relaxed space-y-4 uppercase tracking-widest">
                <p><span className="text-white font-bold italic">TEAM SIZE:</span> 6 players (1 GK, 2 DEF, 2 MID, 1 FWD)</p>
                <p><span className="text-white font-bold italic">BUDGET:</span> $100M total squad value allowed.</p>
                <p><span className="text-white font-bold italic">TRANSFERS:</span> 1 free transfer per gameweek. Additional transfers incur a -4 point penalty.</p>
                <p><span className="text-white font-bold italic">CAPTAINCY:</span> Double points for your captain. If they miss out, your vice-captain takes over.</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3 text-yellow-400">
                  <Zap className="w-6 h-6" />
                  <CardTitle className="italic tracking-widest text-white">ACTION CHIPS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 font-mono text-xs text-zinc-400 leading-relaxed space-y-4 uppercase tracking-widest">
                <p><span className="text-white font-bold italic">TRIPLE CAPTAIN:</span> Your captain's points are tripled for the gameweek.</p>
                <p><span className="text-white font-bold italic">FREE HIT:</span> Make unlimited transfers for a single gameweek before your squad resets.</p>
                <p><span className="text-white font-bold italic">WILDCARD:</span> Unlimited permanent transfers for a single gameweek.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
