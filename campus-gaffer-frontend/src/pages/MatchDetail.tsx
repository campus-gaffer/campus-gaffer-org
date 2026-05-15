import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, LayoutGrid, Video, Zap, Loader2 } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type MatchEvent = {
  id: number;
  match_id: number;
  event_type: string;
  team: string;
  player_name: string;
  player_id: string;
  assist_player: string;
  minute: number;
  event_time: string;
};

type Match = {
  ID: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  is_live: boolean;
  match_time: string;
  venue: string;
  kickoff_time?: string;
};

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [teamFilter, setTeamFilter] = useState<"all" | "home" | "away">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/matches`).then(r => r.json()),
      fetch(`${API_URL}/matches/${id}/events`).then(r => r.json()),
    ]).then(([matchesData, eventsData]) => {
      if (Array.isArray(matchesData)) {
        const found = matchesData.find((m: Match) => m.ID === parseInt(id));
        setMatch(found || null);
      }
      if (Array.isArray(eventsData)) setEvents(eventsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const currentEvents = events.filter(e => match && e.match_id === match.ID);
  const filteredEvents = teamFilter === "all" ? currentEvents : currentEvents.filter(e => e.team === teamFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-6">
        <Video className="w-20 h-20 text-slate-700" />
        <p className="text-xl font-black italic uppercase text-slate-500 tracking-widest">Match not found</p>
        <button onClick={() => navigate("/scores")} className="text-xs font-black text-primary tracking-widest uppercase hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/scores")} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg italic font-extrabold tracking-wider text-primary uppercase">Match Detail</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Back button desktop */}
          <button onClick={() => navigate("/scores")} className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">Back to Matches</span>
          </button>

          {/* Main Score Card */}
          <section className="bg-card/40 border border-white/5 rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center gap-4 flex-1">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-secondary rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                  <Shield className="w-10 h-10 md:w-14 md:h-14 text-primary fill-primary/10" />
                </div>
                <h3 className="text-xs md:text-sm font-black text-white text-center tracking-tighter max-w-[100px] leading-tight uppercase">{match.home_team}</h3>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 text-6xl md:text-8xl font-black italic tracking-tighter">
                  <span className="text-primary">{match.home_score}</span>
                  <span className="text-slate-700 opacity-50">-</span>
                  <span className="text-primary">{match.away_score}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 flex-1 text-center">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-secondary rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                  <LayoutGrid className="w-10 h-10 md:w-14 md:h-14 text-slate-500" />
                </div>
                <h3 className="text-xs md:text-sm font-black text-white tracking-widest leading-tight uppercase">{match.away_team}</h3>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="bg-primary/20 border border-primary/30 px-6 py-2.5 rounded-full flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${match.is_live ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-slate-500"}`}></div>
                <span className="text-[10px] md:text-xs font-black text-primary tracking-widest uppercase italic">
                  {match.is_live ? `In Progress (${match.match_time || "0'"})` : match.match_time === "FT" ? "Full Time" : "Upcoming"}
                </span>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-tr-full" />
          </section>

          {/* Statistics */}
          <section className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-xl text-left">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-black text-slate-500 tracking-[0.3em] uppercase">Match Statistics</h2>
              <Zap className="w-4 h-4 text-primary opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "GOAL SCORERS", v1: currentEvents.filter(e => e.team === "home").length, v2: currentEvents.filter(e => e.team === "away").length },
                { label: "GOALS", v1: match.home_score, v2: match.away_score },
              ].map(stat => (
                <div key={stat.label} className="bg-secondary/40 border border-white/5 rounded-2xl p-4 text-center group hover:border-primary/30 transition-colors">
                  <div className="text-lg md:text-xl font-black text-white mb-0.5 tracking-tighter">{stat.v1} / {stat.v2}</div>
                  <div className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Match Events Timeline */}
          <section className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 shadow-xl text-left">
            <div className="flex items-center justify-between px-1 mb-6">
              <h2 className="text-xs md:text-sm font-black text-slate-500 tracking-[0.3em] uppercase">Match Events</h2>
              <div className="flex items-center gap-2">
                {["all", "home", "away"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(t as "all" | "home" | "away")}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                      teamFilter === t
                        ? "bg-primary text-background shadow-md"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t === "all" ? "ALL" : t === "home" ? match.home_team.split(" ").slice(0, 2).join(" ").toUpperCase() : match.away_team.split(" ").slice(0, 2).join(" ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-black italic uppercase tracking-widest">No events yet</div>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                      event.event_type === "goal" ? "bg-primary/20 border border-primary/30" :
                      event.event_type === "card" ? "bg-amber-500/20 border border-amber-500/30" :
                      "bg-blue-500/20 border border-blue-500/30"
                    }`}>
                      {event.event_type === "goal" && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                      {event.event_type === "card" && <span className="text-amber-400 text-[10px]">C</span>}
                      {event.event_type === "substitution" && <span className="text-blue-400 text-[10px]">S</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          event.event_type === "goal" ? "bg-primary/20 text-primary" :
                          event.event_type === "card" ? "bg-amber-500/20 text-amber-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>{event.event_type}</span>
                        <span
                          onClick={() => navigate(`/player/${event.player_id}`)}
                          className="text-sm font-black text-white uppercase italic cursor-pointer hover:text-primary transition-colors"
                        >
                          {event.player_name}
                          {event.assist_player && (
                            <span className="text-slate-500 font-normal text-xs"> (assist: {event.assist_player})</span>
                          )}
                        </span>
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${
                        event.team === "home" ? "text-primary" : "text-slate-400"
                      }`}>{match.home_team}</div>
                    </div>
                    <div className="text-lg font-black italic text-primary">{event.event_time && event.event_time !== "FT" ? event.event_time : ""}</div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
