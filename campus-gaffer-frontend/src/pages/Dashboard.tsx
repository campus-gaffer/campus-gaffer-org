import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Bell, Video, User, PlusCircle, CheckCircle2, Search } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import Pitch from "@/components/dashboard/Pitch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teamName, setTeamName] = useState("THE VARSITY XI");
  const [profile, setProfile] = useState<any>(null);
  const [starters, setStarters] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [managingPosition, setManagingPosition] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [_, _setUserBudget] = useState(0);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");

  useEffect(() => {
    if (searchParams.get('manage') === 'true') {
      setManagingPosition('all');
      // Clear the param after opening to avoid re-opening on refresh
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Fetch live matches from API
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
            pitch: m.venue || "CAMPUS PITCH",
            hasStream: true
          }));
          if (mapped.length > 0) setLiveMatches(mapped);
        }
      })
      .catch(e => console.error("Profile fetch error:", e));
  }, [user]);

  const fetchSquad = () => {
    if (!user) return;
    fetch(`${API_URL}/squad/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.players && data.players.length > 0) {
          const mapped = data.players.map((p: any, idx: number) => {
            // Distribute into positions [GK, DEF, DEF, MID, MID, FWD]
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
              position: pos,
              isCaptain: p.id === data.captain_id,
              img: p.img_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
            };
          });
          setStarters(mapped);
        }
      });
  };

  useEffect(() => {
    if (!user) return;
    // Fetch profile
    fetch(`${API_URL}/users/${user.id}`)
      .then(res => {
        if (res.status === 404) {
          // User doesn't exist in DB -- stale localStorage flag. Redirect to onboarding.
          localStorage.removeItem('gaffer_onboarded');
          navigate('/onboarding', { replace: true });
          return null;
        }
        return res.json();
      })
      .then(found => {
        if (found && found.username) {
          setProfile(found);
          setTeamName(found.team_name);
          setTotalPoints(found.total_points || 0);
          _setUserBudget(found.budget || 0);
        }
      })
      .catch(e => console.error("Profile fetch error:", e));

    // Fetch pool
    fetch(API_URL + "/players")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setAllPlayers(data);
      });

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

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <h1 className="text-base italic font-extrabold tracking-wider text-white uppercase">CAMPUS GAFFER</h1>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background"></span>
        </button>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid lg:grid-cols-12 gap-12">

          <div className="lg:col-span-8 space-y-12">
            {/* Greeting */}
            <div className="hidden md:flex items-center justify-between mb-8">
              <div className="space-y-2 text-left">
                <span className="text-xs md:text-sm font-black text-slate-500 tracking-[0.4em] uppercase">COACH PROFILE</span>
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none transition-all hover:scale-[1.01] cursor-default">
                  WELCOME BACK, <span className="text-primary italic">{profile?.username || "GAFFER"}</span>!
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase italic">Your squad is ready for action.</p>
              </div>
            </div>

            {/* Pitch Section */}
            <section className="animate-in slide-in-from-bottom duration-700 delay-100">
              <Pitch teamName={teamName} players={starters} totalPoints={totalPoints} onManage={(pos) => setManagingPosition(pos)} onSelectCaptain={(id) => setCaptain(String(id))} />
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-8 px-1">
                <h2 className="text-xl italic font-black text-primary tracking-wide uppercase">Live Games</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
                  <span className="text-xs font-black text-primary tracking-widest uppercase">LIVE</span>
                </div>
              </div>

              <div className="space-y-6">
                {liveMatches.length > 0 ? liveMatches.map(game => (
                  <div key={game.id} className="bg-card border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:border-primary/30 transition-all cursor-pointer shadow-xl text-left">
                    <div className="flex items-center justify-between mb-8">
                      <div className="bg-secondary/50 px-4 py-1.5 rounded-full text-[10px] font-black text-primary tracking-widest border border-primary/10 uppercase">
                        {game.pitch}
                      </div>
                      {game.hasStream && (
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                          <Video className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">WATCH</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-6">
                      <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors" />
                        <span className="text-center text-[10px] font-black text-white leading-tight uppercase">{game.team1}</span>
                      </div>
                      <div className="text-2xl font-black italic">{game.score1} - {game.score2}</div>
                      <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-colors" />
                        <span className="text-center text-[10px] font-black text-white leading-tight uppercase">{game.team2}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 font-black italic uppercase tracking-widest text-xs">No live matches right now</p>
                    <p className="text-slate-700 text-[9px] font-bold uppercase tracking-widest mt-2">Check back during game day</p>
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-6 text-left">
              <Link to="/leagues" className="bg-secondary/40 border border-white/5 rounded-[2.5rem] p-8 min-h-[120px] flex flex-col justify-center hover:border-primary/30 transition-all">
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter">LEADERBOARD</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">{totalPoints} pts — view rankings</p>
              </Link>
            </section>
          </div>
        </div>
      </main>

      {/* Manage Squad Modal */}
      {managingPosition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
          {/* Saving Overlay */}
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
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
                  {managingPosition === 'all' ? 'SQUAD MANAGEMENT' : `SELECT YOUR ${managingPosition}`}
                </h2>
                <div className="flex gap-4">
                  <span className="text-[10px] font-black text-primary tracking-widest uppercase">SLOTS: {starters.length} / 6</span>
                  <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic">BUILD YOUR ELITE TEAM</span>
                </div>
              </div>
              <button
                onClick={() => setManagingPosition(null)}
                className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all group"
              >
                <PlusCircle className="w-8 h-8 rotate-45 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="SEARCH PLAYERS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none uppercase placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      let newS;
                      if (isSelected) {
                        newS = starters.filter(s => s.id !== p.id);
                      } else {
                        const pos = managingPosition !== 'all' ? managingPosition : (p.position || 'MID');
                        // Max players per position: GK=1, DEF=2, MID=2, FWD=1
                        const maxPerPos: Record<string, number> = { GK: 1, DEF: 2, MID: 2, FWD: 1 };
                        const max = maxPerPos[pos] || 1;
                        const currentInPos = starters.filter(s => s.position === pos).length;

                        if (currentInPos < max) {
                          // Add to squad if there's room in this position
                          newS = [...starters, { id: p.id, name: p.name, points: p.total_points || 0, position: pos }];
                        } else {
                          // Replace the first player with same position
                          const idx = starters.findIndex(s => s.position === pos);
                          if (idx !== -1) {
                            newS = [...starters];
                            newS[idx] = { id: p.id, name: p.name, points: p.total_points || 0, position: pos };
                          } else {
                            return;
                          }
                        }
                      }

                      // Normalize positions to formation: [GK, DEF, DEF, MID, MID, FWD]
                      const picked: any[] = [];
                      // Assign picked players to formation slots in order of their position
                      const posOrder = ['GK', 'DEF', 'MID', 'FWD'];
                      for (const slotPos of posOrder) {
                        for (const s of (newS || [])) {
                          if (s.position === slotPos) {
                            picked.push({ ...s });
                            if (picked.length >= 6) break;
                          }
                        }
                        if (picked.length >= 6) break;
                      }
                      const withP = picked.length > 0 ? picked : (newS || []);
                      setStarters(withP);
                      // Auto-save when all 6 positions are filled
                      if (withP.length === 6) {
                        saveSquad(withP.map(s => s.id), false);
                      }
                      if (managingPosition !== 'all' && !isSelected) setManagingPosition(null); // Close after selection for specific position
                    }}
                    className={`bg-secondary/30 p-6 rounded-3xl flex items-center justify-between cursor-pointer border-2 transition-all hover:scale-[1.02] ${isSelected ? 'border-primary bg-primary/5' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-white/10">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-black italic text-white uppercase">{p.name}</p>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{p.position}</span>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.university || p.team}</p>
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                    {!isSelected && <div className="text-primary font-black italic uppercase text-xs">SELECT</div>}
                  </div>
                );
              }) : (
                <div className="col-span-full py-20 text-center">
                  <p className="text-slate-500 font-black italic uppercase tracking-widest">No {managingPosition}s available</p>
                </div>
              )}
            </div>
            </div>

            <div className="p-10 border-t border-white/5 bg-black/20">
              <button
                disabled={saving || starters.length === 0}
                onClick={() => saveSquad(starters.map(s => s.id))}
                className="w-full bg-primary py-6 rounded-2xl font-black italic text-background tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
              >
                {saving ? "SYNCING..." : "SAVE & DEPLOY SQUAD"}
              </button>
            </div>
          </div>
        </div>
      )}
      <MobileNav />
    </div>
  );
}
