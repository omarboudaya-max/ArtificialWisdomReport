import { SAMPLE_AGENT_LOG, SAMPLE_CLASSIFICATION_CSV } from "@/lib/engine/evaluations";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (name === "classification.csv") return new Response(SAMPLE_CLASSIFICATION_CSV, { headers: { "content-type": "text/csv", "content-disposition": "attachment; filename=aw-sample-classification.csv" } });
  if (name === "agent-log.json") return new Response(SAMPLE_AGENT_LOG, { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=aw-sample-agent-log.json" } });
  return new Response("Not found", { status: 404 });
}
