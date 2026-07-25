import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

// Bridge Clerk's navigation to react-router. Without this, Clerk falls back to
// hard `window.location` redirects (e.g. after sign-in → `/home`, or the OAuth
// SSO callback), which become full HTTP requests. On a static SPA host like
// Vercel those requests 404 unless every path is rewritten to index.html — so
// keeping Clerk's redirects client-side avoids that class of failure entirely.
//
// `signInUrl`/`signUpUrl` point Clerk's own redirects (e.g. RedirectToSignIn on
// a protected route while signed out) at our custom `/login` page rather than
// Clerk's hosted Account Portal.
export function ClerkWithRouter({ publishableKey, children }: { publishableKey: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/login"
      signUpUrl="/login"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}
