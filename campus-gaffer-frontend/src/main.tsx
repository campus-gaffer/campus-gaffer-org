import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {ClerkProvider} from '@clerk/clerk-react'

const PUBLISHER_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHER_KEY){
  throw new Error("Missing Publishable Key");
  
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHER_KEY} afterSignOutUrl="/" signInFallbackRedirectUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
