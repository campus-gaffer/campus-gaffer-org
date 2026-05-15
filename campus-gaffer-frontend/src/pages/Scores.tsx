import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + "/matches")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const resultsMatches = matches.filter(m => m.match_time === "FT");
  const liveMatches = matches.filter(m => m.is_live);
  const upcomingMatches = matches.filter(m => !m.is_live && m.match_time !== "FT");
  const displayedMatches = activeTab === "live" ? liveMatches : activeTab === "results" ? resultsMatches : upcomingMatches;

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-lg italic font-extrabold tracking-wider text-primary uppercase">Matches</h1>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Matches</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">
                {resultsMatches.length} played &bull; {liveMatches.length} live &bull; {upcomingMatches.length} upcoming
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-secondary/40 rounded-2xl p-1.5 border border-white/5 mb-6">
            {(["results", "live", "upcoming"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
                  activeTab === tab ? "bg-primary text-background shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "results" ? `Results (${resultsMatches.length})` : tab === "live" ? `Live (${liveMatches.length})` : `Upcoming (${upcomingMatches.length})`}
              </button>
            ))}
          </div>

          {/* Match List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loading ? (
              <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">Loading...</div>
            ) : displayedMatches.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-black italic uppercase tracking-widest">No {activeTab} matches</div>
            ) : (
              displayedMatches.map(match => (
                <div
                  key={match.ID}
                  onClick={() => navigate(`/matches/${match.ID}`)}
                  className="bg-card/40 border border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50"
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
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-white text-center leading-tight uppercase">{match.home_team}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-4">
                      <span className="text-xl font-black italic tracking-tighter">{match.home_score} - {match.away_score}</span>
                      {match.is_live && <span className="text-[9px] font-black text-slate-500 tracking-widest">{match.match_time || ""}</span>}
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-white/5">
                        <Video className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-white text-center leading-tight uppercase">{match.away_team}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
