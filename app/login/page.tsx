'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/**
 * PÁGINA DE AUTENTICACIÓN
 *
 * Flujo:
 *   1. El usuario introduce su email y contraseña.
 *   2. En modo "login" intentamos `signInWithPassword`.
 *   3. En modo "signup" intentamos `signUp` y mostramos mensaje de verificación
 *      si Supabase tiene confirmación de email activada.
 *   4. Tras un login exitoso: `router.push('/dashboard')` + `router.refresh()`.
 */

type AuthMode = 'login' | 'signup'

const getSpanishAuthError = (message: string) => {
  if (message.includes('Invalid login credentials'))
    return 'Correo electrónico o contraseña incorrectos.'
  if (message.includes('User not found'))
    return 'No existe ninguna cuenta asociada a este correo electrónico.'
  if (message.includes('Email not confirmed'))
    return 'Por favor confirma tu correo electrónico para poder ingresar.'
  if (message.includes('Password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (message.includes('User already registered'))
    return 'Este correo electrónico ya se encuentra registrado.'
  return 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.'
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const supabase = createClient()

  // Si ya hay sesión activa, redirige al dashboard automáticamente.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted && session) {
          router.push('/dashboard')
          router.refresh()
        }
      } catch (err) {
        console.error('[Login] Error al verificar la sesión existente:', err)
      } finally {
        if (mounted) setCheckingSession(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(getSpanishAuthError(signInError.message))
          return
        }

        if (data?.session) {
          // ✅ Login exitoso: navegar al dashboard y refrescar la sesión.
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          setError(getSpanishAuthError(signUpError.message))
          return
        }

        // Si la confirmación de email está activada, `session` será null.
        if (data?.session) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setInfo(
            'Cuenta creada. Revisa tu correo electrónico para confirmar la cuenta antes de iniciar sesión.'
          )
          setMode('login')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Login] Error inesperado:', message)
      setError(getSpanishAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-sm">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">DynamicQR</h1>
          <p className="text-sm text-slate-500 mt-1">
            Códigos QR dinámicos para tu negocio
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Tabs Login / Signup */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                setInfo(null)
              }}
              className={`text-sm font-medium py-2 rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setInfo(null)
              }}
              className={`text-sm font-medium py-2 rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="hola@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 caret-slate-900 bg-white font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-900 caret-slate-900 bg-white font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Info */}
            {info && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{info}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading
                ? mode === 'login'
                  ? 'Iniciando sesión...'
                  : 'Creando cuenta...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Al continuar aceptas los términos y la política de privacidad.
        </p>

        <p className="text-center text-sm text-slate-500 mt-3">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}

