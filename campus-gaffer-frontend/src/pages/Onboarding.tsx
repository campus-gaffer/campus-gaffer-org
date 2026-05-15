import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { User, Shield, GraduationCap, CheckCircle2, ChevronRight, Loader2, Cake, Users } from "lucide-react";
import CampusLogo from "@/assets/campus-logo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Onboarding() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [teamName, setTeamName] = useState("");
    const [university, setUniversity] = useState("");
    const [age, setAge] = useState(18);
    const [gender, setGender] = useState("");
    const [error, setError] = useState("");

    // Clear any stale localStorage flag so it doesn't skip onboarding
    localStorage.removeItem("gaffer_onboarded");

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate
        if (step === 1 && (!age || age < 13)) {
            setError("You must be at least 13 to play");
            return;
        }
        if (step === 2 && username.length < 2) {
            setError("Username must be at least 2 characters");
            return;
        }
        // Check username uniqueness
        if (step === 2) {
            try {
                const res = await fetch(`${API_URL}/users`);
                const users = await res.json();
                if (Array.isArray(users) && users.some((u: any) => u.username?.toLowerCase() === username.toLowerCase())) {
                    setError("Username already taken");
                    return;
                }
            } catch { }
        }
        if (step === 3 && teamName.length < 2) {
            setError("Team name must be at least 2 characters");
            return;
        }
        // Check team name uniqueness
        if (step === 3) {
            try {
                const res = await fetch(`${API_URL}/users`);
                const users = await res.json();
                if (Array.isArray(users) && users.some((u: any) => u.team_name?.toLowerCase() === teamName.toLowerCase())) {
                    setError("Team name already taken");
                    return;
                }
            } catch { }
        }

        if (step < 4) {
            setStep(step + 1);
        } else {
            setLoading(true);
            try {
                const payload: Record<string, any> = {
                    username,
                    team_name: teamName,
                    university,
                    age,
                    gender: gender || "prefer_not_to_say",
                    email: user?.primaryEmailAddress?.emailAddress,
                    clerk_id: user?.id,
                };

                const res = await fetch(`${API_URL}/users/${user?.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to save");
                }

                localStorage.setItem("gaffer_onboarded", "true");
                setLoading(false);
                navigate("/dashboard");
            } catch (err: any) {
                console.error("Backend error:", err);
                setError(err.message || "Something went wrong");
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md space-y-12 relative z-10">

                {/* Progress Bar */}
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-white/10'}`} />
                    ))}
                </div>

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                        SET UP YOUR <span className="text-primary italic">LEGACY</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase italic">Every legend starts with a name.</p>
                </div>

                {/* Form Container */}
                <form onSubmit={handleNext} className="space-y-8 animate-in slide-in-from-bottom duration-500">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">YOUR AGE</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                        <Cake className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <input
                                        type="number"
                                        min={13}
                                        max={99}
                                        required
                                        value={age}
                                        onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                                        placeholder="18"
                                        className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">GENDER</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                        <Users className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <select
                                        required
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>SELECT</option>
                                        <option value="male">MALE</option>
                                        <option value="female">FEMALE</option>
                                        <option value="non_binary">NON-BINARY</option>
                                        <option value="prefer_not_to_say">PREFER NOT TO SAY</option>
                                    </select>
                                </div>
                            </div>

                            {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">{error}</p>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">CHOOSE USERNAME</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                        <User className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="GAFFER_99"
                                        className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                                    />
                                    {username.length > 3 && (
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <span className="text-[8px] font-black text-primary tracking-widest">AVAILABLE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">{error}</p>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">TEAM IDENTITY</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                        <Shield className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="THE INVINCIBLES"
                                        className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none uppercase"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">{error}</p>}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">SELECT UNIVERSITY</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                        <GraduationCap className="w-5 h-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                                    </div>
                                    <select
                                        required
                                        value={university}
                                        onChange={(e) => setUniversity(e.target.value)}
                                        className="w-full bg-secondary/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg font-black tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>SELECT YOUR CAMPUS</option>
                                        <option value="University of Manitoba">UNIVERSITY OF MANITOBA</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary py-6 rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 text-background animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg font-black italic text-background uppercase tracking-[0.2em]">{step === 4 ? 'FINALIZE & JOIN' : 'CONTINUE'}</span>
                                    <ChevronRight className="w-6 h-6 text-background group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="text-[10px] font-black text-slate-500 hover:text-white transition-colors tracking-widest uppercase italic"
                            >
                                ← GO BACK
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-10 flex items-center gap-2 opacity-50">
            <img src={CampusLogo} alt="Campus Gaffer" className="h-5 w-auto" />
            <span className="text-xs font-black tracking-widest">v2.4</span>
            </div>
        </div>
    );
}
