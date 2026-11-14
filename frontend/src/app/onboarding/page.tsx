import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoMark } from "@/components/ui/Logo";
import { createOrganization } from "@/app/app/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

export const metadata = { title: "Create your workspace" };

export default async function Onboarding() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const { count } = await supabase.from("memberships").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  if (count) redirect("/app");
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <form action={createOrganization} className="card relative w-full max-w-lg animate-fade-up space-y-5 p-8">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="h-display mt-4 text-2xl font-bold">Create your assurance workspace</h1>
          <p className="mt-1 text-sm text-ink-400">Your organization&apos;s AI inventory, evidence and results stay isolated from every other tenant.</p>
        </div>
        <div><label className="label" htmlFor="name">Organization name</label><input id="name" name="name" className="input" required minLength={2} maxLength={120} placeholder="Acme Bank" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="sector">Sector</label>
            <select id="sector" name="sector" className="input">{["Financial services", "Insurance", "Healthcare", "Telecoms", "Energy", "Public sector", "Technology / SaaS", "AI developer", "Education", "Retail", "Professional services", "Other"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label" htmlFor="country">Country</label><input id="country" name="country" className="input" placeholder="Tunisia" /></div>
        </div>
        <SubmitButton className="btn-primary w-full py-3">Create workspace</SubmitButton>
      </form>
    </main>
  );
}
