import Link from "next/link";
import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { Empty, PageHeader, TierBadge } from "@/components/ui/Badges";
import { scoreColor } from "@/lib/engine/scoring";
import { revokeCredential } from "../actions";
import { CopyField } from "@/components/app/CopyField";

export const metadata = { title: "Digital Trust Passports" };

export default async function Credentials() {
  const [{ supabase, org, isAdmin }, { t }] = await Promise.all([requireOrg(), getT()]);
  const { data } = await supabase.from("credentials").select("*, ai_systems(name)").eq("org_id", org.id).order("issued_at", { ascending: false }).limit(200);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  return (
    <>
      <PageHeader eyebrow="Verifiable assessment records" title={t("pg.credentials")} subtitle="Every assessment issues a timestamped, hash-bound record. Provisional and reviewed credentials can be embedded as a live badge and verified publicly." />
      {!data?.length ? <Empty title="No credentials yet">Credentials are issued automatically when an assessment completes.</Empty> : (
        <div className="space-y-3">
          {data.map((c) => {
            const badge = `<a href="${origin}/verify/${c.code}"><img src="${origin}/api/badge/${c.code}" alt="Artificial Wisdom ${c.tier} credential" height="40"></a>`;
            return (
              <div key={c.id} className={`card p-5 ${c.status !== "active" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-display text-3xl font-bold tabular-nums" style={{ color: scoreColor(c.aw_gti != null ? Number(c.aw_gti) : null) }}>{c.aw_gti ?? "—"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{(c.ai_systems as unknown as { name: string } | null)?.name}</div>
                    <div className="font-mono text-xs text-ink-400">{c.code} · issued {new Date(c.issued_at).toLocaleDateString()} · expires {new Date(c.expires_at).toLocaleDateString()}</div>
                  </div>
                  <TierBadge tier={c.tier} />
                  <span className={`chip ${c.status === "active" ? "border-emerald-500/30 text-emerald-300" : "border-fg/10 text-ink-400"}`}>{c.status}</span>
                  <Link href={`/verify/${c.code}`} target="_blank" className="btn-ghost px-2"><ExternalLink size={15} /></Link>
                </div>
                {c.status === "active" && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/badge/${c.code}`} alt="badge preview" height={40} className="h-10" />
                    <CopyField value={badge} label="Embed code" />
                    {isAdmin && (
                      <form action={revokeCredential} className="flex gap-2"><input type="hidden" name="id" value={c.id} /><input name="reason" className="input py-1.5 text-xs" placeholder="Revocation reason" /><button className="btn-danger py-1.5 text-xs">Revoke</button></form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
