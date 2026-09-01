import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/lib/supabase";

/** Always run this handler dynamically — it depends on request params and DB data. */
export const dynamic = 'force-dynamic';

/**
 * Registra el escaneo de forma asíncrona (fire-and-forget).
 */
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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Consultar el QR por slug
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Si hay error en la consulta o el QR no existe / no está activo
  if (error || !qrCode) {
    console.error(`[QR Error] Slug no encontrado o error RLS para: '${slug}'`, error);
    redirect('/qr-inactivo');
  }

  // Verificar estado activo (soporta 'is_active' o 'active')
  const isActive = qrCode.is_active ?? qrCode.active ?? true;
  if (!isActive) {
    redirect('/qr-inactivo');
  }

  // 2. Extraer la URL de destino (Soporta 'target_url' o 'destination_url')
  let rawUrl = qrCode.target_url || qrCode.destination_url || qrCode.url_destino;

  if (!rawUrl) {
    console.error(`[QR Error] El QR '${slug}' no tiene URL de destino configurada.`);
    redirect('/qr-inactivo');
  }

  // 3. Normalizar protocolo (Asegura https://)
  let finalDestination = rawUrl.trim();
  if (!finalDestination.startsWith("http://") && !finalDestination.startsWith("https://")) {
    finalDestination = `https://${finalDestination}`;
  }

  // 4. Registrar analítica
  const userAgent = request.headers.get("user-agent") || "";
  if (qrCode.id) {
    void recordScan(qrCode.id, userAgent);
  }

  // 5. Redirigir al sitio web externo final
  return NextResponse.redirect(finalDestination, 307);
}