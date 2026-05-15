import { User, Shield, Plus, Star, Crown } from 'lucide-react';

interface Player {
    id: string | number;
    name: string;
    points: number;
    price?: number;
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

export default function Pitch({ players = [], onManage, onSelectCaptain }: PitchProps) {
    const gk = players.find(p => p.position === 'GK');
    const defs = players.filter(p => p.position === 'DEF');
    const mids = players.filter(p => p.position === 'MID');
    const fwd = players.find(p => p.position === 'FWD');

    return (
        <div className="w-full max-w-xl mx-auto space-y-4">
            {/* Main Pitch Container */}
            <div className="relative aspect-[3/4] md:aspect-[3/4.5] rounded-[2rem] bg-[#0A1A14] border border-white/[0.06] overflow-hidden p-5 md:p-8">

                {/* Pitch Lines Pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <div className="absolute inset-4 border border-white/20 rounded-[1.5rem]"></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 border border-white/20 border-t-0"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-24 border border-white/20 border-b-0"></div>
                    <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-32 h-16 border border-white/20 rounded-t-full"></div>
                    <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/20 rounded-full"></div>
                </div>

                {/* Player Layout: 1-2-2-1 Formation */}
                <div className="relative h-full flex flex-col justify-between py-4">

                    {/* FWD Line */}
                    <div className="flex justify-center items-center">
                        <PlayerSlot player={fwd} label="FWD" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* MID Line */}
                    <div className="flex justify-around items-center">
                        <PlayerSlot player={mids[0]} label="MID" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                        <PlayerSlot player={mids[1]} label="MID" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* DEF Line */}
                    <div className="flex justify-around items-center">
                        <PlayerSlot player={defs[0]} label="DEF" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                        <PlayerSlot player={defs[1]} label="DEF" onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                    {/* GK Line */}
                    <div className="flex justify-center items-center">
                        <PlayerSlot player={gk} label="GK" isGK onManage={onManage} onSelectCaptain={onSelectCaptain} />
                    </div>

                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => onManage?.('all')}
                    className="flex-1 bg-primary py-4 rounded-2xl font-bold text-background text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    <PlusCircle2 className="w-5 h-5" />
                    <span>ADD PLAYERS</span>
                </button>
                <button
                    onClick={() => {
                        const currentIdx = players.findIndex(p => p.isCaptain);
                        const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % players.length : 0;
                        if (players[nextIdx]) onSelectCaptain?.(players[nextIdx].id);
                    }}
                    className="px-6 bg-secondary/50 border border-white/5 rounded-2xl hover:bg-secondary transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Star className="w-5 h-5 text-slate-400 hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">CAPTAIN</span>
                </button>
            </div>
        </div>
    );
}

function PlayerSlot({ player, label, isGK, onManage, onSelectCaptain }: {
    player?: Player; label: string; isGK?: boolean;
    onManage?: (pos: string) => void; onSelectCaptain?: (id: string | number) => void;
}) {
    if (!player) return (
        <div
            onClick={() => onManage?.(label)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer transition-all"
        >
            <div className="w-14 h-14 md:w-[60px] md:h-[60px] rounded-xl bg-white/[0.03] border-2 border-dashed border-white/[0.12] flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/40 transition-all">
                <Plus className="w-7 h-7 text-slate-600 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-primary transition-colors">
                + {label}
            </div>
        </div>
    );

    return (
        <div
            onClick={() => onSelectCaptain?.(player.id)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
            <div className={`relative w-14 h-14 md:w-[60px] md:h-[60px] rounded-xl flex items-center justify-center border-2 transition-all ${
                isGK
                    ? 'bg-orange-500/15 border-orange-500/30 group-hover:bg-orange-500/30'
                    : 'bg-primary/10 border-primary/30 group-hover:bg-primary/20'
            } ${player.isCaptain ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent shadow-[0_0_15px_rgba(139,92,246,0.25)]' : ''}`}>
                {isGK ? (
                    <Shield className="w-7 h-7 md:w-8 md:h-8 text-orange-400 group-hover:text-orange-300 transition-colors" />
                ) : (
                    <User className="w-7 h-7 md:w-8 md:h-8 text-primary/60 group-hover:text-primary transition-colors" />
                )}
                {player.isCaptain && (
                    <div className="absolute -top-2 -right-2 bg-primary text-background w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-background shadow-lg">
                        <Crown className="w-3 h-3" />
                    </div>
                )}
            </div>
            <div className="bg-white/[0.04] backdrop-blur-md rounded-lg p-1.5 min-w-[60px] border border-white/[0.04] text-center">
                <div className="text-[9px] font-bold text-white/80 uppercase tracking-tight truncate max-w-[60px]">{player.name}</div>
                <div className="text-[10px] font-black text-primary">{player.points} pts</div>
            </div>
        </div>
    );
}

function PlusCircle2({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
    );
}
