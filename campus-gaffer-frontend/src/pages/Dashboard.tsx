import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import CampusLogo from "@/assets/campus-logo.png";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import Pitch from "@/components/dashboard/Pitch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teamName, setTeamName] = useState("");
  const [starters, setStarters] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [managingPosition, setManagingPosition] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [userBudget, setUserBudget] = useState(100);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (searchParams.get('manage') === 'true') {
      setManagingPosition('all');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Fetch live matches
  useEffect(() => {
    fetch(API_URL + "/matches")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.filter((m: any) => m.is_live).map((m: any) => ({
            id: m.ID,
            team1: m.home_team,
            team2: m.away_team,
            score1: m.home_score,
            score2: m.away_score,
            status: m.match_time || "LIVE",
          }));
          if (mapped.length > 0) setLiveMatches(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    fetch(API_URL + "/leaderboard")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLeaderboard(data.slice(0, 3)); })
      .catch(() => {});
  }, []);

  const fetchSquad = () => {
    if (!user) return;
    fetch(`${API_URL}/squad/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.players && data.players.length > 0) {
          const mapped = data.players.map((p: any, idx: number) => {
            let pos = p.position;
            if (!pos) {
              if (idx === 0) pos = 'GK';
              else if (idx === 1 || idx === 2) pos = 'DEF';
              else if (idx === 3 || idx === 4) pos = 'MID';
              else pos = 'FWD';
            }
            return {
              id: p.id,
              name: p.name,
              points: p.total_points || 0,
              price: p.price || 0,
              position: pos,
              isCaptain: p.id === data.captain_id,
            };
          });
          setStarters(mapped);
        }
      });
  };

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/users/${user.id}`)
      .then(res => {
        if (res.status === 404) {
          localStorage.removeItem('gaffer_onboarded');
          navigate('/onboarding', { replace: true });
          return null;
        }
        return res.json();
      })
      .then(found => {
        if (found && found.username) {
          setTeamName(found.team_name);
          setTotalPoints(found.total_points || 0);
          setUserBudget(found.budget || 100);
        }
      })
      .catch(() => {});

    fetch(API_URL + "/players")
      .then(res => res.json())
      .then(data => { if (data && data.length > 0) setAllPlayers(data); });

    fetchSquad();
  }, [user]);

  const saveSquad = async (playerIds: string[], closeModal = true) => {
    setSaving(true);
    setAutoSaveMsg("SAVING SQUAD...");
    await fetch(`${API_URL}/squad/${user?.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_ids: playerIds })
    });
    fetchSquad();
    setAutoSaveMsg("SQUAD LOCKED!");
    setTimeout(() => {
      setAutoSaveMsg("");
      setSaving(false);
      if (closeModal) setManagingPosition(null);
    }, 1200);
  };

  const setCaptain = async (playerId: string) => {
    await fetch(`${API_URL}/squad/${user?.id}/captain`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId })
    });
    fetchSquad();
  };

  const filteredPlayers = managingPosition === 'all'
    ? allPlayers
    : allPlayers.filter(p => p.position === managingPosition);

  const searchedPlayers = searchTerm
    ? filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredPlayers;

  const squadCost = starters.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
  const remainingBudget = userBudget - squadCost;
  const userRank = leaderboard.findIndex((u: any) => u.clerk_id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-background text-white font-sans relative overflow-x-hidden" style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-between px-4 py-2 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <img src={CampusLogo} alt="Campus Gaffer" className="h-24 w-auto" />
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Left / Main Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Squad Info Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">Gameweek 12</span>
                  <span className="text-[10px] font-bold text-slate-600">Deadline: Fri 7:00 PM</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                  {teamName ? `Squad: ${teamName}` : "Build Your Squad"}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-bold text-slate-400">{starters.length} / 6 selected</span>
                  <span className={`text-sm font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    £{remainingBudget.toFixed(1)}M left
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">{totalPoints} pts total</div>
                </div>
              </div>
            </div>

            {/* Manage Squad CTA - above pitch on mobile */}
            <button
              onClick={() => setManagingPosition('all')}
              className="w-full md:w-auto bg-primary py-4 px-10 rounded-2xl font-black text-background uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
            >
              <PlusCircle className="w-5 h-5" />
              <span>MANAGE SQUAD</span>
            </button>

            {/* Pitch */}
            <section className="animate-in slide-in-from-bottom duration-500">
              <Pitch
                teamName={teamName}
                players={starters}
                totalPoints={totalPoints}
                onManage={(pos) => setManagingPosition(pos)}
                onSelectCaptain={(id) => setCaptain(String(id))}
              />
            </section>

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-4">

            {/* Gameweek Status */}
            <div className="bg-card/30 border border-white/5 rounded-2xl p-5 text-left">
              <h3 className="text-xs font-black text-primary tracking-widest uppercase mb-3">Gameweek Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Deadline</span>
                  <span className="text-xs font-bold text-white">Fri 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className="text-xs font-bold text-slate-400">Squad unlocked</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Players</span>
                  <span className="text-xs font-bold text-white">{starters.length} / 6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Budget left</span>
                  <span className={`text-xs font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-white'}`}>£{remainingBudget.toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {/* Live Games */}
            <div className="bg-card/30 border border-white/5 rounded-2xl p-5 text-left">
              <h3 className="text-xs font-black text-primary tracking-widest uppercase mb-3">Live Games</h3>
              {liveMatches.length > 0 ? (
                <div className="space-y-3">
                  {liveMatches.slice(0, 2).map((g) => (
                    <div key={g.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">{g.team1}</span>
                      <span className="text-sm font-black text-primary">{g.score1} - {g.score2}</span>
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">{g.team2}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-500">No live matches right now</p>
                  <p className="text-[10px] text-slate-600 mt-1">Check back during game day</p>
                </div>
              )}
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-card/30 border border-white/5 rounded-2xl p-5 text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-primary tracking-widest uppercase">Leaderboard</h3>
                <Link to="/leagues" className="text-[10px] font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-2">
                {leaderboard.map((entry: any, i: number) => (
                  <div key={entry.clerk_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-4">{i + 1}.</span>
                      <span className="text-xs font-bold text-white">{entry.team_name}</span>
                    </div>
                    <span className="text-xs font-black text-primary">{entry.total_points}</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p className="text-xs text-slate-500">No rankings yet</p>
                )}
              </div>
            </div>

            {/* Points Summary */}
            <div className="bg-card/30 border border-white/5 rounded-2xl p-5 text-left">
              <h3 className="text-xs font-black text-primary tracking-widest uppercase mb-3">Your Points</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-sm font-black text-white">{totalPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Gameweek</span>
                  <span className="text-sm font-black text-slate-400">0 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Rank</span>
                  <span className="text-sm font-black text-white">{userRank > 0 ? `#${userRank}` : 'Unranked'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Manage Squad Modal */}
      {managingPosition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-3xl bg-black/80">
          {autoSaveMsg && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md rounded-[3rem]">
              <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
                <span className="text-xl font-black italic text-primary tracking-widest uppercase animate-pulse">{autoSaveMsg}</span>
              </div>
            </div>
          )}
          <div className="bg-card/90 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(139,92,246,0.15)] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {managingPosition === 'all' ? 'Select Squad' : `Pick ${managingPosition}`}
                </h2>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs font-bold text-slate-500">{starters.length} / 6 selected</span>
                  <span className={`text-xs font-bold ${remainingBudget < 0 ? 'text-rose-400' : 'text-slate-500'}`}>£{remainingBudget.toFixed(1)}M left</span>
                </div>
              </div>
              <button onClick={() => setManagingPosition(null)} className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all group">
                <PlusCircle className="w-6 h-6 rotate-45 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <input
                type="text"
                placeholder="SEARCH PLAYERS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold tracking-wider focus:border-primary/50 transition-all outline-none uppercase placeholder:text-slate-600"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(searchTerm ? searchedPlayers : [...searchedPlayers].sort((a: any, b: any) => {
                  const aSel = starters.some((s: any) => s.id === a.id) ? 0 : 1;
                  const bSel = starters.some((s: any) => s.id === b.id) ? 0 : 1;
                  return aSel - bSel;
                })).length > 0 ? (searchTerm ? searchedPlayers : [...searchedPlayers].sort((a: any, b: any) => {
                  const aSel = starters.some((s: any) => s.id === a.id) ? 0 : 1;
                  const bSel = starters.some((s: any) => s.id === b.id) ? 0 : 1;
                  return aSel - bSel;
                })).map((p: any) => {
                  const isSelected = starters.some(s => s.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!managingPosition) return;
                        let newS;
                        if (isSelected) {
                          newS = starters.filter(s => s.id !== p.id);
                        } else {
                          const pos = managingPosition !== 'all' ? managingPosition : (p.position || 'MID');
                          const maxPerPos: Record<string, number> = { GK: 1, DEF: 2, MID: 2, FWD: 1 };
                          const max = maxPerPos[pos] || 1;
                          const currentInPos = starters.filter(s => s.position === pos).length;

                          if (currentInPos < max) {
                            const currentCost = starters.reduce((sum: number, s: any) => sum + (s.price || p.price || 0), 0);
                            const newCost = currentCost + (p.price || 0);
                            if (newCost > userBudget && starters.length > 0) return;
                            newS = [...starters, { id: p.id, name: p.name, price: p.price, points: p.total_points || 0, position: pos }];
                          } else {
                            const replaced = starters.find(s => s.position === pos);
                            const currentCost = starters.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
                            const newCost = currentCost - (replaced?.price || 0) + (p.price || 0);
                            if (newCost > userBudget) return;
                            const idx = starters.findIndex(s => s.position === pos);
                            if (idx !== -1) {
                              newS = [...starters];
                              newS[idx] = { id: p.id, name: p.name, price: p.price, points: p.total_points || 0, position: pos };
                            }
                          }
                        }

                        if (!newS) return;
                        const posOrder = ['GK', 'DEF', 'MID', 'FWD'];
                        const picked: any[] = [];
                        for (const slotPos of posOrder) {
                          for (const s of newS) {
                            if (s.position === slotPos) {
                              picked.push({ ...s });
                              if (picked.length >= 6) break;
                            }
                          }
                          if (picked.length >= 6) break;
                        }
                        setStarters(picked.length > 0 ? picked : newS);
                        if (picked.length === 6) saveSquad(picked.map(s => s.id), false);
                        if (managingPosition !== 'all' && !isSelected) setManagingPosition(null);
                      }}
                      className={`bg-secondary/30 p-5 rounded-2xl flex items-center justify-between cursor-pointer border-2 transition-all hover:scale-[1.02] ${isSelected ? 'border-primary bg-primary/5' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-white/10">
                          <span className="text-sm font-black text-primary">{p.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-white uppercase">{p.name}</p>
                          <div className="flex gap-2 items-center mt-0.5">
                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{p.position}</span>
                            <span className="text-[9px] font-bold text-slate-400">£{p.price?.toFixed(1) || "?"}M</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        <span className="text-[9px] font-bold text-slate-500">{p.total_points || 0} pts</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-wider">No players available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20">
              <button
                disabled={saving || starters.length === 0}
                onClick={() => saveSquad(starters.map(s => s.id))}
                className="w-full bg-primary py-4 rounded-2xl font-bold text-background uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
              >
                {saving ? "SAVING..." : "SAVE SQUAD"}
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileNav />
    </div>
  );
}
