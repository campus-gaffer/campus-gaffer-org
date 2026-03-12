import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FooterActions() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40 bg-black/60 backdrop-blur-xl p-4 border border-white/10 rounded-full shadow-2xl">
      <Button 
        variant="crimson" 
        className="rounded-full px-8 h-12 shadow-[0_0_20px_rgba(225,29,72,0.4)] font-bold italic tracking-tighter"
        onClick={() => navigate("/transfers")}
      >
        MAKE TRANSFERS
      </Button>
      <Button 
        variant="crimsonOutline" 
        className="rounded-full px-8 h-12 font-bold italic tracking-tighter text-white border-primary"
        onClick={() => navigate("/fixtures")}
      >
        VIEW FIXTURES
      </Button>
    </div>
  );
}
