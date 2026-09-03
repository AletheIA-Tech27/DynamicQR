'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRPreview } from '@/components/qr-preview'
import { Plus, Copy, Eye, Trash2, ExternalLink, X, Check } from 'lucide-react'

interface QRRecord {
  id: string
  slug: string
  name: string
  target_url: string
  primary_color: string
  logo_url: string | null
  created_at: string
}

export default function DashboardPage() {
  const [qrs, setQrs] = useState<QRRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Estados para Modal de Creación
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#000000')
  const [creating, setCreating] = useState(false)

  // Estados para Modal de Vista Previa
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewQr, setPreviewQr] = useState<QRRecord | null>(null)

  const supabase = createClient()

  const fetchQRs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('qrs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQrs(data || [])
    } catch (err) {
      console.error('Error al obtener los códigos QR:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQRs()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Generación de slug legible para la base de datos
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7)

      const { error } = await supabase.from('qrs').insert([
        {
          user_id: user.id,
          name,
          slug: generatedSlug,
          target_url: targetUrl,
          primary_color: primaryColor,
        },
      ])

      if (error) throw error

      setName('')
      setTargetUrl('')
      setPrimaryColor('#000000')
      setIsCreateOpen(false)
      fetchQRs()
    } catch (err) {
      console.error('Error al crear el QR:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este código QR?')) return

    try {
      const { error } = await supabase.from('qrs').delete().eq('id', id)
      if (error) throw error
      setQrs(qrs.filter((qr) => qr.id !== id))
    } catch (err) {
      console.error('Error al eliminar el QR:', err)
    }
  }

  const handleCopyUrl = (qr: QRRecord) => {
    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // ✅ Redirección mapeada al ID (UUID)
    const fullUrl = `${domain.replace(/\/+$/, '')}/r/${qr.id}`
    
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(qr.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenPreview = (qr: QRRecord) => {
    setPreviewQr(qr)
    setPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Códigos QR Dinámicos</h1>
            <p className="text-sm text-neutral-500">Gestiona y redirecciona tus accesos en tiempo real.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Crear Código QR</span>
          </button>
        </div>

        {/* Content Table / Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          </div>
        ) : qrs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">No hay códigos registrados</h3>
            <p className="text-sm text-neutral-500 mb-6">Crea tu primer código QR dinámico para comenzar a redirigir tráfico.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              <Plus size={16} /> Crear QR
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-900 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">URL Destino</th>
                    <th className="px-6 py-4">Identificador (ID)</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {qrs.map((qr) => (
                    <tr key={qr.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900">{qr.name}</td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        <a
                          href={qr.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 underline underline-offset-2"
                        >
                          {qr.target_url}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-400">{qr.id}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyUrl(qr)}
                            title="Copiar URL Dinámica"
                            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            {copiedId === qr.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                          </button>
                          <button
                            onClick={() => handleOpenPreview(qr)}
                            title="Ver Vista Previa / Descargar"
                            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(qr.id)}
                            title="Eliminar QR"
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal para Crear QR */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full p-6 relative">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Nuevo Código QR</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Menú Principal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">URL Destino</label>
                  <input
                    type="url"
                    required
                    placeholder="https://ejemplo.com/destino"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Color Primario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 border-0 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-sm text-neutral-600">{primaryColor}</span>
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Guardando...' : 'Crear Código'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Vista Previa */}
        {previewOpen && previewQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full p-6">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
                Vista previa de &ldquo;{previewQr.name}&rdquo;
              </h3>
              {/* ✅ Mapeo de id dinámico hacia el componente QRPreview */}
              <QRPreview
                id={previewQr.id}
                slug={previewQr.slug}
                qrName={previewQr.name}
                primaryColor={previewQr.primary_color}
                logoUrl={previewQr.logo_url ?? undefined}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}