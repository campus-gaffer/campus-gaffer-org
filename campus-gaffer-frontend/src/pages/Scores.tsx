import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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

function TeamBadge({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center ${className || ""}`}>
      <span className="text-xs font-bold text-slate-400">{initials}</span>
    </div>
  );
}

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
  const displayed = activeTab === "live" ? liveMatches : activeTab === "results" ? resultsMatches : upcomingMatches;

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-lg font-bold tracking-tight text-white uppercase">Matches</h1>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Matches</h2>
            <span className="text-xs text-slate-500">{resultsMatches.length} played</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] mb-6">
            {(["results", "live", "upcoming"] as const).map((tab) => {
              const count = tab === "results" ? resultsMatches.length : tab === "live" ? liveMatches.length : upcomingMatches.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    activeTab === tab ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-white"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Match List */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-sm font-bold">Loading...</div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm font-bold uppercase">No {activeTab} matches</div>
            ) : (
              displayed.map(match => (
                <div
                  key={match.ID}
                  onClick={() => navigate(`/matches/${match.ID}`)}
                  className="bg-card border border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all flex items-center gap-4"
                >
                  {/* Date / Status left column */}
                  <div className="flex flex-col items-center min-w-[48px]">
                    {match.kickoff_time && (
                      <span className="text-[10px] font-bold text-slate-500 leading-tight text-center uppercase">
                        {new Date(match.kickoff_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).replace(" ", "\n")}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold uppercase mt-1.5 px-2 py-0.5 rounded-full ${
                      match.is_live ? "bg-primary/20 text-primary" : "text-green-400 bg-green-400/10"
                    }`}>
                      {match.is_live ? "LIVE" : "FT"}
                    </span>
                  </div>

                  {/* Teams and score */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3">
                      <TeamBadge name={match.home_team} />
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">{match.home_team}</span>
                    </div>
                    <div className="text-lg font-bold text-white tabular-nums">
                      {match.home_score} - {match.away_score}
                    </div>
                    <div className="flex-1 flex items-center gap-3 justify-end">
                      <span className="text-xs font-bold text-white truncate max-w-[80px] text-right">{match.away_team}</span>
                      <TeamBadge name={match.away_team} />
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
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
