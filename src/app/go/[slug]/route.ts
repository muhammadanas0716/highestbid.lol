import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/** Outbound click tracker: count it, then bounce them to the listing. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  const db = supabaseAdmin();
  const { data } = await db
    .from("listings")
    .select("url")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (!data?.url) {
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  const { error } = await db.rpc("register_click", { p_slug: slug });
  if (error) console.error("[go] register_click failed", error.message);

  return NextResponse.redirect(data.url, { status: 302 });
}
