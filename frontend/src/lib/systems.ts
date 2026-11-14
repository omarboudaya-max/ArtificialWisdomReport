import "server-only";
import { notFound } from "next/navigation";
import { requireOrg } from "./session";

export async function loadSystem(id: string) {
  const ctx = await requireOrg();
  const { data } = await ctx.supabase.from("ai_systems").select("*").eq("id", id).eq("org_id", ctx.org.id).maybeSingle();
  if (!data) notFound();
  return { ...ctx, system: data };
}
