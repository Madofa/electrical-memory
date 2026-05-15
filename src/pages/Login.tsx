import { useState } from 'react'
import { motion } from 'framer-motion'
import { signIn, signUp } from '../lib/supabase'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: err } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    if (err) {
      setError(translateError(err.message))
    } else if (mode === 'register') {
      setSuccess('Cuenta creada. Revisa tu email para confirmar.')
    }
    setLoading(false)
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
            <h2 className="font-display font-bold text-3xl tracking-wide uppercase text-slate-100">
              {mode === 'login' ? 'Acceder' : 'Crear cuenta'}
            </h2>
            <p className="text-slate-500 mt-1 font-body text-sm">
              {mode === 'login'
                ? 'Introduce tus credenciales para continuar.'
                : 'Regístrate para empezar a generar memorias.'}
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
                />
              </div>
            </div>

            <div>
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
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 text-sm font-body"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-sm font-body"
              >
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
                  Procesando...
                </span>
              ) : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body"
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Accede'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de entrar.'
  if (msg.includes('already registered')) return 'Este email ya está registrado.'
  if (msg.includes('Password')) return 'La contraseña debe tener al menos 6 caracteres.'
  return msg
}
