import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import CampusLogo from "@/assets/campus-logo.png";
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
  minute: number;
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

function TeamBadge({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-12 h-12 text-sm";
  return (
    <div className={`${dim} rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-slate-400">{initials}</span>
    </div>
  );
}

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">Match not found</p>
        <button onClick={() => navigate("/scores")} className="text-xs font-bold text-primary">Go back</button>
      </div>
    );
  }

  const homeEvents = events.filter(e => e.team === "home");
  const awayEvents = events.filter(e => e.team === "away");
  const homeScorers = [...new Set(homeEvents.map(e => e.player_name))].length;
  const awayScorers = [...new Set(awayEvents.map(e => e.player_name))].length;

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-center px-4 py-2 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <img src={CampusLogo} alt="Campus Gaffer" className="h-16 w-auto" />
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back link desktop */}
          <button onClick={() => navigate("/scores")} className="hidden md:flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
            &larr; Back to matches
          </button>

          {/* Score Hero */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="flex flex-col items-center gap-3">
                <TeamBadge name={match.home_team} />
                <h2 className="text-sm font-bold text-white max-w-[100px] leading-tight">{match.home_team}</h2>
              </div>
              <div className="text-5xl font-bold text-white tabular-nums">
                {match.home_score} - {match.away_score}
              </div>
              <div className="flex flex-col items-center gap-3">
                <TeamBadge name={match.away_team} />
                <h2 className="text-sm font-bold text-white max-w-[100px] leading-tight">{match.away_team}</h2>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${match.is_live ? "bg-primary animate-pulse" : "bg-slate-500"}`}></div>
              <span className="text-xs font-bold text-slate-500 uppercase">
                {match.is_live ? `In Progress (${match.match_time})` : match.match_time === "FT" ? "Full Time" : "Upcoming"}
              </span>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{match.home_score}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Home Goals</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{match.away_score}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Away Goals</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{homeScorers}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Home Scorers</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{awayScorers}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Away Scorers</div>
              </div>
            </div>
          </div>

          {/* Match Events */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Match Events</h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No events recorded</p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      event.event_type === "goal" ? "bg-primary/15" : "bg-amber-500/15"
                    }`}>
                      <span className={`text-[8px] font-bold uppercase ${event.event_type === "goal" ? "text-primary" : "text-amber-400"}`}>
                        {event.event_type === "goal" ? "G" : event.event_type === "card" ? "C" : "S"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                          {event.event_type?.toUpperCase() || "GOAL"}
                        </span>
                        <span
                          onClick={() => navigate(`/player/${event.player_id}`)}
                          className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer"
                        >
                          {event.player_name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {event.team === "home" ? match.home_team : match.away_team}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
