import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { LogOut, User } from "lucide-react";

type Props = {
  avatarSeed: string;
  clerkId: string;
};

export default function ProfileDropdown({ avatarSeed, clerkId }: Props) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        <div className="absolute right-0 top-16 w-56 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
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
