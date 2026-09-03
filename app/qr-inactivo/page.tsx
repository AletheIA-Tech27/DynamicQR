import { QrCode } from "lucide-react";
import Link from "next/link";

export default async function QRDisabledPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md mx-auto text-center px-6 py-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto flex items-center justify-center bg-slate-800 rounded-full">
          <QrCode size={32} className="text-slate-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Código QR Inactivo
          </h1>
          <p className="text-sm text-slate-400">
            Este código QR no se encuentra disponible en este momento. Por favor contacta al establecimiento.
          </p>
        </div>

        {id && (
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-500 font-mono">
            Ref ID: {id}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <p className="text-xs text-slate-500">
            ¿Eres el administrador de este QR?
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            Activar en el Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}