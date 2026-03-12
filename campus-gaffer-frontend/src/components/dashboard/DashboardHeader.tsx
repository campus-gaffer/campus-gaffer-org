import { useUser } from '@clerk/clerk-react';

export default function DashboardHeader() {
  const { user } = useUser();

  return (
    <div className="text-center mb-10">
      <div className="inline-block px-4 py-1 bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] tracking-[0.3em] uppercase mb-4">
        GW5 SQUAD
      </div>
      <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        {user?.firstName ? `${user.firstName.toUpperCase()}'S XI` : 'CAMPUS LEGENDS'}
      </h1>
    </div>
  );
}
