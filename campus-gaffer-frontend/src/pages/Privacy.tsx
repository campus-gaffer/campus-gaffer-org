import Navbar from "@/components/NavBar";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Navbar />
      <main className="container mx-auto px-6 md:px-12 py-20 max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">Privacy Policy</h1>
        </div>
        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>Last updated: May 2026</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">1. Information We Collect</h2>
          <p>When you sign up for Campus Gaffer, we collect your name, email address, university affiliation, and basic profile information via Clerk authentication. We also store your squad selections, points, and leaderboard rankings to provide the fantasy sports experience.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">2. How We Use Your Data</h2>
          <p>Your data is used to operate the fantasy sports platform, display leaderboards, calculate points, and match you against other players in your university league. We do not sell your personal information.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">3. Data Storage</h2>
          <p>Your data is stored securely on Neon Postgres with encrypted connections. Authentication is handled by Clerk, which follows industry-standard security practices.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">4. Contact</h2>
          <p>For privacy-related questions, email us at privacy@campusgaffer.com or use the contact form on our Support page.</p>
        </div>
      </main>
    </div>
  );
}
