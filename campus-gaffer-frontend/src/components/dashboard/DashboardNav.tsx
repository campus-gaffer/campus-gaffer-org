import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import logo from "@/assets/CG-updated.png";

const NAVIGATION_LINKS = [
  { name: 'My Team', href: '/dashboard' },
  { name: 'Leagues', href: '/leagues' },
  { name: 'Transfers', href: '/transfers' },
  { name: 'Fixtures', href: '/fixtures' },
  { name: 'Rules', href: '/rules' },
];

export default function DashboardNav() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="block">
            <img src={logo} alt="Campus Gaffer" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {NAVIGATION_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-[11px] font-mono tracking-[0.2em] uppercase text-zinc-400 hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-mono text-zinc-500 leading-none mb-1 uppercase">Manager</p>
                <p className="text-xs font-bold leading-none uppercase">{user?.fullName || 'Gaffer'}</p>
              </div>
              <UserButton appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10 rounded-none border border-primary shadow-[0_0_10px_rgba(255,22,68,0.3)]"
                }
              }} />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
