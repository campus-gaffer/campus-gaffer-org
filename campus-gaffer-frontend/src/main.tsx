import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

// Bridge Clerk's navigation to react-router. Without this, Clerk falls back to
// hard `window.location` redirects (e.g. after sign-in → `/home`, or the OAuth
// SSO callback), which become full HTTP requests. On a static SPA host like
// Vercel those requests 404 unless every path is rewritten to index.html — so
// keeping Clerk's redirects client-side avoids that class of failure entirely.
function ClerkWithRouter({ publishableKey, children }: { publishableKey: string; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}

const root = createRoot(document.getElementById('root')!)

if (!clerkPublishableKey) {
  root.render(
    <StrictMode>
      <div style={{ padding: 24, color: '#fff', background: '#10151f', minHeight: '100vh', fontFamily: "'JetBrains Mono', monospace" }}>
        Missing `VITE_CLERK_PUBLISHABLE_KEY`.
      </div>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ClerkWithRouter publishableKey={clerkPublishableKey}>
          <App />
        </ClerkWithRouter>
      </BrowserRouter>
    </StrictMode>,
  )
}
