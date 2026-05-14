import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Loader2, Shield, Target, Zap } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type MatchEvent = {
  id: number;
  match_id: number;
  event_type: "goal" | "card" | "substitution";
  team: string;
  player_name: string;
  player_id: string;
  assist_player: string;
  minute: number;
  event_time: string;
};

type PlayerDetail = {
  id: string;
  name: string;
  university: string;
  sport: string;
  position: string;
  price: number;
  total_points: number;
  weekly_points: number;
  img_url: string;
  goals: number;
  assists: number;
  games_played: number;
  events: MatchEvent[];
};

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/players/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setPlayer(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getSkillValue = (skillName: string) => {
    if (!player) return 0;
    switch (skillName) {
      case "PACE": return Math.min(99, 65 + player.weekly_points * 3);
      case "FINISHING": return Math.min(99, 60 + (player.goals * 5) + (player.position === "FWD" ? 15 : 0));
      case "STRENGTH": return Math.min(99, 55 + (player.position === "DEF" || player.position === "GK" ? 20 : 5));
      case "PASSING": return Math.min(99, 60 + (player.assists * 8) + (player.position === "MID" ? 10 : 0));
      default: return 70;
    }
  };

  const SKILL_NAMES = ["PACE", "FINISHING", "STRENGTH", "PASSING"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-6">
        <Shield className="w-20 h-20 text-slate-700" />
        <p className="text-xl font-black italic uppercase text-slate-500 tracking-widest">Player not found</p>
        <button onClick={() => navigate(-1)} className="text-xs font-black text-primary tracking-widest uppercase hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg italic font-extrabold tracking-wider text-primary uppercase">Player Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-slate-300" />
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt="Profile" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 md:py-12 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Info Column */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-card border border-white/5 rounded-[3rem] p-10 card-gradient text-center shadow-2xl relative overflow-hidden">
              <div className="relative inline-block mb-8">
                <div className="w-40 h-40 rounded-full border-4 border-primary p-1.5 shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-transform hover:scale-105 duration-500">
                  <div className="w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center">
                    <span className="text-6xl font-black text-primary/30">{player.name[0]}</span>
                  </div>
                </div>
                <div className={`absolute bottom-2 right-2 px-3 py-1 rounded-full border-2 border-background shadow-lg font-black text-[10px] ${
                  player.position === "GK" ? "bg-orange-500 text-background" :
                  player.position === "DEF" ? "bg-amber-500 text-background" :
                  player.position === "MID" ? "bg-blue-500 text-background" :
                  "bg-primary text-background"
                }`}>
                  {player.position}
                </div>
              </div>

              <h2 className="text-5xl font-black mb-2 tracking-tighter italic uppercase text-white">{player.name}</h2>
              <div className="flex items-center justify-center gap-3 mb-8">
                <span className="text-primary font-black uppercase text-sm tracking-[0.2em]">{player.position === "GK" ? "Goalkeeper" : player.position === "DEF" ? "Defender" : player.position === "MID" ? "Midfielder" : "Forward"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span className="text-slate-400 font-bold uppercase text-sm tracking-[0.2em]">{player.university}</span>
              </div>

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary/50 rounded-2xl border border-white/5 mx-auto hover:border-primary/30 transition-colors cursor-default">
                <Shield className="w-5 h-5 text-primary fill-primary/20" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-200 leading-none">£{player.price}M</span>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-12">
                {[
                  { label: "GAMES", value: player.games_played.toString() },
                  { label: "GOALS", value: player.goals.toString().padStart(2, '0') },
                  { label: "ASSISTS", value: player.assists.toString().padStart(2, '0') }
                ].map(stat => (
                  <div key={stat.label} className="bg-background/40 border border-white/5 rounded-2xl py-4 text-center">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-2xl font-black text-white leading-none">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-primary/10 p-4 rounded-2xl border border-primary/20">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL POINTS</div>
                <div className="text-4xl font-black text-primary italic">{player.total_points}</div>
              </div>
            </section>

            {/* Skill Breakdown */}
            <section className="bg-card border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
              <h2 className="text-xl italic font-black text-white tracking-widest uppercase mb-10 text-left">Skill Breakdown</h2>

              <div className="space-y-8">
                {SKILL_NAMES.map(skill => {
                  const val = getSkillValue(skill);
                  return (
                    <div key={skill} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{skill}</span>
                        <span className="text-xs font-black text-primary tracking-widest">{val}%</span>
                      </div>
                      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all duration-1000"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* History Column */}
          <div className="lg:col-span-8">
            <section>
              <div className="flex items-center justify-between mb-8 px-1">
                <h2 className="text-3xl italic font-black text-white tracking-widest uppercase">Match Activity</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  <span className="text-[10px] font-black text-primary tracking-widest uppercase">{player.events.length} EVENTS</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {player.events.length === 0 ? (
                  <div className="bg-card border border-white/5 rounded-[2rem] p-16 text-center">
                    <Target className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-black italic uppercase tracking-widest text-sm">No recorded events yet</p>
                    <p className="text-slate-700 font-bold text-[10px] uppercase tracking-widest mt-2">Stats update after match day</p>
                  </div>
                ) : (
                  player.events.map((event) => (
                    <div key={event.id} className="bg-card border border-white/5 rounded-[2rem] p-8 flex items-center justify-between group hover:border-primary/40 hover:bg-card/80 transition-all cursor-default shadow-lg relative overflow-hidden text-left">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border text-lg font-black transition-all group-hover:scale-110 ${
                          event.event_type === "goal" ? "bg-primary/20 border-primary/30 text-primary" :
                          event.event_type === "card" ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                          "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        }`}>
                          {event.event_type === "goal" ? <Target className="w-8 h-8" /> :
                           event.event_type === "card" ? <span className="text-lg">C</span> :
                           <Zap className="w-8 h-8" />}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-none">
                              {event.event_type.toUpperCase()}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border ${
                              event.team === "home" ? "bg-primary/10 border-primary/30 text-primary" : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                            }`}>
                              {event.team === "home" ? "HOME" : "AWAY"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{event.player_name}</span>
                            {event.assist_player && (
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                (assist: {event.assist_player})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl md:text-5xl font-black italic text-primary">{event.event_time || `${event.minute}'`}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">MINUTE</div>
                      </div>

                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <MobileNav />

      <style>{`
        .card-gradient {
          background: linear-gradient(135deg, #181D29 0%, #0F1219 100%);
        }
      `}</style>
    </div>
  );
}
