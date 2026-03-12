import DashboardNav from "@/components/dashboard/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRightLeft, DollarSign, Search, PlusCircle } from "lucide-react";

const PLAYERS_TO_BUY = [
  { id: 1, name: "Henderson", team: "Arts & Humanities", price: 8.5, role: "FWD" },
  { id: 2, name: "Davies", team: "Engineering", price: 6.2, role: "MID" },
  { id: 3, name: "Olatunji", team: "Medicine", price: 10.1, role: "MID" },
  { id: 4, name: "Morales", team: "Law", price: 5.4, role: "DEF" },
];

export default function Transfers() {
  return (
    <div className="min-h-screen bg-black text-white font-heading">
      <DashboardNav />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Transfer Market</h1>
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Optimize Your Season Squad</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-zinc-900 border border-white/5 p-4 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Available Budget</span>
              <span className="text-2xl font-black italic text-emerald-400 tracking-tighter">$14.5M</span>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-4 flex flex-col min-w-[150px]">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Transfers Left</span>
              <span className="text-2xl font-black italic text-primary tracking-tighter">02</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Market Side */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-zinc-900/40 border-white/5 rounded-none backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-zinc-500" />
                  <CardTitle className="text-sm italic tracking-widest">PLAYER SCOUTING</CardTitle>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-black text-[8px] font-mono border border-white/10 uppercase cursor-pointer hover:border-primary">ALL</span>
                  <span className="px-2 py-1 bg-black text-[8px] font-mono border border-white/10 uppercase cursor-pointer hover:border-primary">FWD</span>
                  <span className="px-2 py-1 bg-black text-[8px] font-mono border border-white/10 uppercase cursor-pointer hover:border-primary">MID</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {PLAYERS_TO_BUY.map((player) => (
                    <div key={player.id} className="group flex items-center justify-between p-4 bg-black/40 border-l-2 border-white/5 hover:border-primary transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center font-bold text-xs">
                          {player.role}
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-tight">{player.name}</p>
                          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{player.team}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-lg font-black italic text-white tracking-tighter">${player.price}M</p>
                        </div>
                        <Button size="sm" variant="crimsonOutline" className="h-8 w-8 p-0 rounded-none border border-primary/40">
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Selection Side */}
          <div className="lg:col-span-5">
            <Card className="bg-zinc-900 border-primary/30 rounded-none h-fit">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-2 text-primary">
                  <ArrowRightLeft className="w-4 h-4" />
                  <CardTitle className="text-sm italic tracking-widest">SQUAD REVISIONS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-8 text-center">
                <div className="border-2 border-dashed border-white/5 p-12 mb-8">
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Select players from market to begin trade</p>
                </div>
                <Button variant="crimson" className="w-full h-14 font-black italic tracking-tighter text-lg">
                  CONFIRM TRANSFERS
                </Button>
                <p className="mt-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest italic">Points will be deducted for exceeding limit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
