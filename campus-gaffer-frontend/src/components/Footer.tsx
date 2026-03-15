import logo from "@/assets/CG-updated.png"

export default function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 bg-background relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
        <div className="flex items-center">
          <a href="/">
            <img src={logo} alt="Campus Gaffer Logo" className="w-80 h-28 object-contain opacity-80 hover:opacity-100 transition-opacity" />
          </a>
        </div>
        
        <div className="flex gap-10">
          <a href="#" className="font-mono text-[10px] text-zinc-600 hover:text-primary tracking-[0.3em] uppercase transition-colors">PRIVACY POLICY</a>
          <a href="#" className="font-mono text-[10px] text-zinc-600 hover:text-primary tracking-[0.3em] uppercase transition-colors">TERMS OF SERVICE</a>
          <a href="#" className="font-mono text-[10px] text-zinc-600 hover:text-primary tracking-[0.3em] uppercase transition-colors">CONTACT ADMIN</a>
        </div>
        
        <div className="font-mono text-[10px] text-zinc-800 tracking-[0.3em]">
          ©2026 CG PROJECT v1.0.0
        </div>
      </div>
    </footer>
  )
}
