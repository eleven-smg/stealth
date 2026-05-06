import { motion, AnimatePresence } from "framer-motion";
import { Search, Inbox, Star, Pencil, Settings, Archive, Send } from "lucide-react";
import { useEffect, useState } from "react";

const items = [
  { icon: Pencil, label: "Compose new email", hint: "⌘N" },
  { icon: Inbox, label: "Go to Inbox", hint: "G I" },
  { icon: Star, label: "Go to Starred", hint: "G S" },
  { icon: Send, label: "Go to Sent", hint: "G T" },
  { icon: Archive, label: "Archive thread", hint: "E" },
  { icon: Settings, label: "Open settings", hint: "," },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (!open) setQ(""); }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const filtered = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-strong fixed left-1/2 top-24 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command or search…"
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.map((it) => (
                <li key={it.label}>
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90 transition hover:bg-white/[0.06]">
                    <it.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{it.label}</span>
                    <span className="ml-auto rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{it.hint}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</li>
              )}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
