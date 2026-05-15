import Navbar from "@/components/NavBar";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Navbar />
      <main className="container mx-auto px-6 md:px-12 py-20 max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">Terms of Service</h1>
        </div>
        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>Last updated: May 2026</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">1. Acceptance</h2>
          <p>By using Campus Gaffer, you agree to these terms. If you do not agree, do not use the platform.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">2. Eligibility</h2>
          <p>You must be a university student to participate. You are responsible for providing accurate information during registration.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">3. Fair Play</h2>
          <p>Manipulating the platform, exploiting bugs, or using automated tools to gain an unfair advantage is prohibited. We reserve the right to suspend accounts that violate fair play.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">4. Intellectual Property</h2>
          <p>The Campus Gaffer name, logo, and platform design are our intellectual property. You may not copy or reproduce them without permission.</p>
          <h2 className="text-white font-bold text-base uppercase tracking-wide mt-8">5. Limitation of Liability</h2>
          <p>Campus Gaffer is provided as-is. We are not responsible for any losses arising from use of the platform, including fantasy points, rankings, or in-game decisions.</p>
        </div>
      </main>
    </div>
  );
}
