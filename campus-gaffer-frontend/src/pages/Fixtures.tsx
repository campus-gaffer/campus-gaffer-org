import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";

const FIXTURES = [
  { date: "MAR 15", time: "18:00", home: "Engineering", away: "Law", venue: "Pitch A", league: "Campus Premier" },
  { date: "MAR 15", time: "19:30", home: "Medicine", away: "Business", venue: "Pitch B", league: "Campus Premier" },
  { date: "MAR 16", time: "18:00", home: "Arts FC", away: "Science United", venue: "Pitch A", league: "Div 2" },
];

export default function Fixtures() {
  return (
    <div className="min-h-screen bg-black text-white font-heading">
      <DashboardNav />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Match Schedule</h1>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Upcoming Intramural Games</p>
        </div>

        <div className="space-y-8">
          {FIXTURES.map((match, idx) => (
            <Card key={idx} className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-32 bg-primary/10 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5">
                    <span className="text-2xl font-black italic text-primary leading-none">{match.date.split(' ')[1]}</span>
                    <span className="text-[10px] font-mono text-white/50 uppercase">{match.date.split(' ')[0]}</span>
                  </div>
                  
                  <div className="flex-grow p-6 grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                    <div className="text-center md:text-right">
                      <p className="text-xl font-black italic tracking-tight uppercase">{match.home}</p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Home Team</p>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="px-4 py-1 bg-white/5 border border-white/10 font-mono text-xs font-bold text-primary italic">
                        {match.time}
                      </div>
                      <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{match.league}</p>
                    </div>
                    
                    <div className="text-center md:text-left">
                      <p className="text-xl font-black italic tracking-tight uppercase">{match.away}</p>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">Away Team</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-48 p-6 bg-black/40 border-t md:border-t-0 md:border-l border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{match.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">KO {match.time}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
