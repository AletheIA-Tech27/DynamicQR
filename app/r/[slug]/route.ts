import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

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

  // 1. Consultar el QR en Supabase (buscando la tabla qr_codes)
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Si hay error de RLS o no existe el registro
  if (error || !qrCode) {
    console.error(`[QR Error] No se encontró el slug '${slug}' o falló RLS:`, error);
    redirect('/qr-inactivo');
  }

  // 2. Extraer la URL de destino
  let rawUrl = qrCode.target_url || qrCode.destination_url;

  if (!rawUrl) {
    console.error(`[QR Error] El slug '${slug}' no tiene URL configurada.`);
    redirect('/qr-inactivo');
  }

  // 3. Normalizar la URL
  let finalDestination = rawUrl.trim();
  if (!finalDestination.startsWith("http://") && !finalDestination.startsWith("https://")) {
    finalDestination = `https://${finalDestination}`;
  }

  // 4. Registrar analítica (fire-and-forget)
  const userAgent = request.headers.get("user-agent") || "";
  if (qrCode.id) {
    void recordScan(qrCode.id, userAgent);
  }

  // 5. Redirigir limpiamente al sitio final
  return NextResponse.redirect(finalDestination, 307);
}