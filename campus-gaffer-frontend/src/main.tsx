import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ClerkWithRouter } from './ClerkWithRouter.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

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
