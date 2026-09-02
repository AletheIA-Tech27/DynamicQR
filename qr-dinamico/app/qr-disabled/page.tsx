'use client'

import { QrCode } from 'lucide-react'
import Link from 'next/link'

export default function QrDisabledPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Icon container */}
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-slate-900 rounded-full border border-slate-800">
          <QrCode size={32} className="text-slate-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-100 mb-4">
          Código QR Inactivo
        </h1>

        {/* Message */}
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Este código QR se encuentra temporalmente inactivo.
          Es posible que la suscripción no esté al día o que el
          propietario haya pausado el código.
        </p>

        {/* CTA button */}
        <Link href="/login" passHref>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-900 bg-slate-300 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors"
          >
            Iniciar sesión para reactivar
          </button>
        </Link>
      </div>
    </div>
  )
}