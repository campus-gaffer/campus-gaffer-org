import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, ChevronRight, Shield, LayoutGrid } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";

const MATCH_HISTORY = [
    { id: 1, date: "OCT 12, 2023", opponent: "vs. FC Basement", score: "2-1", goals: "1 Goal", rating: "8.4 RATING" },
    { id: 2, date: "OCT 05, 2023", opponent: "vs. Red Devils", score: "0-3", goals: "0 Goals", rating: "6.1 RATING" },
    { id: 3, date: "SEP 28, 2023", opponent: "vs. Goal Diggers", score: "4-2", goals: "2 Goals", rating: "9.8 RATING" },
    { id: 4, date: "SEP 21, 2023", opponent: "vs. Tech United", score: "1-1", goals: "0 Goals", rating: "7.2 RATING" },
];

const SKILLS = [
    { name: "PACE", value: 92 },
    { name: "FINISHING", value: 85 },
    { name: "STRENGTH", value: 64 },
];

export default function PlayerProfile() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden">
            {/* Desktop View Header (Hidden on Mobile) */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Header (Hidden on Desktop) */}
            <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
                        <ArrowLeft className="w-6 h-6 text-primary" />
                    </button>
                    <h1 className="text-lg italic font-extrabold tracking-wider text-primary uppercase">Player Profile</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="Profile" />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 md:py-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Info Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-card border border-white/5 rounded-[3rem] p-10 card-gradient text-center shadow-2xl relative overflow-hidden">
                            <div className="relative inline-block mb-8">
                                <div className="w-40 h-40 rounded-full border-4 border-primary p-1.5 shadow-[0_0_40px_rgba(0,230,118,0.3)] transition-transform hover:scale-105 duration-500">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-secondary">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="O. Schmidt" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-primary text-background font-black text-xs px-3 py-1 rounded-full border-2 border-background shadow-lg">
                                    LIVE
                                </div>
                            </div>

                            <h2 className="text-5xl font-black mb-2 tracking-tighter italic uppercase text-white">O. Schmidt</h2>
                            <div className="flex items-center justify-center gap-3 mb-8">
                                <span className="text-primary font-black uppercase text-sm tracking-[0.2em]">Forward</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                                <span className="text-slate-400 font-bold uppercase text-sm tracking-[0.2em]">Senior</span>
                            </div>

                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-secondary/50 rounded-2xl border border-white/5 mx-auto hover:border-primary/30 transition-colors cursor-default">
                                <Shield className="w-5 h-5 text-primary fill-primary/20" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-200 leading-none">Kenny's Disciples</span>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mt-12">
                                {[
                                    { label: "GAMES", value: "12" },
                                    { label: "GOALS", value: "08" },
                                    { label: "MVP", value: "04" }
                                ].map(stat => (
                                    <div key={stat.label} className="bg-background/40 border border-white/5 rounded-2xl py-4 text-center">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                                        <div className="text-2xl font-black text-white leading-none">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Skill Breakdown */}
                        <section className="bg-card border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
                            <h2 className="text-xl italic font-black text-white tracking-widest uppercase mb-10 text-left">Skill Breakdown</h2>

                            <div className="space-y-8">
                                {SKILLS.map(skill => (
                                    <div key={skill.name} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{skill.name}</span>
                                            <span className="text-xs font-black text-primary tracking-widest">{skill.value}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(0,230,118,0.6)] transition-all duration-1000"
                                                style={{ width: `${skill.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* History Column */}
                    <div className="lg:col-span-8">
                        <section>
                            <div className="flex items-center justify-between mb-8 px-1">
                                <h2 className="text-3xl italic font-black text-white tracking-widest uppercase">Match History</h2>
                                <button className="px-6 py-2 bg-secondary/50 border border-white/5 rounded-xl text-xs font-black text-primary tracking-[0.2em] uppercase hover:bg-primary hover:text-background transition-all">VIEW ALL</button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {MATCH_HISTORY.map(match => (
                                    <div key={match.id} className="bg-card border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between group hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer shadow-lg relative overflow-hidden text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6 md:mb-0">
                                            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center border border-white/5 text-primary">
                                                <LayoutGrid className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{match.date}</div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl font-black text-white uppercase tracking-tighter">{match.opponent}</span>
                                                    <span className="bg-primary/10 border border-primary/30 px-3 py-1 rounded-lg text-xs font-black text-primary leading-none uppercase">{match.score}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-10">
                                            <div className="text-right">
                                                <div className="text-xl font-black text-primary uppercase italic tracking-tighter">{match.goals}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{match.rating}</div>
                                            </div>
                                            <div className="p-4 bg-secondary/30 rounded-2xl group-hover:bg-primary transition-all">
                                                <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-background" />
                                            </div>
                                        </div>

                                        {/* Hover accent */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />

            <style>{`
        .card-gradient {
          background: linear-gradient(135deg, #181D29 0%, #0F1219 100%);
        }
      `}</style>
        </div>
    );
}
