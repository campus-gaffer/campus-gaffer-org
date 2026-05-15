import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { LogOut, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type Props = {
  avatarSeed: string;
  clerkId: string;
  openUpward?: boolean;
};

export default function ProfileDropdown({ avatarSeed, clerkId, openUpward }: Props) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [username, setUsername] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!clerkId || teamName) return;
    const cached = sessionStorage.getItem(`team_${clerkId}`);
    if (cached) {
      const { team, user } = JSON.parse(cached);
      setTeamName(team);
      setUsername(user);
      return;
    }
    fetch(`${API_URL}/users/${clerkId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setTeamName(data.team_name || "");
          setUsername(data.username || "");
          sessionStorage.setItem(`team_${clerkId}`, JSON.stringify({ team: data.team_name || "", user: data.username || "" }));
        }
      })
      .catch(() => {});
  }, [clerkId]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-xl border-2 border-primary/50 hover:border-primary transition-colors shadow-lg shadow-primary/20 overflow-hidden bg-secondary flex items-center justify-center cursor-pointer"
      >
        {avatarSeed ? (
          <img
            src={`https://api.dicebear.com/7.x/${avatarSeed}/svg?seed=${clerkId}`}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-black text-primary/60">?</span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 ${openUpward ? 'bottom-16' : 'top-16'} w-64 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50`}>
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-sm font-bold text-white truncate">{teamName || "No Team"}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{username || "Manager"}</p>
          </div>
          <button
            onClick={() => { navigate("/profile"); setOpen(false); }}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors text-sm font-bold text-white"
          >
            <User className="w-4 h-4 text-primary" />
            PROFILE
          </button>
          <div className="h-px bg-white/5" />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors text-sm font-bold text-rose-400"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
