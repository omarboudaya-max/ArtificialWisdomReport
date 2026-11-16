"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

interface Message { role: "user" | "assistant"; content: string }

const GREETING: Record<string, string> = {
  en: "Hello — I'm the Artificial Wisdom Compliance Copilot. Ask me about the EU AI Act, ISO/IEC 42001, your AW-GTI score or how to fix a finding.",
  fr: "Bonjour — je suis le Copilote conformité d'Artificial Wisdom. Posez-moi vos questions sur l'AI Act, l'ISO/IEC 42001 ou votre score AW-GTI.",
  ar: "مرحبًا — أنا مساعد الامتثال في «الحكمة الاصطناعية». اسألني عن قانون الذكاء الاصطناعي الأوروبي أو ISO/IEC 42001 أو مؤشر AW-GTI.",
};
const SUGGESTIONS = ["Is my chatbot high-risk under the EU AI Act?", "How is the AW-GTI calculated?", "How do I fix prompt-injection findings?", "What's the difference between a provisional credential and certification?"];

export default function Chatbot() {
  const { locale } = useT();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  if (path?.startsWith("/verify")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 end-5 z-50 print:hidden">
      {open && (
        <div className="card mb-3 flex h-[min(560px,75dvh)] w-[min(380px,calc(100vw-2.5rem))] animate-fade-up flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-fg/[0.06] bg-brand-500/10 px-4 py-3">
            <div className="flex items-center gap-2"><Bot size={18} className="text-brand-300" /><div><div className="text-sm font-semibold">Compliance Copilot</div><div className="text-[10px] text-ink-400">AI assistant · may make mistakes · not legal advice</div></div></div>
            <button onClick={() => setOpen(false)} className="btn-ghost px-1.5 py-1" aria-label="Close"><X size={16} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <div className="rounded-2xl rounded-ss-sm bg-fg/[0.05] px-3 py-2" dir="auto">{GREETING[locale] ?? GREETING.en}</div>
            {!messages.length && (
              <div className="flex flex-wrap gap-1.5">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-fg/10 px-2.5 py-1 text-xs text-ink-300 hover:bg-fg/[0.05]">{s}</button>)}</div>
            )}
            {messages.map((m, i) => (
              <div key={i} dir="auto" className={`whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === "user" ? "ms-8 rounded-se-sm bg-brand-500/25" : "me-4 rounded-ss-sm bg-fg/[0.05]"}`}>{m.content}</div>
            ))}
            {loading && <div className="flex items-center gap-2 text-xs text-ink-400"><Loader2 size={13} className="animate-spin" /> Thinking…</div>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-fg/[0.06] p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="input py-2" placeholder="Ask about compliance, scores, fixes…" dir="auto" />
            <button className="btn-primary px-3" disabled={loading || !input.trim()} aria-label="Send"><Send size={15} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="ms-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-[0_10px_30px_-8px_rgb(99_102_241/0.8)] transition hover:scale-105" aria-label="Open Compliance Copilot">
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </div>
  );
}
