import { Star } from "lucide-react";

const FORMATION = {
  fwd: [1],
  mid: [2, 3],
  def: [4, 5],
  gk: [6]
};

interface PlayerProps {
  role: string;
  name: string;
  points: number;
}

const PlayerSlot = ({ role, name, points }: PlayerProps) => (
  <div className="flex flex-col items-center gap-1 group">
    <div className="relative">
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors shadow-lg">
        <Star className="w-6 h-6 text-zinc-600 group-hover:text-primary/50" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
        {points}
      </div>
    </div>
    <div className="bg-black/80 px-2 py-0.5 rounded border border-white/10 min-w-[60px] text-center">
      <p className="text-[10px] font-bold text-white truncate uppercase">{name}</p>
      <p className="text-[8px] text-zinc-500 font-mono uppercase">{role}</p>
    </div>
  </div>
);

export default function Pitch() {
  return (
    <div className="relative aspect-[3/4] w-full max-w-[500px] mx-auto bg-[#10B981] rounded-t-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl shadow-emerald-900/20">
      {/* Pitch Markings */}
      <div className="absolute inset-4 border-2 border-white/30 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-20 border-b-2 border-x-2 border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-20 border-t-2 border-x-2 border-white/30" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/30 rounded-full" />
      </div>

      {/* Player Grid - 6-a-side Formation (1-2-2-1) */}
      <div className="absolute inset-0 flex flex-col justify-around py-16 px-4 z-20">
        {/* Forward (1) */}
        <div className="flex justify-center items-center">
          {FORMATION.fwd.map((id) => (
            <PlayerSlot key={id} role="FWD" name="Striker" points={Math.floor(Math.random() * 12)} />
          ))}
        </div>
        {/* Midfielders (2) */}
        <div className="flex justify-around items-center">
          {FORMATION.mid.map((id) => (
            <PlayerSlot key={id} role="MID" name="Playmaker" points={Math.floor(Math.random() * 10)} />
          ))}
        </div>
        {/* Defenders (2) */}
        <div className="flex justify-around items-center">
          {FORMATION.def.map((id) => (
            <PlayerSlot key={id} role="DEF" name="Wall" points={Math.floor(Math.random() * 8)} />
          ))}
        </div>
        {/* Goalkeeper (1) */}
        <div className="flex justify-center items-center">
          {FORMATION.gk.map((id) => (
            <PlayerSlot key={id} role="GK" name="Keeper" points={Math.floor(Math.random() * 15)} />
          ))}
        </div>
      </div>

      {/* Pitch Grass Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
          backgroundSize: '80px 100%'
        }} 
      />
    </div>
  );
}
