import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
}

const SidebarCard = ({ title, icon, children, className, isDark }: SidebarCardProps) => (
  <Card className={cn(
    "backdrop-blur-xl rounded-none transition-all duration-300",
    isDark ? "bg-zinc-900/50 border-white/5 shadow-xl" : "bg-white/5 border-[#E11D48]/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]",
    className
  )}>
    <CardHeader className="pb-2 border-b border-white/5">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <CardTitle className="text-sm italic tracking-widest uppercase">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="pt-4">
      {children}
    </CardContent>
  </Card>
);

export function GameweekInfo() {
  return (
    <SidebarCard title="Gameweek Info" icon={<Clock className="w-4 h-4" />}>
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Next Deadline</p>
          <p className="text-2xl font-black italic text-white tracking-tighter">02D : 14H : 35M</p>
        </div>
        <div className="h-[1px] bg-white/5 w-full" />
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Status</span>
          <span className="text-[10px] font-mono text-emerald-400 uppercase animate-pulse">● Live Scoring</span>
        </div>
      </div>
    </SidebarCard>
  );
}

export function PointsBreakdown() {
  return (
    <SidebarCard title="Points Breakdown" icon={<TrendingUp className="w-4 h-4" />}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase">Current GW</p>
          <p className="text-3xl font-black text-white italic tracking-tighter">48</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase">Total Points</p>
          <p className="text-3xl font-black text-primary italic tracking-tighter">242</p>
        </div>
      </div>
    </SidebarCard>
  );
}

export function LeaderboardRanks() {
  return (
    <SidebarCard title="Leaderboard Ranks" icon={<Trophy className="w-4 h-4" />} isDark>
      <div className="space-y-4 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 uppercase">Global</span>
          <span className="text-white font-bold">#1,240</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 uppercase">Campus League</span>
          <span className="text-white font-bold">#42</span>
        </div>
        <div className="flex justify-between items-center text-primary">
          <span className="uppercase font-bold italic">Dorm League</span>
          <span className="font-bold">#3</span>
        </div>
      </div>
    </SidebarCard>
  );
}

export function RecentPoints() {
  return (
    <SidebarCard title="Recent Points" icon={<Star className="w-4 h-4" />} isDark>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-black/40 border-l-2 border-primary">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase">Smith (FWD)</span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">vs Law School</span>
            </div>
            <span className="text-sm font-black italic text-primary">+12</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}
