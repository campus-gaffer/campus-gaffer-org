import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Users, BarChart3 } from "lucide-react";

export default function MobileNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const NAV_ITEMS = [
        { name: 'HOME', path: '/dashboard', icon: Home },
        { name: 'SCORES', path: '/scores', icon: LayoutGrid },
        { name: 'SQUAD', path: '/dashboard?manage=true', icon: Users },
        { name: 'LEADERBOARD', path: '/leagues', icon: BarChart3 },
    ];

    return (
        <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-background/90 border-t border-white/5 px-8 py-5 backdrop-blur-xl z-50">
            <div className="flex items-center justify-between max-w-lg mx-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-2 transition-all group ${isActive ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                        >
                            <div className={`${isActive ? 'bg-primary/10 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,230,118,0.1)]' : 'px-6 py-2'}`}>
                                <item.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? '' : 'font-bold'}`}>{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
