import { Bell, Shield, Zap, Star, Users, Trophy } from "lucide-react";
import Navbar from "@/components/NavBar";
import MobileNav from "@/components/dashboard/MobileNav";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function About() {
    const [stats, setStats] = useState({ users: 0, players: 0, matches: 0, games: 0, performances: 0, teams: 0 });

    useEffect(() => {
        fetch(`${API_URL}/stats`)
            .then(r => r.json())
            .then(data => {
                setStats({
                    users: data.users || 0,
                    players: data.players || 0,
                    matches: data.games || 0,
                    games: data.games || 0,
                    performances: data.performances || 0,
                    teams: data.teams || 0,
                });
            })
            .catch(() => {
                setStats({ users: 0, players: 0, matches: 0, games: 0, performances: 0, teams: 0 });
            });
    }, []);

    return (
        <div className="min-h-screen bg-background text-white pb-24 font-sans relative overflow-x-hidden uppercase">
            {/* Desktop View Header (Hidden on Mobile) */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Header (Hidden on Desktop) */}
            <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" alt="Profile" />
                    </div>
                    <h1 className="text-lg italic font-extrabold tracking-wider text-primary">CAMPUS GAFFER</h1>
                </div>
                <button className="p-2 rounded-full hover:bg-secondary transition-colors relative">
                    <Bell className="w-6 h-6 text-slate-300" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
                </button>
            </header>

            <main className="container mx-auto px-6 py-8 md:py-16 animate-in fade-in duration-500">
                <div className="max-w-6xl mx-auto space-y-12 md:space-y-24">

                    {/* Hero Section */}
                    <section className="flex flex-col lg:flex-row items-center justify-between gap-16 border-l-4 border-primary pl-6 py-2 md:pl-12 md:py-10">
                        <div className="max-w-2xl text-left">
                            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-none mb-8">About the <span className="text-primary italic">Game</span></h2>
                            <p className="text-slate-400 font-bold text-sm md:text-xl uppercase tracking-widest leading-relaxed">
                                CAMPUS GAFFER WAS BUILT TO BRING STUDENTS TOGETHER THROUGH THE BEAUTIFUL GAME.
                                WE MODERNIZE INTRAMURAL SPORTS BY TURNING REAL MATCHES INTO AN INTERACTIVE FANTASY EXPERIENCE.
                            </p>
                        </div>

                        <div className="hidden lg:block relative group">
                            <div className="w-[400px] h-[400px] bg-secondary/50 rounded-[4rem] border-2 border-white/5 flex items-center justify-center p-12 transition-all group-hover:border-primary/20 shadow-2xl relative z-10">
                                <Star className="w-full h-full text-primary opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                            </div>
                            <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                            <div className="absolute inset-x-0 bottom-[-40px] h-32 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        <div className="bg-card border border-white/5 p-12 rounded-[3.5rem] text-center space-y-6 group hover:border-primary/30 transition-all shadow-2xl relative overflow-hidden">
                            <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary group-hover:scale-110 group-hover:rotate-12 transition-all">
                                <Users className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-4xl md:text-6xl font-black text-white italic tracking-tighter transition-all group-hover:text-primary">{stats.users}</p>
                                <p className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">ACTIVE GAFFERS</p>
                            </div>
                            <div className="absolute bottom-[-10px] right-[-10px] opacity-5">
                                <Users className="w-32 h-32" />
                            </div>
                        </div>

                        <div className="bg-card border border-white/5 p-12 rounded-[3.5rem] text-center space-y-6 group hover:border-primary/30 transition-all shadow-2xl relative overflow-hidden">
                            <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary group-hover:scale-110 group-hover:-rotate-12 transition-all">
                                <Shield className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-4xl md:text-6xl font-black text-white italic tracking-tighter transition-all group-hover:text-primary">{stats.players}</p>
                                <p className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">PLAYERS IN DATABASE</p>
                            </div>
                            <div className="absolute bottom-[-10px] right-[-10px] opacity-5">
                                <Shield className="w-32 h-32" />
                            </div>
                        </div>

                        <div className="bg-primary rounded-[3.5rem] p-12 text-center space-y-6 group hover:shadow-2xl hover:shadow-primary/30 transition-all relative overflow-hidden shadow-2xl flex flex-col justify-center">
                            <div className="w-20 h-20 bg-background/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-background group-hover:scale-110 transition-all">
                                <Trophy className="w-10 h-10" />
                            </div>
                            <div className="space-y-2 relative z-10">
                                <p className="text-4xl md:text-6xl font-black text-background italic tracking-tighter leading-none">{stats.matches}</p>
                                <p className="text-xs font-black text-background/60 tracking-[0.3em] uppercase">MATCHES TRACKED</p>
                            </div>
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </section>

                    {/* How it Works Full Width */}
                    <section className="bg-secondary/30 border border-white/5 rounded-[4rem] p-12 md:p-24 space-y-16 relative overflow-hidden group shadow-2xl text-left">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
                            <div>
                                <h3 className="text-2xl font-black text-primary uppercase tracking-widest relative z-10 mb-4">How it Works</h3>
                                <p className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter relative z-10">Master the Gaffer Code</p>
                            </div>
                            <Zap className="w-20 h-20 text-primary/30 hidden lg:block" />
                        </div>

                        <div className="grid md:grid-cols-3 gap-16 relative z-10">
                            {[
                                { step: "01", title: "BUILD SQUAD", desc: "DRAFT REAL PLAYERS FROM YOUR CAMPUS LEAGUES. USE YOUR SCOUTING BUDGET TO SECURE THE BEST TALENT FROM EVERY MATCH." },
                                { step: "02", title: "TRACK GAMES", desc: "EARN POINTS BASED ON THEIR REAL-WORLD PERFORMANCE. GOALS, ASSISTS, AND CLEAN SHEETS ALL COUNT TOWARDS YOUR SCORE." },
                                { step: "03", title: "RANK UP", desc: "CLIMB THE CAMPUS LEADERBOARD AND WIN REWARDS. TOP MANAGERS WIN WEEKLY PRIZES FROM OUR UNIVERSITY PARTNERS." }
                            ].map(item => (
                                <div key={item.step} className="flex flex-col gap-8 group/item">
                                    <span className="text-5xl md:text-7xl font-black italic text-primary/10 group-hover/item:text-primary/30 transition-colors leading-none">{item.step}</span>
                                    <div className="space-y-4">
                                        <h4 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase">{item.title}</h4>
                                        <p className="text-[11px] md:text-sm font-bold text-slate-500 leading-relaxed tracking-widest font-sans">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="absolute -bottom-24 -right-24 opacity-5 rotate-12 transition-transform group-hover:rotate-0">
                            <Zap className="w-[500px] h-[500px] text-primary" />
                        </div>
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
                    </section>

                    {/* Footer Info Section */}
                    <section className="text-center space-y-8 pt-12 pb-12">
                        <div className="flex justify-center gap-10 md:gap-20">
                            {['Terms of Service', 'Privacy Policy', 'Community Guidelines', 'Technical Support'].map(link => (
                                <button key={link} className="text-[10px] md:text-xs font-black text-slate-600 hover:text-primary transition-colors uppercase tracking-[0.2em]">{link}</button>
                            ))}
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <p className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-[0.5em]">Version 2.4.0 • Built with passion by THE CAMPUS GAFFER TEAM</p>
                    </section>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    );
}
