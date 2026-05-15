import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import CampusLogo from "@/assets/campus-logo.png"
import { DollarSign } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const { user } = useUser();
  const location = useLocation();
  const [userBudget, setUserBudget] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8082"}/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.budget) setUserBudget(data.budget);
      })
      .catch(() => {});
  }, [user]);

  const navLinkClass = (path: string) =>
    cn(
      navigationMenuTriggerStyle(),
      "bg-transparent font-bold text-xs tracking-[0.2em] uppercase transition-all px-4 h-10 rounded-none border-b-2",
      location.pathname === path
        ? "text-primary border-primary shadow-[0_4px_10px_-4px_rgba(139,92,246,0.5)]"
        : "text-slate-400 hover:text-white border-transparent hover:border-white/20"
    );

  return (
    <header className="flex w-full items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl sticky top-0 z-50 h-24 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-16">
        <SignedIn>
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <img src={CampusLogo} alt="Campus Gaffer" className="h-24 w-auto" />
          </Link>
        </SignedIn>
        <SignedOut>
          <Link to="/" className="flex items-center gap-2 group">
            <img src={CampusLogo} alt="Campus Gaffer" className="h-24 w-auto" />
          </Link>
        </SignedOut>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-6">
            <SignedIn>
              <NavigationMenuItem>
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  HOME
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/scores" className={navLinkClass("/scores")}>
                  SCORES
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/profile" className={navLinkClass("/profile")}>
                  PROFILE
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/support" className={navLinkClass("/support")}>
                  CONTACT
                </Link>
              </NavigationMenuItem>
            </SignedIn>
            <SignedOut>
              <NavigationMenuItem>
                <Link to="/about" className={navLinkClass("/about")}>
                  ABOUT
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/teams" className={navLinkClass("/teams")}>
                  TEAMS
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/rules" className={navLinkClass("/rules")}>
                  RULES
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/support" className={navLinkClass("/support")}>
                  CONTACT
                </Link>
              </NavigationMenuItem>
            </SignedOut>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0 h-12">
        <SignedOut>
          <div className="hidden md:flex">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="outline" size="sm" className="font-bold tracking-widest px-8">
                LOGIN
              </Button>
            </SignInButton>
          </div>
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <Button size="sm" className="hidden md:flex font-bold tracking-widest px-8">
              JOIN NOW
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-4">
            {userBudget !== null && (
              <div className="hidden md:flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2">
                <DollarSign className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-white">£{userBudget.toFixed(1)}M</span>
              </div>
            )}
            <UserButton appearance={{
              elements: {
                userButtonAvatarBox: "w-12 h-12 rounded-xl border-2 border-primary/50 hover:border-primary transition-colors shadow-lg shadow-primary/20"
              }
            }} />
          </div>
        </SignedIn>
      </div>
    </header>
  );
}
