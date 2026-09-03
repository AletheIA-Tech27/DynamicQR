import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

async function recordScan(qrId: string, userAgent: string): Promise<void> {
  try {
    const deviceOs = new UAParser(userAgent).getOS().name ?? "Unknown";
    await supabase.from("qr_analytics").insert({
      qr_id: qrId,
      device_os: deviceOs,
    });
  } catch (err) {
    console.error("Error al registrar analíticas:", err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Consulta en tiempo real a Supabase por ID
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("target_url, is_active, subscription_status")
    .eq("id", id)
    .single();

  // Si no existe o falla Supabase -> /404
  if (error || !qrCode) {
    return NextResponse.redirect(new URL("/404", request.url), {
      headers: NO_CACHE_HEADERS,
    });
  }

  // 2. Validación de estado -> /qr-disabled
  if (qrCode.is_active === false || qrCode.subscription_status !== "active") {
    return NextResponse.redirect(
      new URL(`/qr-disabled?id=${id}`, request.url),
      {
        status: 302,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  // 3. Normalización de URL
  let rawUrl = qrCode.target_url;
  if (!rawUrl) {
    return NextResponse.redirect(
      new URL(`/qr-disabled?id=${id}`, request.url),
      { status: 302, headers: NO_CACHE_HEADERS }
    );
  }

  let finalDestination = rawUrl.trim();
  if (!finalDestination.startsWith("http://") && !finalDestination.startsWith("https://")) {
    finalDestination = `https://${finalDestination}`;
  }

  // 4. Analíticas asíncronas
  const userAgent = request.headers.get("user-agent") || "";
  void recordScan(id, userAgent);

  // 5. Redirección final sin caché
  return NextResponse.redirect(finalDestination, {
    status: 302,
    headers: NO_CACHE_HEADERS,
  });
}