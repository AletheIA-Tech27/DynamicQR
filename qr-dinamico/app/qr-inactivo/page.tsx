'use client'

import { QrCode } from 'lucide-react'

export default function QrInactivoPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-neutral-100 rounded-full">
          <QrCode size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Código QR Inactivo
        </h1>
        <p className="text-sm text-neutral-500">
          Este código QR no se encuentra disponible en este momento.
          Por favor contacta al establecimiento.
        </p>
      </div>
    </div>
  )
}