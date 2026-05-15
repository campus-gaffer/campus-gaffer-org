import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import NavBar from '@/components/NavBar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import Dashboard from '@/pages/Dashboard'
import Leagues from '@/pages/Leagues'
// import Transfers from '@/pages/Transfers'
import Scores from '@/pages/Scores'
import Rules from '@/pages/Rules'
import MatchDetail from '@/pages/MatchDetail'
import About from '@/pages/About'
import Rewards from '@/pages/Rewards'
import PlayerProfile from '@/pages/PlayerProfile'
import Onboarding from '@/pages/Onboarding'
import Profile from '@/pages/Profile'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import Support from '@/pages/Support'
import Teams from '@/pages/Teams'

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/" replace /></SignedOut>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-background font-sans">
        <Routes>
          <Route path="/" element={
            <>
              <SignedOut><LandingPage /></SignedOut>
              <SignedIn>
                {localStorage.getItem('gaffer_onboarded') === 'true'
                  ? <Navigate to="/dashboard" replace />
                  : <Navigate to="/onboarding" replace />
                }
              </SignedIn>
            </>
          } />

          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
          {/* <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} /> */}
          <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/about" element={<About />} />
          <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:clerk_id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/player/:id" element={<ProtectedRoute><PlayerProfile /></ProtectedRoute>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/teams" element={<Teams />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
