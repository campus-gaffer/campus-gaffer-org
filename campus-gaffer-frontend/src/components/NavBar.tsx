import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button"
import logo from "@/assets/CG-updated.png"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

export default function Navbar() {
  return (
    <header className="flex w-full items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 h-20">
      <div className="flex items-center gap-12">
        <div className="flex items-center relative h-full w-80">
          <a href="/" className="block">
            <img src={logo} alt="Campus Gaffer Logo" className="w-80 h-28 object-contain absolute left-0 top-1/2 -translate-y-1/2 drop-shadow-[0_0_20px_rgba(255,22,68,0.25)]" />
          </a>
        </div>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-6">
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="/leagues" 
                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-foreground/80 hover:text-primary font-mono text-xs tracking-widest uppercase transition-all")}
              >
                LEAGUES
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="/rules" 
                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-foreground/80 hover:text-primary font-mono text-xs tracking-widest uppercase transition-all")}
              >
                RULES
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="/about" 
                className={cn(navigationMenuTriggerStyle(), "bg-transparent text-foreground/80 hover:text-primary font-mono text-xs tracking-widest uppercase transition-all")}
              >
                ABOUT
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="crimsonOutline" size="sm" className="font-mono px-6 border-primary text-primary hover:shadow-[0_0_15px_rgba(255,22,68,0.4)]">
              LOGIN
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton appearance={{
            elements: {
              userButtonAvatarBox: "w-14 h-14 rounded-none border border-primary shadow-[0_0_20px_rgba(255,22,68,0.4)]"
            }
          }} />
        </SignedIn>
      </div>
    </header>
  );
}
