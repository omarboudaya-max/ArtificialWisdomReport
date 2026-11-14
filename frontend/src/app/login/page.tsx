import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthForm } from "./AuthForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string; error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-16">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <AuthForm initialMode={sp.mode === "signup" ? "signup" : "signin"} next={sp.next && sp.next.startsWith("/") ? sp.next : "/app"} initialError={sp.error} />
      </main>
    </>
  );
}
