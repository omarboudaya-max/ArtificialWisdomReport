"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";
import { LogoMark } from "@/components/ui/Logo";

export function AuthForm({ initialMode, next, initialError }: { initialMode: "signin" | "signup"; next: string; initialError?: string }) {
  const { t } = useT();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(initialError ? { kind: "error", text: initialError } : null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) { router.push(next); router.refresh(); return; }
        setMsg({ kind: "ok", text: t("auth.checkEmail") });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next); router.refresh();
      }
    } catch (err) {
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function magic() {
    if (!email) { setMsg({ kind: "error", text: "Enter your email first." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    setMsg(error ? { kind: "error", text: error.message } : { kind: "ok", text: "Magic link sent — check your inbox." });
  }

  return (
    <div className="card relative w-full max-w-md animate-fade-up p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="h-display mt-4 text-2xl font-bold">{mode === "signup" ? t("auth.signup") : t("auth.signin")}</h1>
        <p className="mt-1 text-sm text-ink-400">Artificial Wisdom assurance workspace</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <div><label className="label" htmlFor="name">{t("auth.name")}</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></div>
        )}
        <div><label className="label" htmlFor="email">{t("auth.email")}</label><input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
        <div><label className="label" htmlFor="password">{t("auth.password")}</label><input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>
        {msg && <div className={`rounded-xl border px-3 py-2.5 text-sm ${msg.kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>{msg.text}</div>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}{mode === "signup" ? t("auth.signup") : t("auth.signin")}</button>
      </form>
      <button onClick={magic} disabled={busy} className="btn-secondary mt-3 w-full"><Mail size={15} /> {t("auth.magic")}</button>
      <p className="mt-6 text-center text-sm text-ink-400">
        {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
        <button className="font-semibold text-brand-300 hover:text-fg" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg(null); }}>
          {mode === "signup" ? t("auth.signin") : t("auth.signup")}
        </button>
      </p>
    </div>
  );
}
