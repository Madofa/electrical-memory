import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUp, resetPassword, signInWithMagicLink, resendConfirmation } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Zap, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

type Mode = 'login' | 'register' | 'forgot' | 'magic'

export function Login() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')

  const clearMsgs = () => { setError(''); setSuccess(''); setUnconfirmedEmail('') }

  const changeMode = (next: Mode) => {
    setMode(next)
    clearMsgs()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearMsgs()

    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password)
        if (err) {
          setError(translateError(err.message))
          if (err.message.includes('Email not confirmed')) setUnconfirmedEmail(email)
        }
      } else if (mode === 'register') {
        const { error: err } = await signUp(email, password)
        if (err) {
          setError(translateError(err.message))
        } else {
          setSuccess('Cuenta creada. Revisa tu email para confirmar la dirección antes de entrar.')
        }
      } else if (mode === 'forgot') {
        const { error: err } = await resetPassword(email)
        if (err) {
          setError(err.message)
        } else {
          setSuccess('Te hemos enviado un email con el enlace para recuperar tu contraseña. Revisa también la carpeta de spam.')
        }
      } else if (mode === 'magic') {
        const { error: err } = await signInWithMagicLink(email)
        if (err) {
          setError(err.message)
        } else {
          setSuccess('Te hemos enviado un enlace mágico para entrar sin contraseña. Revisa tu email (y el spam).')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return
    setLoading(true)
    const { error: err } = await resendConfirmation(unconfirmedEmail)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('Email de confirmación reenviado. Revisa tu bandeja de entrada.')
      setUnconfirmedEmail('')
    }
  }

  const showPassword = mode === 'login' || mode === 'register'

  const titleByMode: Record<Mode, string> = {
    login: 'Acceder',
    register: 'Crear cuenta',
    forgot: 'Recuperar contraseña',
    magic: 'Entrar con enlace mágico',
  }

  const subtitleByMode: Record<Mode, string> = {
    login: 'Introduce tus credenciales para continuar.',
    register: 'Regístrate para empezar a generar memorias.',
    forgot: 'Te enviaremos un email con un enlace para crear una nueva contraseña.',
    magic: 'Te enviaremos un enlace de un solo uso para entrar sin contraseña.',
  }

  const ctaByMode: Record<Mode, string> = {
    login: 'Entrar',
    register: 'Crear cuenta',
    forgot: 'Enviar email de recuperación',
    magic: 'Enviar enlace mágico',
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 border-r border-[#1e2d47] relative overflow-hidden">
        {/* Circuit decorations */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 480 800" preserveAspectRatio="none">
          <line x1="120" y1="0" x2="120" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
          <circle cx="120" cy="200" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" />
          <line x1="120" y1="200" x2="360" y2="200" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
          <circle cx="360" cy="200" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" />
          <line x1="360" y1="200" x2="360" y2="600" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
          <circle cx="360" cy="600" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" />
          <line x1="0" y1="400" x2="240" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.15" />
          <line x1="240" y1="400" x2="240" y2="800" stroke="#f59e0b" strokeWidth="1" opacity="0.15" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-ink-900" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl tracking-widest uppercase text-slate-100">
              Memoria Eléctrica
            </span>
          </div>

          <h1 className="font-display font-bold text-5xl leading-tight tracking-wide text-slate-100 mb-6">
            Memorias<br />
            <span className="text-amber-500">Técnicas</span><br />
            en minutos.
          </h1>

          <p className="text-slate-400 font-body leading-relaxed max-w-xs">
            Genera memorias técnicas descriptivas para instalaciones eléctricas
            en baja tensión. Formato e-distribución, listo para presentar.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: '⚡', text: 'Conforme REBT (RD 842/2002)' },
            { icon: '📋', text: 'Formato exacto e-distribución' },
            { icon: '📄', text: 'PDF descargable al instante' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 text-slate-400 font-body text-sm"
            >
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-ink-900" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-lg tracking-widest uppercase text-slate-100">
              Memoria Eléctrica
            </span>
          </div>

          <div className="mb-8">
            {(mode === 'forgot' || mode === 'magic') && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="text-[12px] text-slate-500 hover:text-amber-400 font-body flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-3 h-3" /> Volver al acceso
              </button>
            )}
            <h2 className="font-display font-bold text-3xl tracking-wide uppercase text-slate-100">
              {titleByMode[mode]}
            </h2>
            <p className="text-slate-500 mt-1 font-body text-sm">
              {subtitleByMode[mode]}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="field-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input-field pl-6"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <AnimatePresence>
              {showPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <label className="field-label">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-6"
                      minLength={6}
                      required={showPassword}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 text-sm font-body"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {unconfirmedEmail && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="text-[12px] text-amber-400 hover:text-amber-300 underline mt-1"
                      disabled={loading}
                    >
                      Reenviar email de confirmación
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-sm font-body"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
                  Procesando…
                </span>
              ) : ctaByMode[mode]}
            </button>
          </form>

          {/* Enlaces secundarios */}
          <div className="mt-6 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => changeMode('forgot')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('magic')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full"
                >
                  Entrar con enlace mágico (sin contraseña)
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('register')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full pt-2 border-t border-ink-600/30"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </>
            )}
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body"
              >
                ¿Ya tienes cuenta? Accede
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Tu email no está confirmado. Revisa tu bandeja o reenvía el email de confirmación abajo.'
  if (msg.includes('already registered')) return 'Este email ya está registrado. Prueba a iniciar sesión.'
  if (msg.toLowerCase().includes('password') && msg.toLowerCase().includes('short')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (msg.includes('rate limit') || msg.includes('Too many')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
  if (msg.includes('Network')) return 'Error de red. Comprueba tu conexión.'
  return msg
}
