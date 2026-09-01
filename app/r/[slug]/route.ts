import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/lib/supabase";

/** Always run this handler dynamically — it depends on request params and DB data. */
export const dynamic = 'force-dynamic';

/**
 * Asynchronously records a QR code scan in the `qr_analytics` table.
 *
 * This is a fire-and-forget helper — it is NEVER awaited by the redirect
 * handler so the visitor is redirected as quickly as possible.  All errors
 * are caught and logged internally; they will never propagate.
 */
async function recordScan(qrId: string, userAgent: string): Promise<void> {
  const deviceOs = new UAParser(userAgent).getOS().name ?? "Unknown";

  const { error } = await supabase.from("qr_analytics").insert({
    qr_id: qrId,
    device_os: deviceOs,
  });

  if (error) {
    console.error("Failed to record QR scan analytics:", error.message);
  }
}

/**
 * GET /r/[slug]
 *
 * Dynamic QR redirect endpoint.
 *
 * When a visitor scans a dynamic QR code their browser hits this URL.
 * The handler:
 *   1. Looks up the target URL associated with the slug.
 *   2. Validates the URL.
 *   3. Asynchronously records the scan in `qr_analytics`.
 *   4. Returns an HTTP 302 redirect to the target URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // In Next.js 15+ segment params are async (Promises), so we must await.
  const { slug } = await params;

  // -------------------------------------------------------------------------
  // 1. Look up the QR code by slug.
  //    Only active codes are visible through the RLS "public read" policy.
  // -------------------------------------------------------------------------
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("id, target_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  // If the QR code does not exist or is inactive/disabled,
  // redirect cleanly to the "inactivo" informational page.
  if (error || !qrCode) {
    redirect('/qr-inactivo')
  }

  // -------------------------------------------------------------------------
  // 2. Validate the target URL before redirecting.
  // -------------------------------------------------------------------------
  let targetUrl: URL;
  try {
    targetUrl = new URL(qrCode.target_url);
  } catch {
    return NextResponse.json(
      { error: "Invalid target URL configured for this QR code" },
      { status: 500 }
    );
  }

  // -------------------------------------------------------------------------
  // 3. Record the scan asynchronously (fire-and-forget).
  //
  //    `void` discards the returned Promise so the handler can return the
  //    redirect immediately.  Errors are swallowed inside `recordScan`
  //    so they can never break the redirect.
  //
  //    In a serverless environment the request context may be frozen before
  //    the insert completes, so this is a best-effort analytics capture
  //    suitable for an MVP.
  // -------------------------------------------------------------------------
  const userAgent = request.headers.get("user-agent") || "";
  void recordScan(qrCode.id, userAgent);

  // -------------------------------------------------------------------------
  // 4. Return an HTTP 302 (Found) redirect to the target URL.
  // -------------------------------------------------------------------------
  return NextResponse.redirect(targetUrl, 302);
}
