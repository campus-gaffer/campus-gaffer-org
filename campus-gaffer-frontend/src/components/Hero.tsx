import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { ArrowRight, BadgeCheck, Swords, Zap } from "lucide-react";
import HeroVisual from "./HeroVisual";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Hero() {
  useEffect(() => {
    fetch(API_URL + "/leaderboard").catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 px-6 md:px-12 bg-background">
      {/* Dotted grid pattern — very faint */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#8B5CF6 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Single large spotlight */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-violet-500/[0.04] blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 relative z-10 items-center">
        {/* LEFT — Text content */}
        <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
          {/* Product descriptor */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full w-fit">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-400 font-semibold text-[10px] tracking-wide uppercase">
              Fantasy Intramural Sports
            </span>
          </div>

          {/* Main heading */}
          <div className="space-y-3">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.92] tracking-tight text-white uppercase">
              OWN
              <br />
              THE
              <br />
              <span className="text-violet-400">
                CAMPUS
              </span>
            </h1>
          </div>

          {/* Subtitle — clear concept */}
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl border-l-[3px] border-violet-500/50 pl-6 py-1">
            Draft real students from your intramural leagues. Compete on campus.
            Climb the leaderboard.{" "}
            <span className="text-violet-300 font-semibold">
              Become a campus legend.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <Button className="font-semibold tracking-wide px-8 h-16 text-base bg-violet-600 text-white hover:bg-violet-500 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-all hover:scale-[1.02] active:scale-95 flex gap-3 items-center group cursor-pointer">
                <Swords className="w-5 h-5" />
                START YOUR SEASON
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignInButton>
            <Button
              variant="outline"
              onClick={() =>
                document
                  .getElementById("features-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="font-semibold tracking-wide px-8 h-16 text-base border border-white/20 hover:border-violet-500/50 hover:bg-violet-500/5 rounded-xl transition-all cursor-pointer"
            >
              HOW IT WORKS
            </Button>
          </div>

          {/* Stats — clean and minimal */}
          <div className="flex items-center gap-8 pt-6 border-t border-white/[0.04]">
            {[
              { value: "$0", label: "ENTRY FEE", icon: BadgeCheck },
              { value: "50+", label: "UNIVERSITIES", icon: ArrowRight },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 group cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 tracking-wide uppercase">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Hero Visual */}
        <div className="relative flex items-center justify-center animate-in fade-in zoom-in slide-in-from-right-12 duration-1000 delay-200">
          <HeroVisual />
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
        <span className="text-[7px] font-semibold text-slate-600 tracking-wide uppercase">
          SCROLL
        </span>
        <div className="w-4 h-7 rounded-full border-2 border-slate-700 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-violet-500 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
