export default function Footer() {
  return (
    <footer className="py-24 px-8 border-t border-white/5 bg-background relative overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-16 items-center">
          <div className="flex flex-col items-center md:items-start gap-4">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform">
                <span className="text-background font-black text-xl">C</span>
              </div>
              <h1 className="text-xl italic font-black tracking-tighter text-white uppercase bg-clip-text">
                CAMPUS <span className="text-primary italic">GAFFER</span>
              </h1>
            </a>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center md:text-left">
              Become a campus legend.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <a href="#" className="font-bold text-[10px] text-slate-500 hover:text-primary tracking-[0.2em] uppercase transition-colors">Privacy</a>
            <a href="#" className="font-bold text-[10px] text-slate-500 hover:text-primary tracking-[0.2em] uppercase transition-colors">Terms</a>
            <a href="#" className="font-bold text-[10px] text-slate-500 hover:text-primary tracking-[0.2em] uppercase transition-colors">Support</a>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="font-black text-[10px] text-slate-700 tracking-[0.3em] uppercase">
              ©2026 CG PROJECT v2.0
            </div>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
