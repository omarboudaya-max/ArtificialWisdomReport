import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Verify a credential" };

async function go(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  redirect(`/verify/${encodeURIComponent(code)}`);
}

export default async function VerifyLookup() {
  const { t } = await getT();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center px-4 py-16">
        <form action={go} className="card space-y-4 p-8 text-center">
          <BadgeCheck size={40} className="mx-auto text-brand-300" />
          <h1 className="h-display text-2xl font-bold">{t("verify.title")}</h1>
          <p className="text-sm text-ink-300">{t("verify.subtitle")}</p>
          <input name="code" required pattern="AW-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}" placeholder="AW-XXXX-XXXX-XXXX" dir="ltr" className="input text-center font-mono text-lg uppercase tracking-widest" />
          <button className="btn-primary w-full py-3">{t("verify.cta")}</button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
