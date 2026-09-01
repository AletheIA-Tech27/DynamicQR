'use client'

import { useState } from 'react'
import {
  X,
  Save,
  QrCode,
  Link as LinkIcon,
  ExternalLink,
  Palette,
  Image as ImageIcon,
} from 'lucide-react'

export type QRFormData = {
  name: string
  slug: string
  target_url: string
  primary_color: string
  logo_url: string
}

export type QRModalMode = 'create' | 'edit'

export interface QRModalProps {
  open: boolean
  mode: QRModalMode
  onClose: () => void
  /** Called with validated form data on successful submit */
  onSave: (data: QRFormData) => Promise<void>
  initialData?: Partial<QRFormData>
  isLoading?: boolean
}

/** Convert a human-readable name into a URL-safe slug. */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function QRModal({
  open,
  mode,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: QRModalProps) {
  const [formData, setFormData] = useState<QRFormData>({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    target_url: initialData?.target_url ?? '',
    primary_color: initialData?.primary_color ?? '#000000',
    logo_url: initialData?.logo_url ?? '',
  })
  const [nameError, setNameError] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
    const [urlError, setUrlError] = useState<string | null>(null)
  const nameHasValue = !!formData.name.trim()
  const slugIsEmpty = !formData.slug.trim()


  // -- Inline helpers ------------------------------------------------------

  function updateField(field: keyof QRFormData, value: string) {
    if (field === 'name') {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value }
                if (slugIsEmpty && value.trim()) {
          updated.slug = generateSlug(value)
        }
        return updated
      })
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  // -- Validation ----------------------------------------------------------

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('El nombre identificador es requerido')
      return false
    }
    setNameError(null)
    return true
  }

  const validateSlug = (slug: string): boolean => {
    if (!slug.trim()) {
      setSlugError('El slug es requerido')
      return false
    }
    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      setSlugError('El slug solo puede contener letras, números y guiones')
      return false
    }
    setSlugError(null)
    return true
  }

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('La URL destino es requerida')
      return false
    }
    try {
      new URL(url)
      setUrlError(null)
      return true
    } catch {
      setUrlError('URL inválida. Asegúrate de incluir http:// o https://')
      return false
    }
  }

  // -- Submit --------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameOk = validateName(formData.name)
    const slugOk = validateSlug(formData.slug)
    const urlOk = validateUrl(formData.target_url)
    if (!nameOk || !slugOk || !urlOk) return
    await onSave(formData)
    }

  if (!open) return null

  const title =
    mode === 'create' ? 'Crear nuevo código QR' : 'Editar código QR'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-neutral-200 mx-4 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* --- Header --- */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-xl font-semibold text-neutral-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>

          {/* --- Body --- */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Nombre identificador */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                <QrCode size={16} />
                Nombre identificador
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ej: Landing Page Principal"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors ${
                  nameError ? 'border-red-300' : 'border-slate-300'
                }`}
                disabled={isLoading}
              />
              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            {/* Slug personalizado */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                <LinkIcon size={16} />
                Slug personalizado
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 shrink-0">
                  tudominio.com/r/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  onFocus={() => {
                    if (nameHasValue && slugIsEmpty) {
                      setFormData((prev) => ({
                        ...prev,
                        slug: generateSlug(prev.name),
                      }))
                    }
                  }}
                  placeholder="mi-codigo-qr"
                  className={`flex-1 px-3 py-2 border rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors ${
                    slugError ? 'border-red-300' : 'border-slate-300'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {slugError && (
                <p className="text-xs text-red-500 mt-1">{slugError}</p>
              )}
              {!slugError && formData.slug && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Slug disponible
                </p>
              )}
            </div>

            {/* URL Destino */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                <ExternalLink size={16} />
                URL Destino
              </label>
              <input
                type="url"
                value={formData.target_url}
                onChange={(e) =>
                  setFormData({ ...formData, target_url: e.target.value })
                }
                placeholder="https://ejemplo.com/oferta-especial"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors ${
                  urlError ? 'border-red-300' : 'border-slate-300'
                }`}
                disabled={isLoading}
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1">{urlError}</p>
              )}
              {!urlError && formData.target_url && (
                <p className="text-xs text-green-600 mt-1">✓ URL válida</p>
              )}
            </div>
            {/* Colour & Logo — side by side on tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Colour */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                  <Palette size={16} />
                  Color primario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="w-10 h-10 p-0 border border-slate-300 rounded-lg cursor-pointer"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                  <ImageIcon size={16} />
                  URL del logo
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          {/* --- Footer --- */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {mode === 'create' ? 'Crear' : 'Guardar cambios'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
