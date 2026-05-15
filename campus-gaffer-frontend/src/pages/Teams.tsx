import { useState, useEffect } from "react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import { Shield, Loader2, Users, Target } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type Team = {
  id: string;
  name: string;
  external_team_id: string;
  external_source: string;
  player_count: number;
  total_goals: number;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/teams")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTeams(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-white font-sans pb-24">
      <div className="hidden md:block"><Navbar /></div>
      <main className="container mx-auto px-6 py-10 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-10">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">Teams</h1>
          <span className="text-xs font-black text-slate-500 tracking-widest">({teams.length})</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-card/40 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-tight text-sm">{team.name}</h3>
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">{team.external_source}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span className="text-lg font-bold text-white">{team.player_count}</span>
                    </div>
                    <div className="text-[8px] font-bold text-slate-500 tracking-widest uppercase mt-1">Players</div>
                  </div>
                  <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-lg font-bold text-white">{team.total_goals}</span>
                    </div>
                    <div className="text-[8px] font-bold text-slate-500 tracking-widest uppercase mt-1">Goals</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
