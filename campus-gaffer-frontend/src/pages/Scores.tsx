import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Zap, Shield, LayoutGrid } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Scores() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"live" | "results" | "upcoming">("results");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<"all" | "home" | "away">("all");

  useEffect(() => {
    fetch(API_URL + "/matches")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMatches(data);
          const results = data.filter((m: Match) => m.match_time === "FT");
          if (results.length > 0) setSelectedMatch(results[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetch(`${API_URL}/matches/${selectedMatch.ID}/events`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setEvents(data); })
        .catch(() => {});
    }
  }, [selectedMatch]);

  const resultsMatches = matches.filter(m => m.match_time === "FT");
  const liveMatches = matches.filter(m => m.is_live);
  const upcomingMatches = matches.filter(m => !m.is_live && m.match_time !== "FT");
  const displayedMatches = activeTab === "live" ? liveMatches : activeTab === "results" ? resultsMatches : upcomingMatches;
  const currentEvents = events.filter(e => selectedMatch && e.match_id === selectedMatch.ID);
  const filteredEvents = teamFilter === "all" ? currentEvents : currentEvents.filter(e => e.team === teamFilter);

  const renderMatchCard = (match: Match) => (
    <div
      key={match.ID}
      onClick={() => {
        // Mobile: navigate to match detail page. Desktop: show in split panel.
        if (window.innerWidth < 1024) {
          navigate(`/matches/${match.ID}`);
        } else {
          setSelectedMatch(match);
        }
      }}
      className={`bg-card/40 border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
        selectedMatch?.ID === match.ID ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" : "border-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-black text-slate-500 tracking-widest">{match.venue || "CAMPUS PITCH"}</span>
        <div className="flex items-center gap-2">
          {match.kickoff_time && (
            <span className="text-[8px] font-black text-slate-600 tracking-widest">{new Date(match.kickoff_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase()}</span>
          )}
          {match.is_live ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
              <span className="text-[9px] font-black text-primary tracking-widest">{match.match_time || "LIVE"}</span>
            </div>
          ) : (
            <span className="text-[9px] font-black text-green-400 tracking-widest">FT</span>
          )}
        </div>
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
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-white/5">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[10px] font-black text-white text-center leading-tight uppercase">{match.away_team}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Match List */}
          <div className="lg:col-span-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2 mb-6">
              <div>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Matches</h2>
                <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">
                  {resultsMatches.length} played / {liveMatches.length} live / {upcomingMatches.length} upcoming
                </p>
              </div>
            </div>

            <div className="flex bg-secondary/40 rounded-2xl p-1.5 border border-white/5 mb-6">
              {(["results", "live", "upcoming"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                    activeTab === tab ? "bg-primary text-background shadow-lg" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "results" ? `Results (${resultsMatches.length})` : tab === "live" ? `Live (${liveMatches.length})` : `Upcoming (${upcomingMatches.length})`}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent lg:max-h-[600px]">
              {loading ? (
                <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">Loading...</div>
              ) : displayedMatches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">No {activeTab} matches</div>
              ) : (
                displayedMatches.map(renderMatchCard)
              )}
            </div>
          </div>

          {/* Right: Match Detail (desktop only) */}
          <div className="hidden lg:block lg:col-span-8 space-y-6">
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
                      <div className={`w-2 h-2 rounded-full ${selectedMatch.is_live ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-slate-500"}`}></div>
                      <span className="text-[10px] md:text-xs font-black text-primary tracking-widest uppercase italic">
                        {selectedMatch.is_live ? `In Progress (${selectedMatch.match_time || "0'"})` : selectedMatch.match_time === "FT" ? "Full Time" : "Upcoming"}
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
                      { label: "GOALS", v1: selectedMatch.home_score, v2: selectedMatch.away_score },
                    ].map(stat => (
                      <div key={stat.label} className="bg-secondary/40 border border-white/5 rounded-2xl p-4 text-center group hover:border-primary/30 transition-colors">
                        <div className="text-lg md:text-xl font-black text-white mb-0.5 tracking-tighter">{stat.v1} / {stat.v2}</div>
                        <div className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Match Events */}
                <section className="bg-card/20 border border-white/5 rounded-[2.5rem] p-8 shadow-xl text-left">
                  <div className="flex items-center justify-between px-1 mb-6">
                    <h2 className="text-xs md:text-sm font-black text-slate-500 tracking-[0.3em] uppercase">Match Events</h2>
                    <div className="flex items-center gap-2">
                      {["all", "home", "away"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTeamFilter(t as "all" | "home" | "away")}
                          className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                            teamFilter === t ? "bg-primary text-background shadow-md" : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {t === "all" ? "ALL" : t === "home" ? selectedMatch.home_team.split(" ").slice(0, 2).join(" ").toUpperCase() : selectedMatch.away_team.split(" ").slice(0, 2).join(" ").toUpperCase()}
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
                              <span onClick={() => navigate(`/player/${event.player_id}`)} className="text-sm font-black text-white uppercase italic cursor-pointer hover:text-primary transition-colors">
                                {event.player_name}
                              </span>
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${event.team === "home" ? "text-primary" : "text-slate-400"}`}>{selectedMatch.home_team}</div>
                          </div>
                          <div className="text-lg font-black italic text-primary">{event.event_time && event.event_time !== "FT" ? event.event_time : ""}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                <Video className="w-20 h-20 text-slate-700 mb-6" />
                <p className="text-xl font-black italic uppercase text-slate-500 tracking-widest">Select a match</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
