import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Crown, Loader2 } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type LeaderEntry = {
  clerk_id: string;
  username: string;
  team_name: string;
  total_points: number;
  avatar?: string;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
      <Crown className="w-4 h-4 text-amber-400" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-slate-300/10 border border-slate-300/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-slate-300">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-amber-700/10 border border-amber-700/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-amber-600">3</span>
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-slate-500">{rank}</span>
    </div>
  );
}

function TeamInitials({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-slate-400">{initials}</span>
    </div>
  );
}

export default function Leagues() {
  const navigate = useNavigate();
  const [allEntries, setAllEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-lg font-bold tracking-tight text-white uppercase">Leaderboard</h1>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
              <p className="text-xs text-slate-500 mt-1">Global rankings</p>
            </div>
            <span className="text-xs text-slate-500">{allEntries.length} managers</span>
          </div>

          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">All managers</h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loading ? (
                <div className="text-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" /></div>
              ) : allEntries.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm font-bold text-slate-500">No managers yet</p>
                </div>
              ) : (
                allEntries.map((item, i) => {
                  const rank = i + 1;
                  return (
                    <div
                      key={item.clerk_id}
                      onClick={() => navigate(`/profile/${item.clerk_id}`)}
                      className="bg-card border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/20 transition-all"
                    >
                      <RankBadge rank={rank} />

                      <TeamInitials name={item.team_name} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.team_name}</p>
                        <p className="text-xs text-slate-500 truncate">Manager: {item.username}</p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="text-lg font-bold text-primary">{item.total_points}</div>
                          <div className="text-[9px] font-bold text-slate-600 uppercase">pts</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
