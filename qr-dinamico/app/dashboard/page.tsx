'use client'

import { useState, useEffect } from 'react'
import {
  QrCode,
  Plus,
  Edit,
  Eye,
  ExternalLink,
  Copy,
  LogOut,
  LogIn,
  Mail,
  Lock,
  User as UserIcon,
  Trash2,
  Pause,
  X,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { QRPreview } from '@/components/QRPreview'
import {
  QRModal,
  type QRFormData,
  type QRModalMode,
} from '@/components/QRModal'

type QRRecord = {
  id: string
  user_id: string
  name: string
  slug: string
  target_url: string
  primary_color: string
  logo_url: string | null
  is_active: boolean
  created_at: string
}

type AuthMode = 'signin' | 'signup'

/** Maps raw Supabase auth errors into user-friendly Spanish messages. */
const getSpanishAuthError = (message: string) => {
  if (message.includes('Invalid login credentials')) return 'Correo electrónico o contraseña incorrectos.'
  if (message.includes('User not found')) return 'No existe ninguna cuenta asociada a este correo electrónico.'
  if (message.includes('Email not confirmed')) return 'Por favor confirma tu correo electrónico para poder ingresar.'
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (message.includes('User already registered')) return 'Este correo electrónico ya se encuentra registrado.'
  return 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.'
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const [qrCodes, setQrCodes] = useState<QRRecord[]>([])
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<QRModalMode>('create')
  const [editingQr, setEditingQr] = useState<QRRecord | null>(null)
  const [modalSaving, setModalSaving] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewQr, setPreviewQr] = useState<QRRecord | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    setAuthLoading(true)
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) console.error('Session error:', error)
    setUserId(session?.user?.id ?? null)
    setAuthLoading(false)
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthSubmitting(true)
    setAuthError(null)
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: displayName ? { full_name: displayName } : undefined },
        })
        if (signUpError) throw signUpError
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
      await checkSession()
      setEmail('')
      setPassword('')
      setDisplayName('')
    } catch (err: unknown) {
      setAuthError(getSpanishAuthError((err as { message?: string })?.message ?? 'Error de autenticación'))
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUserId(null)
    setQrCodes([])
  }

  
  useEffect(() => {
    if (userId) fetchQrCodes()
  }, [userId])

  const fetchQrCodes = async () => {
    setQrLoading(true)
    setQrError(null)
    const { data, error } = await supabase
      .from('qr_codes').select('*').order('created_at', { ascending: false })
    if (error) setQrError(error.message)
    else setQrCodes(data ?? [])
    setQrLoading(false)
  }

  const handleCreateQr = async (data: QRFormData) => {
    setModalSaving(true)
    setActionError(null)
    const { error } = await supabase.from('qr_codes').insert({
      user_id: userId!,
      name: data.name, slug: data.slug, target_url: data.target_url,
      primary_color: data.primary_color, logo_url: data.logo_url || null,
      is_active: true,
    })
    if (error) setActionError(error.message)
    else { setModalOpen(false); await fetchQrCodes() }
    setModalSaving(false)
  }

  const handleUpdateQr = async (data: QRFormData) => {
    if (!editingQr) return
    setModalSaving(true)
    setActionError(null)
    const { error } = await supabase.from('qr_codes')
      .update({ name: data.name, slug: data.slug, target_url: data.target_url,
        primary_color: data.primary_color, logo_url: data.logo_url || null })
      .eq('id', editingQr.id)
    if (error) setActionError(error.message)
    else { setModalOpen(false); setEditingQr(null); await fetchQrCodes() }
    setModalSaving(false)
  }

  const handleToggleActive = async (qr: QRRecord) => {
    const { error } = await supabase
      .from('qr_codes').update({ is_active: !qr.is_active }).eq('id', qr.id)
    if (error) setActionError(error.message)
    else setQrCodes(qrCodes.map(q => q.id === qr.id ? { ...q, is_active: !q.is_active } : q))
  }

  const handleDeleteQr = async (qr: QRRecord) => {
    if (!confirm(`¿Eliminar "${qr.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('qr_codes').delete().eq('id', qr.id)
    if (error) setActionError(error.message)
    else setQrCodes(qrCodes.filter(q => q.id !== qr.id))
  }

  const handleCopyUrl = (qr: QRRecord) => {
    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    navigator.clipboard.writeText(`${domain.replace(/\/+$/, '')}/r/${qr.slug}`)
  }

  const handleQuickEdit = (qr: QRRecord) => {
    setEditingQr(qr)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handlePreview = (qr: QRRecord) => {
    setPreviewQr(qr)
    setPreviewOpen(true)
  }

  const handleCreate = () => {
    setEditingQr(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleModalSave = async (data: QRFormData) => {
    if (modalMode === 'create') await handleCreateQr(data)
    else await handleUpdateQr(data)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingQr(null)
    setActionError(null)
  }

  const previewInitialData = editingQr
    ? { name: editingQr.name, slug: editingQr.slug, target_url: editingQr.target_url,
                primary_color: editingQr.primary_color, logo_url: editingQr.logo_url ?? '' }
    : undefined

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-neutral-900 mb-2">
              <QrCode size={28} />
              <span>DynamicQR</span>
            </div>
            <p className="text-sm text-neutral-500">
              {authMode === 'signin'
                ? 'Accede a tu cuenta para gestionar tus códigos QR'
                : 'Crea tu cuenta para empezar'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow border border-neutral-200">
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                    <UserIcon size={16} /> Nombre completo
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                  <Mail size={16} /> Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hola@ejemplo.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-1">
                  <Lock size={16} /> Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 caret-slate-900 bg-white font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
                  required minLength={6}
                />
              </div>

              {authError && (
                <p className="text-sm text-red-500 text-center">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors disabled:opacity-50"
              >
                {authSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {authSubmitting
                  ? (authMode === 'signin' ? 'Iniciando sesión...' : 'Creando cuenta...')
                  : (authMode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta')}
              </button>
            </form>

            <div className="px-6 py-4 border-t border-neutral-200 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                  setAuthError(null)
                }}
                className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                {authMode === 'signin'
                  ? '¿No tienes cuenta? Regístrate'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <QrCode size={24} />
            <span>DynamicQR</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
            >
              <Plus size={16} />
              Crear código QR
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {actionError}
          </div>
                )}

        {qrError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {qrError}
          </div>
        )}

        {!qrLoading && qrCodes.length === 0 ? (
          <div className="text-center py-16 border border-neutral-200 border-dashed rounded-xl bg-white">
            <QrCode size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No tienes códigos QR creados
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Crea tu primer código QR dinámico para empezar a rastrear escaneos.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors mx-auto"
            >
              <Plus size={16} />
              Crear primer código QR
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">URL Destino</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-neutral-200">
                  {qrCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-neutral-900 font-medium">
                        {qr.name}
                      </td>
                      <td className="px-6 py-4 text-neutral-500 font-mono">
                        /r/{qr.slug}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={qr.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-700 hover:text-neutral-900 truncate max-w-xs inline-block"
                            title={qr.target_url}
                          >
                            {qr.target_url}
                          </a>
                          <ExternalLink size={14} className="text-neutral-400 shrink-0" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(qr)}
                          className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-medium transition-colors ${
                            qr.is_active
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-300 text-neutral-600'
                          }`}
                          title={qr.is_active ? 'Pausar' : 'Activar'}
                        >
                          {qr.is_active ? <Pause size={12} /> : null}
                          {qr.is_active ? 'Activo' : 'Pausado'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickEdit(qr)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edición rápida en 1-clic"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreview(qr)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Vista previa y descarga"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(qr)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Copiar URL del QR"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQr(qr)}
                            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
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

              {qrLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
        )}
            </main>

      {/* QR Modal (create / edit) */}
      <QRModal
        key={modalMode}
        open={modalOpen}
        mode={modalMode}
        onClose={handleModalClose}
        onSave={handleModalSave}
        initialData={previewInitialData}
        isLoading={modalSaving}
      />

      {/* Preview Modal */}
      {previewOpen && previewQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full mx-4 p-6">
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
            <QRPreview
              slug={previewQr.slug}
              qrName={previewQr.name}
              primaryColor={previewQr.primary_color}
              logoUrl={previewQr.logo_url ?? undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}


