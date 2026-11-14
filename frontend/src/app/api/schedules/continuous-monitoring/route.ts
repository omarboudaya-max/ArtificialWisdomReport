import { handleSchedule } from "@vercel/schedules";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminConfigured } from "@/lib/supabase/config";
import { runMonitoringSweep } from "@/lib/monitor";

export const runtime = "nodejs";
export const maxDuration = 300;

const SCHEDULE = "continuous-monitoring";
/** Skip occurrences delivered long after their slot (e.g. a backlog after an outage). */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;
/** Defence in depth: never sweep more often than this, even if a dispatch is repeated or forged. */
const MIN_INTERVAL_MS = 30 * 60 * 1000;

// Private Vercel Schedules target (schedule/v1beta trigger in vercel.json). Only Vercel's scheduler invokes it.
export const POST = handleSchedule(async (metadata) => {
  if (!isAdminConfigured()) {
    console.error(`[${SCHEDULE}] Supabase service role not configured; skipping run ${metadata.executionId}`);
    return;
  }
  if (metadata.name !== SCHEDULE) return;
  if (Date.now() - metadata.scheduledAt.getTime() > STALE_AFTER_MS) {
    console.warn(`[${SCHEDULE}] skipping stale occurrence ${metadata.executionId} scheduled ${metadata.scheduledAt.toISOString()}`);
    return;
  }
  const admin = createAdminClient();

  const { data: recent } = await admin.from("schedule_runs").select("execution_id, started_at").eq("schedule_name", SCHEDULE)
    .neq("execution_id", metadata.executionId).gte("started_at", new Date(Date.now() - MIN_INTERVAL_MS).toISOString()).limit(1);
  if (recent?.length) {
    console.warn(`[${SCHEDULE}] another run started at ${recent[0].started_at}; skipping ${metadata.executionId}`);
    return;
  }

  // Idempotency: the primary key on execution_id rejects duplicate deliveries of the same occurrence.
  const { error: claimError } = await admin.from("schedule_runs").insert({ execution_id: metadata.executionId, schedule_name: SCHEDULE, scheduled_at: metadata.scheduledAt.toISOString() });
  if (claimError) {
    if (claimError.code === "23505") return console.log(`[${SCHEDULE}] duplicate delivery of ${metadata.executionId}; already handled`);
    throw new Error(`Could not record schedule run: ${claimError.message}`);
  }

  try {
    const result = await runMonitoringSweep(admin);
    await admin.from("schedule_runs").update({ status: "completed", finished_at: new Date().toISOString(), result }).eq("execution_id", metadata.executionId);
    console.log(`[${SCHEDULE}] run ${metadata.executionId}`, result);
  } catch (e) {
    await admin.from("schedule_runs").update({ status: "failed", finished_at: new Date().toISOString(), result: { error: (e as Error).message } }).eq("execution_id", metadata.executionId);
    throw e;
  }
});
