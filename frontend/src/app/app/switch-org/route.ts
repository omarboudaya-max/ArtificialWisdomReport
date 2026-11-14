import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get("org_id") ?? "");
  const { supabase, user } = await getSession();
  const res = NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  if (user && id) {
    const { data } = await supabase.from("memberships").select("org_id").eq("org_id", id).eq("user_id", user.id).maybeSingle();
    if (data) res.cookies.set("aw_org", id, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return res;
}
