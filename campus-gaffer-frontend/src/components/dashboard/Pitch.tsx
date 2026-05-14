import { User, Shield, PenLine, Star, Plus } from 'lucide-react';

interface Player {
    id: string | number;
    name: string;
    points: number;
    position: string;
    isCaptain?: boolean;
}

interface PitchProps {
    teamName?: string;
    players?: Player[];
    totalPoints?: number;
    onManage?: (position: string) => void;
    onSelectCaptain?: (id: string | number) => void;
}

export default function Pitch({ teamName = "THE VARSITY XI", players = [], totalPoints = 0, onManage, onSelectCaptain }: PitchProps) {
    // Standard 6-player formation (1-2-2-1)
    const gk = players.find(p => p.position === 'GK');
    const defs = players.filter(p => p.position === 'DEF');
    const mids = players.filter(p => p.position === 'MID');
    const fwd = players.find(p => p.position === 'FWD');

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Top Info Bar */}
            <div className="flex items-center justify-between text-left">
                <div>
                    <span className="text-[10px] md:text-xs font-black text-slate-500 tracking-widest uppercase mb-1 block">GAME WEEK 12</span>
                    <h2 className="text-2xl md:text-4xl font-black italic uppercase italic tracking-tighter text-white">{teamName}</h2>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-[10px] md:text-xs font-black text-primary tracking-widest uppercase">LIVE</span>
                    </div>
                    <div className="flex items-end gap-2 leading-none">
                        <span className="text-4xl md:text-6xl font-black text-primary italic transition-all group-hover:scale-105">{totalPoints}</span>
                        <span className="text-lg md:text-xl font-black text-primary/60 mb-1">pts</span>
                    </div>
                </div>
            </div>

            {/* Main Pitch Container */}
            <div className="relative aspect-[3/4] rounded-[2.5rem] bg-[#0A1A14] border border-white/5 shadow-2xl overflow-hidden p-6 md:p-10">

                {/* Pitch Lines Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-4 border border-primary/30 rounded-[1.5rem]"></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 border border-primary/30 border-t-0"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-24 border border-primary/30 border-b-0"></div>
                    <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-32 h-16 border border-primary/30 rounded-t-full"></div>
                    <div className="absolute top-1/2 left-4 right-4 h-px bg-primary/30 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-primary/30 rounded-full"></div>
                </div>

                {/* Player Layouts: 1-2-2-1 Formation */}
                <div className="relative h-full flex flex-col justify-between py-6">

                    {/* FWD Line */}
                    <div className="flex justify-center items-center">
                        <PlayerCard player={fwd} role="FWD" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* MID Line */}
                    <div className="flex justify-around items-center">
                        <PlayerCard player={mids[0]} role="MID" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                        <PlayerCard player={mids[1]} role="MID" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* DEF Line */}
                    <div className="flex justify-around items-center">
                        <PlayerCard player={defs[0]} role="DEF" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                        <PlayerCard player={defs[1]} role="DEF" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* GK Line */}
                    <div className="flex justify-center items-center">
                        <PlayerCard player={gk} isGK role="GK" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onManage?.('all')}
                    className="flex items-center justify-center gap-3 bg-primary py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-xl shadow-primary/20"
                >
                    <PenLine className="w-5 h-5 text-background" />
                    <span className="text-sm font-black text-background uppercase tracking-[0.2em] italic">MANAGE SQUAD</span>
                </button>
                <button
                    onClick={() => {
                        if (players.length > 0) onSelectCaptain?.(players[0].id);
                    }}
                    className="flex items-center justify-center gap-3 bg-secondary/50 border border-white/5 py-5 rounded-2xl hover:bg-secondary transition-all active:scale-[0.98] group shadow-xl shadow-black/20"
                >
                    <Star className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-black text-white uppercase tracking-[0.2em] italic">CAPTAIN SELECTOR</span>
                </button>
            </div>
        </div>
    );
}

function PlayerCard({ player, isGK, role, onManage, onSelectCaptain }: { player?: Player; isGK?: boolean; role: string; onManage?: (pos: string) => void; onSelectCaptain?: (id: string | number) => void }) {
    if (!player) return (
        <div onClick={() => onManage?.(role)} className="flex flex-col items-center gap-2 group cursor-pointer transition-all hover:scale-105 active:scale-95">
            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl bg-secondary/40 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-all shadow-inner shadow-black/40">
                <Plus className="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors" />
            </div>
            <div className="bg-background/40 backdrop-blur-md rounded-lg p-1.5 min-w-[50px] md:min-w-[70px] border border-white/5 text-center">
                <div className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{role}</div>
            </div>
        </div>
    );

    return (
        <div onClick={() => onSelectCaptain?.(player.id)} className="flex flex-col items-center gap-2 group cursor-pointer transition-transform hover:scale-110 active:scale-95">
            <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all ${isGK ? 'bg-orange-500/20 border-orange-500/40 group-hover:bg-orange-500 group-hover:border-orange-500' : 'bg-secondary border-primary/20 group-hover:bg-primary group-hover:border-primary'} ${player?.isCaptain ? 'ring-2 ring-primary ring-offset-4 ring-offset-transparent shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}>
                {isGK ? (
                    <Shield className={`w-6 h-6 md:w-8 md:h-8 ${isGK ? 'text-orange-500 group-hover:text-background' : 'text-primary group-hover:text-background'} transition-colors`} />
                ) : (
                    <User className={`w-6 h-6 md:w-8 md:h-8 text-primary group-hover:text-background transition-colors`} />
                )}
                {player?.isCaptain && (
                    <div className="absolute -top-2 -right-2 bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-background shadow-lg">
                        C
                    </div>
                )}
            </div>
            <div className="bg-background/80 backdrop-blur-md rounded-lg p-2 min-w-[60px] md:min-w-[80px] border border-white/5 shadow-xl text-center">
                <div className="text-[8px] md:text-[10px] font-black text-white/90 uppercase tracking-tighter mb-0.5 truncate">{player?.name || "PLAYER"}</div>
                <div className="text-[10px] md:text-xs font-black text-primary leading-none">{player?.points ?? 0}</div>
            </div>
        </div>
    );
}
