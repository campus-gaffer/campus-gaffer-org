import { motion } from "framer-motion";
import { Trophy, TrendingUp, DollarSign, Swords, User } from "lucide-react";

const chipVariants = {
  animate: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      duration: 3 + i * 0.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: i * 0.5,
    },
  }),
};

export default function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center w-full min-h-[500px] md:min-h-[600px]">
      {/* Purple glow behind card */}
      <div className="absolute w-[500px] h-[500px] bg-violet-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Fantasy Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[320px] md:w-[360px] bg-[#0c0c14]/90 backdrop-blur-2xl border border-violet-500/25 rounded-[2.5rem] p-7 shadow-[0_0_60px_rgba(139,92,246,0.12)] hover:shadow-[0_0_80px_rgba(139,92,246,0.2)] transition-shadow duration-700"
      >
        {/* Top row: Brand + GW badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Swords className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-black italic text-white uppercase tracking-tight">CAMPUS XI</span>
          </div>
          <div className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
            <span className="text-[9px] font-black text-violet-400 tracking-widest">GW 01</span>
          </div>
        </div>

        {/* Abstract avatar area — gradient shape + icon */}
        <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-900/10 border border-white/5 mb-6 overflow-hidden">
          {/* Faint grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          {/* Jersey icon center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-violet-500/10 border-2 border-violet-500/20 flex items-center justify-center">
              <User className="w-10 h-10 md:w-12 md:h-12 text-violet-400/60" />
            </div>
          </div>
          {/* Decorative gradient orbs */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-violet-500/10 blur-3xl rounded-full" />
        </div>

        {/* Player info */}
        <div className="text-left mb-5">
          <span className="inline-block text-[9px] font-black text-violet-400 tracking-[0.2em] uppercase mb-1 bg-violet-500/5 px-3 py-1 rounded-full border border-violet-500/10">
            Weekly Pick
          </span>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-2">Alex Morgan</h3>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">MID &bull; Intramural League</p>
        </div>

        {/* Bottom mini stat grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "FORM", value: "8.7" },
            { label: "PTS", value: "24" },
            { label: "PICKED", value: "92%" },
          ].map((stat) => (
            <div key={stat.label} className="bg-violet-500/5 border border-white/5 rounded-2xl py-3 text-center group hover:border-violet-500/20 transition-colors">
              <div className="text-lg font-black text-white">{stat.value}</div>
              <div className="text-[8px] font-black text-slate-500 tracking-[0.2em] uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating Chips */}

      {/* Weekly Champ chip */}
      <motion.div
        custom={0}
        variants={chipVariants}
        animate="animate"
        className="absolute -top-2 -left-4 md:-top-4 md:-left-8 z-20"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0c0c14]/95 backdrop-blur-xl border border-violet-500/25 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <div className="text-[8px] font-black text-violet-400 tracking-[0.2em] uppercase">Weekly Champ</div>
            <div className="text-sm font-black text-white">Happy</div>
            <div className="text-[9px] font-bold text-slate-500">32 PTS</div>
          </div>
        </div>
      </motion.div>

      {/* Live Matches chip */}
      <motion.div
        custom={1}
        variants={chipVariants}
        animate="animate"
        className="absolute top-1/4 -right-4 md:-right-10 z-20 hidden md:block"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0c0c14]/95 backdrop-blur-xl border border-violet-500/25 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
          </div>
          <div className="text-left">
            <div className="text-[8px] font-black text-violet-400 tracking-[0.2em] uppercase">Live Matches</div>
            <div className="text-sm font-black text-white">0 Games</div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard chip */}
      <motion.div
        custom={2}
        variants={chipVariants}
        animate="animate"
        className="absolute bottom-12 -right-3 md:-right-6 z-20 hidden md:block"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0c0c14]/95 backdrop-blur-xl border border-violet-500/25 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <div className="text-[8px] font-black text-violet-400 tracking-[0.2em] uppercase">Leaderboard</div>
            <div className="text-sm font-black text-white">#12</div>
            <div className="text-[9px] font-bold text-emerald-400">+4 today</div>
          </div>
        </div>
      </motion.div>

      {/* Squad Budget chip */}
      <motion.div
        custom={3}
        variants={chipVariants}
        animate="animate"
        className="absolute bottom-2 -left-2 md:-left-4 z-20 hidden sm:block"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0c0c14]/95 backdrop-blur-xl border border-violet-500/25 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <div className="text-[8px] font-black text-violet-400 tracking-[0.2em] uppercase">Budget</div>
            <div className="text-sm font-black text-white">$98.5M</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
