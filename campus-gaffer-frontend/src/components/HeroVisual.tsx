import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Swords } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

interface TopPlayer {
  name: string;
  position: string;
  total_points: number;
  price: number;
  university?: string;
}

export default function HeroVisual() {
  const [topPlayer, setTopPlayer] = useState<TopPlayer | null>(null);
  const [champName, setChampName] = useState("");

  useEffect(() => {
    // Fetch top player
    fetch(API_URL + "/players")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort(
            (a: any, b: any) => (b.total_points || 0) - (a.total_points || 0)
          );
          setTopPlayer(sorted[0]);
        }
      })
      .catch(() => {});
    // Fetch leaderboard champ
    fetch(API_URL + "/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setChampName(data[0].username);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full min-h-[520px] md:min-h-[620px]">
      {/* Single subtle glow behind card */}
      <div className="absolute w-[400px] h-[400px] bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Fantasy Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-[340px] md:w-[380px] bg-[#0c0c14]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8"
      >
        {/* Top row: Brand + GW badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-white/5 flex items-center justify-center">
              <Swords className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-bold italic text-white uppercase">CAMPUS XI</span>
          </div>
          <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-[9px] font-bold text-violet-400 tracking-wide">GW 01</span>
          </div>
        </div>

        {/* Player avatar — initials badge */}
        <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-violet-600/10 to-violet-900/5 border border-white/[0.04] mb-6 overflow-hidden flex items-center justify-center">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-2 border-white/[0.06] flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold text-violet-400/60 uppercase tracking-tight select-none">
              {topPlayer?.name
                ? topPlayer.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                : "RS"}
            </span>
          </div>
        </div>

        {/* Player info */}
        <div className="text-left mb-6">
          <span className="inline-block text-[9px] font-bold text-violet-400 tracking-wide uppercase mb-1.5">
            TOP SCORER
          </span>
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
            {topPlayer?.name || "Riley Sloane-Seale"}
          </h3>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase mt-1">
            {topPlayer?.position || "DEF"} &bull; {topPlayer?.university || "IMLEAGUES"}
          </p>
        </div>

        {/* Bottom stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "PTS", value: String(topPlayer?.total_points || "168") },
            {
              label: "VALUE",
              value: `£${(topPlayer?.price || 10).toFixed(1)}M`,
            },
            { label: "RANK", value: "#1" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl py-3 text-center"
            >
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-[8px] font-semibold text-slate-500 tracking-wide uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Single floating chip — Weekly Champ (only on desktop) */}
      {champName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute -top-2 -left-2 md:-top-6 md:-left-8 z-20"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0c0c14]/95 backdrop-blur-xl border border-white/[0.06] rounded-xl shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-white/[0.04] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-left">
              <div className="text-[8px] font-semibold text-violet-400 tracking-wide uppercase">
                WEEKLY CHAMP
              </div>
              <div className="text-sm font-bold text-white">{champName}</div>
              <div className="text-[9px] font-semibold text-slate-500">114 PTS</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
