'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'

export interface QRPreviewProps {
  /** The slug used in the redirect URL (e.g. "/r/my-slug") */
  slug: string
  /** Human-readable name for the QR code (used in download filenames) */
  qrName?: string
  /** Foreground colour of the QR modules (default: black) */
  primaryColor?: string
  /** Optional logo image URL rendered in the centre of the QR */
  logoUrl?: string
  /** Base domain — falls back to NEXT_PUBLIC_APP_URL or localhost */
  domain?: string
  className?: string
  /** Pixel size of the visible preview SVG */
  previewSize?: number
}

const DEFAULT_DOMAIN = 'http://localhost:3000'

/**
 * Renders a dynamic QR code whose encoded value points to the redirect
 * endpoint `/r/[slug]`.  Provides two download actions:
 *   - **PNG (Alta Res)** — exports a 512 × 512 canvas raster
 *   - **SVG (Imprenta Vectorial)** — exports a vector SVG suitable
 *     for professional printing
 */
export function QRPreview({
  slug,
  qrName,
  primaryColor = '#000000',
  logoUrl,
  domain = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_DOMAIN,
  className,
  previewSize = 128,
}: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const baseUrl = domain.replace(/\/+$/, '')
  const qrValue = `${baseUrl}/r/${slug}`

  // High-resolution canvas only used for PNG export (kept off-screen).
  const downloadSize = 512

  const logoDims = Math.round(previewSize * 0.15)

  // -- Download helpers ----------------------------------------------------

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `QR-${qrName || slug}.png`
      link.click()
      setDownloadError(null)
    } catch {
      setDownloadError(
        'No se pudo descargar el PNG. El logo podría tener problemas de CORS.'
      )
    }
  }

  const downloadSvg = () => {
    const svg = svgRef.current
    if (!svg) return
    try {
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `QR-${qrName || slug}.svg`
      link.click()
      URL.revokeObjectURL(url)
      setDownloadError(null)
    } catch {
      setDownloadError('No se pudo descargar el SVG.')
    }
  }

  return (
    <div
      className={`relative flex flex-col items-center gap-4 ${className ?? ''}`}
    >
      {/* ----------------------------------------------------------------- */}
      {/*  Hidden high-resolution canvas used purely for PNG export         */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="absolute -left-[9999px] -top-[9999px]"
        aria-hidden="true"
      >
        <QRCodeCanvas
          ref={canvasRef}
          value={qrValue}
          size={downloadSize}
          fgColor={primaryColor}
          level="Q"
          includeMargin
          imageSettings={
            logoUrl
              ? {
                  src: logoUrl,
                  width: 60,
                  height: 60,
                  excavate: true,
                  crossOrigin: 'anonymous',
                }
              : undefined
          }
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/*  Visible SVG preview (also used for SVG download)                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-center bg-white p-3 rounded-xl border border-neutral-200 shadow">
        <QRCodeSVG
          ref={svgRef}
          value={qrValue}
          size={previewSize}
          fgColor={primaryColor}
          level="Q"
          includeMargin
          imageSettings={
            logoUrl
              ? {
                  src: logoUrl,
                  width: logoDims,
                  height: logoDims,
                  excavate: true,
                  crossOrigin: 'anonymous',
                }
              : undefined
          }
        />
      </div>

      {/* Redirect URL label */}
      {slug && (
        <p className="text-xs text-neutral-500 text-center break-all px-4">
          {qrValue}
        </p>
      )}

      {/* Download buttons */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          type="button"
          onClick={downloadPng}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
        >
          <Download size={16} />
          Descargar PNG (Alta Res)
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
        >
          <Download size={16} />
          Descargar SVG (Imprenta Vectorial)
        </button>
      </div>

      {downloadError && (
        <p className="text-xs text-red-500 text-center">{downloadError}</p>
      )}
    </div>
  )
}
