import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/lib/supabase";

/**
 * Always run this handler dynamically — it depends on request params and DB data.
 */
export const dynamic = "force-dynamic";

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
 * GET /r/[id]
 *
 * Dynamic QR redirect endpoint.
 *
 * When a visitor scans a dynamic QR code their browser hits this URL.
 * The handler:
 *   1. Looks up the QR code by its `id`.
 *   2. Validates `is_active` and `subscription_status`.
 *   3. Asynchronously records the scan in `qr_analytics`.
 *   4. Returns an HTTP 302 redirect to `target_url`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15+ segment params are Promises, so we must await.
  const { id } = await params;

  // -------------------------------------------------------------------------
  // 1. Look up the QR code by id, checking both manual-pause and subscription state.
  // -------------------------------------------------------------------------
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("target_url, is_active, subscription_status")
    .eq("id", id)
    .single();

  // If the QR code does not exist at all, redirect to the 404 page.
  if (error || !qrCode) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  // If the QR code is paused (is_active === false) or the subscription is
  // not active, redirect to the disabled / inactivo landing page.
  if (qrCode.is_active === false || qrCode.subscription_status !== "active") {
    return NextResponse.redirect(
      new URL(`/qr-disabled?id=${id}`, request.url)
    );
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
  // -------------------------------------------------------------------------
  const userAgent = request.headers.get("user-agent") || "";
  void recordScan(id, userAgent);

  // -------------------------------------------------------------------------
  // 4. Return an HTTP 302 (Found) redirect to the target URL.
  // -------------------------------------------------------------------------
  return NextResponse.redirect(targetUrl, 302);
}