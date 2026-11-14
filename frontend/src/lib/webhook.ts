import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertPublicHost } from "./engine/net";

/** Posts a Slack/Teams-compatible JSON payload to the organization's alert webhook, if configured. */
export async function notifyWebhook(admin: SupabaseClient, orgId: string, text: string) {
  try {
    const { data } = await admin.from("organizations").select("alert_webhook_url").eq("id", orgId).maybeSingle();
    const url = data?.alert_webhook_url;
    if (!url) return;
    const u = new URL(url);
    if (u.protocol !== "https:") return;
    await assertPublicHost(u.hostname);
    await fetch(u, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `[Artificial Wisdom] ${text}`, source: "artificial-wisdom" }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* alerts are best-effort */
  }
}
