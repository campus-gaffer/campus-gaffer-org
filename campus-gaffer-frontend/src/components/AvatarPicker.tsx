import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

const AVATARS = [
  "", // None / initial letter
  "avataaars", "avataaars-neutral", "bottts", "bottts-neutral",
  "fun-emoji", "icons", "lorelei", "lorelei-neutral",
  "notionists", "notionists-neutral", "open-peeps", "personas",
  "pixel-art", "pixel-art-neutral", "rings", "thumbs",
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8082";

type Props = {
  currentAvatar: string;
  clerkId: string;
  onClose: () => void;
  onSaved: (seed: string) => void;
};

export default function AvatarPicker({ currentAvatar, clerkId, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/${clerkId}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: selected }),
      });
      if (res.ok) {
        onSaved(selected);
        onClose();
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80" onClick={onClose}>
      <div
        className="bg-card border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 text-center">Choose Avatar</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {AVATARS.map((seed) => {
            const isSelected = selected === seed;
            return (
              <button
                key={seed || "none"}
                onClick={() => setSelected(seed)}
                className={`relative rounded-2xl border-2 p-2 transition-all hover:scale-105 ${
                  isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {seed ? (
                  <img
                    src={`https://api.dicebear.com/7.x/${seed}/svg?seed=${clerkId}`}
                    alt={seed}
                    className="w-full aspect-square rounded-xl"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-500">?</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-background" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selected === currentAvatar}
            className="flex-1 py-4 bg-primary text-background rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
