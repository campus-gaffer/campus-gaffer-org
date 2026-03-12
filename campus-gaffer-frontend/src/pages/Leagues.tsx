import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy, Users, Star, Medal } from "lucide-react";

const GLOBAL_LEAGUE = [
  { rank: 1, team: "Oxford United", manager: "Alex J.", points: 482 },
  { rank: 2, team: "LSE Lions", manager: "Sarah K.", points: 475 },
  { rank: 3, team: "Imperial Kings", manager: "David L.", points: 471 },
];

const CAMPUS_LEAGUE = [
  { rank: 12, team: "Law Legends", manager: "Mike R.", points: 310 },
  { rank: 13, team: "Medics FC", manager: "You", points: 305, isUser: true },
  { rank: 14, team: "Eng Tech", manager: "Chris B.", points: 298 },
];

export default function Leagues() {
  return (
    <div className="min-h-screen bg-black text-white font-heading">
      <DashboardNav />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Leagues & Ranks</h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Global and Campus Competition</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Global League */}
          <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3 text-primary">
                <Trophy className="w-6 h-6" />
                <CardTitle className="italic tracking-widest">GLOBAL LEADERBOARD</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {GLOBAL_LEAGUE.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between p-4 bg-black/40 border-l-2 border-primary/30">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-black italic text-zinc-700 w-8">0{item.rank}</span>
                      <div>
                        <p className="font-bold uppercase tracking-tight">{item.team}</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">{item.manager}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic text-primary">{item.points}</p>
                      <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">PTS</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campus League */}
          <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3 text-emerald-400">
                <Users className="w-6 h-6" />
                <CardTitle className="italic tracking-widest text-white">CAMPUS LEAGUE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {CAMPUS_LEAGUE.map((item) => (
                  <div key={item.rank} className={`flex items-center justify-between p-4 bg-black/40 border-l-2 ${item.isUser ? 'border-primary bg-primary/5' : 'border-emerald-500/30'}`}>
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-black italic text-zinc-700 w-8">{item.rank}</span>
                      <div>
                        <p className="font-bold uppercase tracking-tight">{item.team} {item.isUser && " (YOU)"}</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">{item.manager}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic text-white">{item.points}</p>
                      <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">PTS</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
