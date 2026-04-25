import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Video, Zap, Shield, LayoutGrid } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

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

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  is_live: boolean;
  match_time: string;
  venue: string;
  possession_h: number;
  possession_a: number;
  shots_h: number;
  shots_a: number;
};

const MOCK_EVENTS: MatchEvent[] = [
  { id: 1, match_id: 1, event_type: "goal", team: "home", player_name: "J. Doe", player_id: "1", assist_player: "S. Smith", minute: 23, event_time: "23'" },
  { id: 2, match_id: 1, event_type: "goal", team: "away", player_name: "L. Vance", player_id: "4", assist_player: "", minute: 45, event_time: "45'" },
  { id: 3, match_id: 1, event_type: "card", team: "home", player_name: "M. Ross", player_id: "3", assist_player: "", minute: 67, event_time: "67'" },
  { id: 4, match_id: 1, event_type: "goal", team: "home", player_name: "J. Doe", player_id: "1", assist_player: "S. Smith", minute: 78, event_time: "78'" },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Scores() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"live" | "upcoming">("live");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/matches")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const live = data.filter((m: Match) => m.is_live);
          const upcoming = data.filter((m: Match) => !m.is_live);
          setLiveMatches(live);
          setUpcomingMatches(upcoming);
          if (live.length > 0) setSelectedMatch(live[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetch(`${API_URL}/matches/${selectedMatch.id}/events`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setEvents(data);
          } else {
            setEvents(MOCK_EVENTS.filter(e => e.match_id === selectedMatch.id));
          }
        })
        .catch(() => {
          setEvents(MOCK_EVENTS.filter(e => e.match_id === selectedMatch.id));
        });
    }
  }, [selectedMatch]);

  const displayedMatches = activeTab === "live" ? liveMatches : upcomingMatches;
  const currentEvents = events.filter(e => selectedMatch && e.match_id === selectedMatch.id);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden uppercase">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-lg italic font-black tracking-wider text-primary uppercase">Match Center</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="w-6 h-6 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background shadow-lg"></span>
        </button>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10 animate-in fade-in duration-500">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">

          {/* Left: Match List */}
          <div className="lg:col-span-4 space-y-6">
            {/* Tab Switcher */}
            <div className="flex bg-secondary/40 rounded-2xl p-1.5 border border-white/5">
              <button
                onClick={() => setActiveTab("live")}
                className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${activeTab === "live" ? "bg-primary text-background shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                Live
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${activeTab === "upcoming" ? "bg-primary text-background shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                Upcoming
              </button>
            </div>

            {/* Match List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">Loading...</div>
              ) : displayedMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">
                  No {activeTab} matches
                </div>
              ) : (
                displayedMatches.map(match => (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`bg-card/40 border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedMatch?.id === match.id
                        ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-slate-500 tracking-widest">{match.venue || "CAMPUS PITCH"}</span>
                      {match.is_live ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,230,118,0.8)]"></div>
                          <span className="text-[9px] font-black text-primary tracking-widest">{match.match_time || "LIVE"}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-slate-500 tracking-widest">UPCOMING</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-white/5">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-white text-center leading-tight uppercase">{match.home_team}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-4">
                        <span className="text-xl font-black italic tracking-tighter">{match.home_score} - {match.away_score}</span>
                        {match.is_live && <span className="text-[9px] font-black text-slate-500 tracking-widest">{match.match_time || ""}</span>}
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-white/5">
                          <LayoutGrid className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-white text-center leading-tight uppercase">{match.away_team}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Match Detail */}
          <div className="lg:col-span-8 space-y-6">
            {selectedMatch ? (
              <>
                {/* Main Score Card */}
                <section className="bg-card/40 border border-white/5 rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <div className="w-20 h-20 md:w-28 md:h-28 bg-secondary rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                        <Shield className="w-10 h-10 md:w-14 md:h-14 text-primary fill-primary/10" />
                      </div>
                      <h3 className="text-xs md:text-sm font-black text-white text-center tracking-tighter max-w-[100px] leading-tight uppercase">{selectedMatch.home_team}</h3>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4 text-6xl md:text-8xl font-black italic tracking-tighter">
                        <span className="text-primary">{selectedMatch.home_score}</span>
                        <span className="text-slate-700 opacity-50">-</span>
                        <span className="text-primary">{selectedMatch.away_score}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 flex-1 text-center">
                      <div className="w-20 h-20 md:w-28 md:h-28 bg-secondary rounded-full flex items-center justify-center border border-white/10 shadow-xl">
                        <LayoutGrid className="w-10 h-10 md:w-14 md:h-14 text-slate-500" />
                      </div>
                      <h3 className="text-xs md:text-sm font-black text-white tracking-widest leading-tight uppercase">{selectedMatch.away_team}</h3>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-center">
                    <div className="bg-primary/20 border border-primary/30 px-6 py-2.5 rounded-full flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedMatch.is_live ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(0,230,118,0.8)]" : "bg-slate-500"}`}></div>
                      <span className="text-[10px] md:text-xs font-black text-primary tracking-widest uppercase italic">
                        {selectedMatch.is_live ? `In Progress (${selectedMatch.match_time || "0'"})` : "Upcoming"}
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

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest">PossESSION</span>
                        <div className="flex gap-4">
                          <span className="text-xs font-black text-primary">{selectedMatch.possession_h || 50}%</span>
                          <span className="text-xs font-black text-slate-500">{selectedMatch.possession_a || 50}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden flex">
                        <div className="h-full bg-primary shadow-[0_0_10px_rgba(0,230,118,0.4)]" style={{ width: `${selectedMatch.possession_h || 50}%` }}></div>
                        <div className="h-full bg-slate-800" style={{ width: `${selectedMatch.possession_a || 50}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "SHOTS", v1: selectedMatch.shots_h || 0, v2: selectedMatch.shots_a || 0 },
                        { label: "FOULS", v1: 3, v2: 5 },
                        { label: "CORNERS", v1: 4, v2: 2 },
                      ].map(stat => (
                        <div key={stat.label} className="bg-secondary/40 border border-white/5 rounded-2xl p-4 text-center group hover:border-primary/30 transition-colors">
                          <div className="text-lg md:text-xl font-black text-white mb-0.5 tracking-tighter">{stat.v1} / {stat.v2}</div>
                          <div className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Match Events Timeline */}
                <section className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 shadow-xl text-left">
                  <div className="flex items-center justify-between px-1 mb-6">
                    <h2 className="text-xs md:text-sm font-black text-slate-500 tracking-[0.3em] uppercase">Match Events</h2>
                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  </div>

                  <div className="space-y-0">
                    {currentEvents.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs font-black italic uppercase tracking-widest">No events yet</div>
                    ) : (
                      currentEvents.map((event) => (
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
                            <div className="text-sm font-black text-white uppercase italic">
                              {event.player_name}
                              {event.assist_player && (
                                <span className="text-slate-500 font-normal text-xs"> (assist: {event.assist_player})</span>
                              )}
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${
                              event.team === "home" ? "text-primary" : "text-slate-400"
                            }`}>{selectedMatch.home_team}</div>
                          </div>
                          <div className="text-lg font-black italic text-primary">{event.event_time || `${event.minute}'`}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/40 flex items-center justify-center border border-white/5 mb-6">
                  <Video className="w-10 h-10 text-slate-600" />
                </div>
                <h2 className="text-xl font-black italic text-slate-500 uppercase tracking-widest mb-2">No Match Selected</h2>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Select a match from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
