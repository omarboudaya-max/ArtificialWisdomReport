import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { Empty, PageHeader } from "@/components/ui/Badges";
import { AssessRunner } from "@/components/app/AssessRunner";

export const metadata = { title: "Run assessment" };

export default async function Assess({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const { system } = await searchParams;
  const [{ supabase, org, canEdit }, { t }] = await Promise.all([requireOrg(), getT()]);
  const { data: systems } = await supabase.from("ai_systems").select("id, name, system_type, url, provider, model_name, endpoint_url").eq("org_id", org.id).order("name");
  return (
    <>
      <PageHeader eyebrow={t("as.eyebrow")} title={t("as.title")} subtitle={t("as.subtitle")} />
      {!canEdit ? (
        <Empty title="Auditors cannot initiate assessments">Separation of duties: assessments are initiated by the system owner and reviewed independently.</Empty>
      ) : !systems?.length ? (
        <Empty title="Register a system first"><Link href="/app/systems/new" className="btn-primary mt-3">Register AI system</Link></Empty>
      ) : (
        <AssessRunner systems={systems} initialSystem={system ?? systems[0].id} referenceAvailable={!!process.env.GROQ_API_KEY} />
      )}
    </>
  );
}
