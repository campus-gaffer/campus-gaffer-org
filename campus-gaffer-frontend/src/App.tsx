import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import NavBar from '@/components/NavBar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import Dashboard from '@/pages/Dashboard'
import Leagues from '@/pages/Leagues'
import Transfers from '@/pages/Transfers'
import Fixtures from '@/pages/Fixtures'
import Rules from '@/pages/Rules'

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
        <Routes>
          <Route path="/" element={
            <>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          } />

          <Route path="/dashboard" element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } />

          <Route path="/leagues" element={
            <>
              <SignedIn>
                <Leagues />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } />

          <Route path="/transfers" element={
            <>
              <SignedIn>
                <Transfers />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } />

          <Route path="/fixtures" element={
            <>
              <SignedIn>
                <Fixtures />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } />

          <Route path="/rules" element={
            <>
              <SignedIn>
                <Rules />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
