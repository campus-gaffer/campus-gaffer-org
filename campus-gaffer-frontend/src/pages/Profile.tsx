import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, ArrowLeft, Shield, TrendingUp, Users, DollarSign, RefreshCw, BarChart3, Trophy } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Profile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`${API_URL}/users/${user.id}`).then(r => r.json()),
      fetch(`${API_URL}/leaderboard`).then(r => r.json()),
      fetch(`${API_URL}/squad/${user.id}`).then(r => r.json()),
    ])
      .then(([prof, lb, sq]) => {
        setProfile(prof);
        setLeaderboard(Array.isArray(lb) ? lb : []);
        setSquad(sq?.players || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const rank = leaderboard.findIndex(u => u.clerk_id === user?.id) + 1;
  const totalRank = leaderboard.length;
  const squadValue = squad.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
  const unusedBudget = (profile?.budget || 100) - squadValue;
  const joinedDate = profile?.CreatedAt
    ? new Date(profile.CreatedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg italic font-black tracking-wider text-primary uppercase">MY PROFILE</h1>
        </div>
        <Bell className="w-6 h-6 text-slate-300" />
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Manager Card */}
          <section className="bg-card border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/[0.03] rounded-tr-full" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="w-28 h-28 rounded-[2rem] bg-secondary border-2 border-primary/30 flex items-center justify-center shadow-xl shrink-0">
                <span className="text-5xl font-black text-primary/40">
                  {(profile?.username || user?.username || "?")[0].toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase">
                    {profile?.username || user?.username || "Manager"}
                  </h2>
                  {rank > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 self-center md:self-auto">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-primary tracking-widest">#{rank} OF {totalRank}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-left">
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    {profile?.university || "University of Manitoba"}
                  </span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                    Joined {joinedDate}
                  </span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                    Team: {profile?.team_name || "UNNAMED"}
                  </span>
                  {profile?.age && (
                    <>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{profile.age} YRS</span>
                    </>
                  )}
                  {profile?.gender && (
                    <>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{profile.gender.toUpperCase()}</span>
                    </>
                  )}
                </div>

                {/* Team Value Bar */}
                <div className="mt-6 bg-background/50 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Squad Value</span>
                    <span className="text-sm font-black text-primary">£{squadValue.toFixed(1)}M</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(squadValue / 100) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] font-bold text-slate-600 tracking-widest">£{squadValue.toFixed(1)}M spent</span>
                    <span className="text-[9px] font-bold text-slate-600 tracking-widest">£{unusedBudget.toFixed(1)}M ITB</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BarChart3 className="w-6 h-6" />, label: "TOTAL POINTS", value: profile?.total_points || 0, suffix: "" },
              { icon: <TrendingUp className="w-6 h-6" />, label: "OVERALL RANK", value: rank > 0 ? `#${rank}` : "—", suffix: "" },
              { icon: <DollarSign className="w-6 h-6" />, label: "BUDGET LEFT", value: `£${unusedBudget.toFixed(1)}M`, suffix: "" },
              { icon: <RefreshCw className="w-6 h-6" />, label: "FREE TRANSFERS", value: profile?.free_transfers || 0, suffix: "" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-white/5 rounded-[2rem] p-6 text-center group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-black italic text-white leading-none mb-1">{stat.value}{stat.suffix}</div>
                <div className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">{stat.label}</div>
              </div>
            ))}
          </section>

          {/* Gameweek History */}
          <section className="bg-card border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-xl italic font-black text-white tracking-widest uppercase">Gameweek History</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{profile?.last_gameweek ? `GW ${profile.last_gameweek}` : "Pre-season"}</span>
              </div>

              <div className="text-center py-16">
                <BarChart3 className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <p className="text-slate-500 font-black italic text-lg mb-2">Season data incoming</p>
                <p className="text-[10px] font-bold text-slate-600 tracking-widest max-w-xs mx-auto leading-relaxed">
                  Gameweek-by-gameweek points will appear here once the first competitive season kicks off. Run compute-points after match day to see your weekly scores.
                </p>
              </div>
            </div>
          </section>

          {/* Squad Summary */}
          <section className="bg-card border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8 px-1">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-xl italic font-black text-white tracking-widest uppercase">My Squad</h3>
              <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">({squad.length}/6)</span>
            </div>

            {squad.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-black italic uppercase tracking-widest text-sm">No squad selected yet</p>
                <Link to="/dashboard" className="inline-block mt-4 text-[10px] font-black text-primary tracking-widest uppercase hover:underline">
                  Build your squad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squad.map((p: any) => (
                  <Link key={p.id} to={`/player/${p.id}`}
                    className="bg-secondary/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${
                        p.position === "GK" ? "bg-orange-500/20 text-orange-400" :
                        p.position === "DEF" ? "bg-amber-500/20 text-amber-400" :
                        p.position === "MID" ? "bg-blue-500/20 text-blue-400" :
                        "bg-primary/20 text-primary"
                      }`}>
                        {p.position}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white uppercase tracking-tighter">{p.name}</div>
                        <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">
                          {p.is_captain ? "★ CAPTAIN" : `£${(p.price || 0).toFixed(1)}M`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black italic text-primary">{p.total_points || 0}</div>
                      <div className="text-[8px] font-bold text-slate-600 tracking-widest uppercase">PTS</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
