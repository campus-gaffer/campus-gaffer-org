import { useState } from "react";
import Navbar from "@/components/NavBar";
import { Mail, Send, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

export default function Support() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Something went wrong. Try again later.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Navbar />
      <main className="container mx-auto px-6 md:px-12 py-20 max-w-2xl">
        <div className="flex items-center gap-3 mb-10">
          <Mail className="w-6 h-6 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight">Contact Us</h1>
        </div>

        {sent ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
            <p className="text-xl font-bold text-white mb-2">Message Sent</p>
            <p className="text-slate-400 text-sm">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                placeholder="you@university.ca"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="Tell us more..."
              />
            </div>
            {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 bg-primary text-background font-bold px-8 py-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {sending ? "SENDING..." : "SEND MESSAGE"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
