import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Bell, Users, PlusCircle, Search, TrendingUp, Filter, Settings, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type Player = {
  id: string;
  name: string;
  university: string;
  price: number;
  position: string;
  total_points: number;
  weekly_points: number;
  img_url: string;
};

export default function Transfers() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [squadPlayerIds, setSquadPlayerIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [budget, setBudget] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [filterPos, setFilterPos] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const clerkId = user.id;

    // Fetch user + squad + player pool in parallel
    Promise.all([
      fetch(`${API_URL}/users/${clerkId}`).then(r => r.json()),
      fetch(`${API_URL}/players`).then(r => r.json()),
      fetch(`${API_URL}/squad/${clerkId}`).then(r => r.json()),
    ])
      .then(([userData, playersData, squadData]) => {
        if (userData && userData.budget) setBudget(userData.budget);
        if (Array.isArray(playersData)) {
          setPlayers(playersData.map((p: any) => ({
            id: p.id,
            name: p.name,
            university: p.university || p.team,
            price: p.price,
            position: p.position,
            total_points: p.total_points || 0,
            weekly_points: p.weekly_points || 0,
            img_url: p.img_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`
          })));
        }
        if (squadData && squadData.players) {
          const ids = squadData.players.map((p: any) => p.id);
          setSquadPlayerIds(ids);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("Data fetch error:", err);
        setLoading(false);
      });
  }, [user]);

  const togglePlayer = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setError("");
    setSuccess(false);
  };

  const confirmTransfers = async () => {
    if (!user || selectedIds.length === 0) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Merge selected with existing squad (replace logic)
      const finalIds = [...selectedIds];
      const res = await fetch(`${API_URL}/squad/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_ids: finalIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Transfer failed");
      } else {
        setSuccess(true);
        setSelectedIds([]);
        // Refresh budget
        const userData = await fetch(`${API_URL}/users/${user.id}`).then(r => r.json());
        if (userData && userData.budget) setBudget(userData.budget);
        setSquadPlayerIds(finalIds);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError("Failed to connect to server");
    }
    setSaving(false);
  };

  const filteredPlayers = (filterPos === "ALL"
    ? players
    : players.filter(p => p.position === filterPos)
  ).filter(p =>
    !searchQuery || p.name.toUpperCase().includes(searchQuery) || p.university.toUpperCase().includes(searchQuery)
  );

  const selectedTotal = selectedIds.reduce((sum, id) => {
    const p = players.find(x => x.id === id);
    return sum + (p?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "anon"}`} alt="Profile" />
          </div>
          <h1 className="text-lg italic font-extrabold tracking-wider text-primary">CAMPUS GAFFER</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
          <Bell className="w-6 h-6 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
        </button>
      </header>

      <main className="container mx-auto px-6 py-8 md:py-16 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6 py-2">
            <div className="text-left">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Transfer Market</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mt-2">Optimize your season squad</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-secondary/50 px-8 py-5 rounded-[2rem] border border-white/5 text-center shadow-xl">
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Available Budget</span>
                <span className={`text-2xl md:text-4xl font-black italic tracking-tighter ${selectedTotal <= budget ? 'text-primary' : 'text-rose-500'}`}>£{budget.toFixed(1)}M</span>
              </div>
              <button className="hidden md:flex p-6 bg-secondary/50 border border-white/5 rounded-[2rem] hover:bg-secondary transition-colors text-slate-400">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Market Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="SEARCH PLAYERS..."
                    className="w-full bg-secondary/50 border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-sm font-black tracking-widest focus:outline-none focus:border-primary/50 uppercase placeholder:text-slate-700 shadow-xl"
                  />
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  {['ALL', 'FWD', 'MID', 'DEF', 'GK'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterPos(cat)}
                      className={`px-8 py-4 rounded-2xl text-[10px] md:text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${filterPos === cat ? 'bg-primary text-background shadow-xl shadow-primary/20' : 'bg-secondary/50 text-slate-500 border border-white/5 hover:border-primary/30 hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button className="p-4 bg-secondary/50 border border-white/5 rounded-2xl text-primary hover:bg-primary hover:text-background transition-all shadow-xl">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Player Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 bg-card/20 rounded-[2.5rem] animate-pulse border border-white/5" />
                  ))
                ) : filteredPlayers.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500 font-black italic uppercase tracking-widest">No {filterPos === "ALL" ? "" : filterPos} players available</p>
                  </div>
                ) : (
                  filteredPlayers.map((player: Player) => {
                    const inSquad = squadPlayerIds.includes(player.id);
                    const isSelected = selectedIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          if (!inSquad) togglePlayer(player.id);
                        }}
                        className={`bg-card border rounded-[2.5rem] p-8 flex items-center justify-between transition-all cursor-pointer group relative overflow-hidden text-left shadow-2xl ${
                          inSquad ? 'border-primary/30 bg-primary/5' :
                          isSelected ? 'border-primary bg-primary/10' :
                          'border-white/5 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-secondary border border-white/10 group-hover:border-primary/40 transition-all overflow-hidden relative shadow-inner">
                            <img
                              src={player.img_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute bottom-0 right-0 backdrop-blur-md px-2 py-1 rounded-tl-xl text-[8px] md:text-[10px] font-black ${
                              player.position === "GK" ? "bg-orange-500/20 text-orange-400" :
                              player.position === "DEF" ? "bg-amber-500/20 text-amber-400" :
                              player.position === "MID" ? "bg-blue-500/20 text-blue-400" :
                              "bg-primary/20 text-primary"
                            }`}>
                              {player.position}
                            </div>
                          </div>
                          <div>
                            <p className="text-lg md:text-xl font-black text-white uppercase leading-none mb-2 group-hover:text-primary transition-colors">{player.name}</p>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">{player.university}</p>
                            <p className="text-[9px] font-black text-primary mt-1">{player.total_points} PTS</p>
                          </div>
                        </div>

                        <div className="text-right relative z-10">
                          <div className="flex flex-col items-end gap-1 mb-4">
                            <p className="text-2xl md:text-3xl font-black italic text-white tracking-tighter leading-none">£{player.price}M</p>
                            <p className={`text-[9px] md:text-[10px] font-black italic leading-none ${player.weekly_points > 0 ? 'text-primary' : 'text-slate-500'}`}>
                              {player.weekly_points > 0 ? `+${player.weekly_points}` : "0"} PTS FORM
                            </p>
                          </div>
                          {inSquad ? (
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePlayer(player.id); }}
                              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all shadow-lg ${
                                isSelected
                                  ? 'bg-primary text-background border-primary scale-110'
                                  : 'bg-secondary/80 border-white/10 hover:bg-primary hover:text-background group-hover:scale-110'
                              }`}
                            >
                              <PlusCircle className={`w-6 h-6 md:w-8 md:h-8 ${isSelected ? 'rotate-45' : ''}`} />
                            </button>
                          )}
                        </div>

                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                          <TrendingUp className="w-32 h-32" />
                        </div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selection Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-card border-2 border-primary/20 rounded-[3rem] p-10 h-fit sticky top-32 text-center shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-primary/5 rotate-45 group-hover:rotate-0 transition-transform">
                  <TrendingUp className="w-48 h-48" />
                </div>

                <div className="relative z-10">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary mb-6">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Squad Revisions</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-10">Select players to swap</p>

                  <div className="bg-background/40 border border-white/5 rounded-[2rem] p-10 mb-10">
                    {selectedIds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="w-12 h-12 border-2 border-dashed border-slate-800 rounded-full flex items-center justify-center">
                          <PlusCircle className="w-6 h-6 text-slate-800" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-[160px]">Select players from market to begin trade</p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-4">{selectedIds.length} PLAYERS SELECTED</p>
                        {selectedIds.map(id => {
                          const p = players.find(x => x.id === id);
                          return p ? (
                            <div key={id} className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl">
                              <span className="text-xs font-black uppercase tracking-wider">{p.name}</span>
                              <span className="text-xs font-black text-primary">£{p.price}M</span>
                            </div>
                          ) : null;
                        })}
                        <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL</span>
                          <span className={`text-sm font-black ${selectedTotal <= budget ? 'text-primary' : 'text-rose-500'}`}>
                            £{selectedTotal.toFixed(1)}M
                          </span>
                        </div>
                        {selectedTotal > budget && (
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Exceeds budget by £{(selectedTotal - budget).toFixed(1)}M</p>
                        )}
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">{error}</p>
                  )}
                  {success && (
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">✓ Squad updated successfully</p>
                  )}

                  <button
                    onClick={confirmTransfers}
                    disabled={saving || selectedIds.length === 0 || selectedTotal > budget}
                    className={`w-full py-6 rounded-[2rem] font-black text-sm tracking-[0.3em] uppercase transition-all ${
                      saving || selectedIds.length === 0 || selectedTotal > budget
                        ? 'bg-primary/10 border border-primary/20 text-primary/40 cursor-not-allowed'
                        : 'bg-primary text-background hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20'
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PROCESSING...
                      </span>
                    ) : (
                      "CONFIRM TRANSFERS"
                    )}
                  </button>
                  <p className="text-[10px] font-bold text-slate-800 uppercase italic tracking-widest mt-6">Point penalties apply for excessive trades</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
