import Link from "next/link";
import { CheckCircle2, Circle, Database } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Setup" };

export default function SetupPage() {
  const items = [
    { ok: isSupabaseConfigured(), label: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY", hint: "Supabase → Project Settings → API" },
    { ok: isAdminConfigured(), label: "SUPABASE_SERVICE_ROLE_KEY (server only)", hint: "Required to write assessment results, credentials and evidence securely" },
    { ok: !!process.env.GROQ_API_KEY, label: "GROQ_API_KEY (optional)", hint: "Enables the reference sandbox model and the Compliance Copilot" },
  ];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8">
          <Database className="text-brand-300" />
          <h1 className="h-display mt-4 text-2xl font-bold">Connect Supabase to activate the platform</h1>
          <p className="mt-2 text-sm text-ink-300">The public site and free quick scan work without a database. The assurance workspace needs Supabase.</p>
          <ol className="mt-6 space-y-3 text-sm">
            <li><b>1.</b> Run the SQL files in <code className="rounded bg-white/10 px-1.5 py-0.5">supabase/migrations/</code> (in order) in the Supabase SQL editor.</li>
            <li><b>2.</b> In Supabase → Authentication → URL configuration, set the Site URL to your domain and add <code className="rounded bg-white/10 px-1.5 py-0.5">/auth/callback</code> to redirect URLs.</li>
            <li><b>3.</b> Add these environment variables in Vercel → Project → Settings → Environment Variables, then redeploy:</li>
          </ol>
          <ul className="mt-4 space-y-2">
            {items.map((i) => (
              <li key={i.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                {i.ok ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-400" /> : <Circle size={18} className="mt-0.5 text-ink-500" />}
                <div><div className="font-mono text-xs">{i.label}</div><div className="text-xs text-ink-400">{i.hint}</div></div>
              </li>
            ))}
          </ul>
          <Link href="/" className="btn-secondary mt-6">Back to site</Link>
        </div>
      </main>
    </>
  );
}
