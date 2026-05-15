import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import CampusLogo from "@/assets/campus-logo.png";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import AvatarPicker from "@/components/AvatarPicker";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

function TeamInitials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const dim = size === "sm" ? "w-10 h-10 text-xs" : "w-20 h-20 text-lg";
  return (
    <div className={`${dim} rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-slate-400">{initials}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { clerk_id: urlClerkId } = useParams();
  const navigate = useNavigate();
  const viewClerkId = urlClerkId || user?.id;
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState("");

  useEffect(() => {
    if (!viewClerkId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/users/${viewClerkId}`).then(r => r.json()),
      fetch(API_URL + "/leaderboard").then(r => r.json()),
      fetch(`${API_URL}/squad/${viewClerkId}`).then(r => r.json()),
    ])
      .then(([prof, lb, sq]) => {
        setProfile(prof);
        setAvatarSeed(prof?.avatar || "");
        setLeaderboard(Array.isArray(lb) ? lb : []);
        setSquad(sq?.players || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [viewClerkId]);

  const rank = leaderboard.findIndex((u: any) => u.clerk_id === viewClerkId) + 1;
  const totalRank = leaderboard.length;
  const isCurrentUser = !urlClerkId || urlClerkId === user?.id;
  const squadValue = squad.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
  const unusedBudget = (profile?.budget || 100) - squadValue;

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-bold text-slate-500">Manager not found</p>
        <button onClick={() => navigate(-1)} className="text-xs font-bold text-primary">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
      <div className="hidden md:block"><Navbar /></div>

      <header className="flex md:hidden items-center justify-center px-4 py-1 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <img src={CampusLogo} alt="Campus Gaffer" className="h-16 w-auto" />
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Manager Card */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                onClick={() => isCurrentUser && setShowPicker(true)}
                className={`relative flex-shrink-0 ${isCurrentUser ? "cursor-pointer group" : ""}`}
              >
                {avatarSeed ? (
                  <img src={`https://api.dicebear.com/7.x/${avatarSeed}/svg?seed=${viewClerkId}`} alt="" className="w-20 h-20 rounded-2xl border-2 border-white/10 object-cover" />
                ) : (
                  <TeamInitials name={profile.team_name || profile.username || "?"} />
                )}
                {isCurrentUser && (
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-bold text-white">EDIT</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{profile.username || "Manager"}</h2>
                <p className="text-sm text-slate-400 truncate">Team: {profile.team_name || "Unnamed"}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{profile.university || "University of Manitoba"}</span>
                  <span className="text-xs text-slate-600">&middot;</span>
                  <span className="text-xs font-bold text-primary">Rank #{rank > 0 ? rank : "-"} of {totalRank}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-primary">{profile.total_points || 0}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">points</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-sm font-bold text-white">£{squadValue.toFixed(1)}M</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Squad value</div>
            </div>
            <div className="bg-card border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-sm font-bold text-white">£{unusedBudget.toFixed(1)}M</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Budget left</div>
            </div>
            <div className="bg-card border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-sm font-bold text-white">{profile.last_gameweek || 0}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">Gameweek</div>
            </div>
          </div>

          {/* Squad Value Bar */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Budget</span>
              <span className="text-xs font-bold text-white">£{unusedBudget.toFixed(1)}M remaining</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (squadValue / (profile?.budget || 100)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Squad Section */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">My Squad</h3>
            {squad.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No squad selected yet</p>
                <p className="text-xs text-slate-600 mt-1">Pick 6 players from the dashboard to start</p>
              </div>
            ) : (
              <div className="space-y-2">
                {squad.map((p: any) => (
                  <Link
                    key={p.id}
                    to={`/player/${p.id}`}
                    className="flex items-center gap-4 bg-white/[0.02] rounded-xl p-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-400">{p.name?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {p.is_captain ? "Captain" : `£${(p.price || 0).toFixed(1)}M`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{p.total_points || 0}</div>
                      <div className="text-[8px] font-bold text-slate-600 uppercase">pts</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Gameweek History */}
          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Gameweek History</h3>
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-500">No gameweek history yet</p>
              <p className="text-xs text-slate-600 mt-1">Scores will appear after your first completed gameweek</p>
            </div>
          </div>

          {/* Sign Out (own profile only) */}
          {isCurrentUser && (
            <button
              onClick={() => signOut()}
              className="w-full md:hidden py-4 border border-white/10 rounded-2xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              SIGN OUT
            </button>
          )}

        </div>
      </main>

      {showPicker && (
        <AvatarPicker
          currentAvatar={avatarSeed}
          clerkId={viewClerkId || ""}
          onClose={() => setShowPicker(false)}
          onSaved={(seed) => {
            setAvatarSeed(seed);
            if (viewClerkId) {
              fetch(`${API_URL}/users/${viewClerkId}`).then(r => r.json()).then(setProfile).catch(() => {});
            }
          }}
        />
      )}

      <MobileNav />
    </div>
  );
}
