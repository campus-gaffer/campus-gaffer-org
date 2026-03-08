import * as React from "react"
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu"
import { cn } from "../lib/utils"

export default function Navbar() {
  return (
    <header className="flex w-full items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Campus Graffer</h1>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/" className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Features</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <ListItem title="Events" href="/events">
                    Find the latest campus events and happenings.
                  </ListItem>
                  <ListItem title="Maps" href="/maps">
                    Navigate through the campus with ease.
                  </ListItem>
                  <ListItem title="Clubs" href="/clubs">
                    Join clubs and connect with your peers.
                  </ListItem>
                  <ListItem title="Resources" href="/resources">
                    Access important campus resources and links.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Sign in</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}

const ListItem = (({ className, title, children, href, ...props }: React.ComponentPropsWithoutRef<"a"> & { title: string }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
