import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, signUp, resetPassword, signInWithMagicLink, resendConfirmation } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Zap, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Check, Clock } from 'lucide-react'

type Mode = 'login' | 'register' | 'forgot' | 'magic'

const EINES = [
  { nom: 'Memòria Tècnica Descriptiva (e-distribució)', estat: 'available' as const },
  { nom: 'Esquema Unifilar (Model ELEC 2)', estat: 'available' as const },
  { nom: 'Memòria Descriptiva', estat: 'available' as const },
  { nom: 'Memòria Tècnica de càlculs (ELEC-3)', estat: 'soon' as const },
  { nom: 'Certificat d\'instal·lació (ELEC-1)', estat: 'soon' as const },
  { nom: 'Memòria Descriptiva', estat: 'soon' as const },
]

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
  const changeMode = (next: Mode) => { setMode(next); clearMsgs() }

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
        if (err) setError(translateError(err.message))
        else setSuccess('Compte creat. Revisa el teu correu per confirmar l\'adreça abans d\'entrar.')
      } else if (mode === 'forgot') {
        const { error: err } = await resetPassword(email)
        if (err) setError(err.message)
        else setSuccess('T\'hem enviat un correu amb l\'enllaç per recuperar la contrasenya. Revisa també la carpeta de correu brossa.')
      } else if (mode === 'magic') {
        const { error: err } = await signInWithMagicLink(email)
        if (err) setError(err.message)
        else setSuccess('T\'hem enviat un enllaç màgic per entrar sense contrasenya. Revisa el teu correu (i el correu brossa).')
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
    if (err) setError(err.message)
    else {
      setSuccess('Correu de confirmació reenviat. Revisa la teva safata d\'entrada.')
      setUnconfirmedEmail('')
    }
  }

  const showPassword = mode === 'login' || mode === 'register'

  const titleByMode: Record<Mode, string> = {
    login: 'Accedeix',
    register: 'Crea el teu compte',
    forgot: 'Recupera la contrasenya',
    magic: 'Entra amb enllaç màgic',
  }
  const subtitleByMode: Record<Mode, string> = {
    login: 'Introdueix les teves credencials per continuar.',
    register: 'Registra\'t per començar a generar documents.',
    forgot: 'T\'enviarem un correu amb un enllaç per crear una contrasenya nova.',
    magic: 'T\'enviarem un enllaç d\'un sol ús per entrar sense contrasenya.',
  }
  const ctaByMode: Record<Mode, string> = {
    login: 'Entra',
    register: 'Crea el compte',
    forgot: 'Envia\'m el correu',
    magic: 'Envia\'m l\'enllaç',
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 border-r border-[#1e2d47] relative overflow-hidden">
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

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-ink-900" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl tracking-widest uppercase text-slate-100">
              Quadre
            </span>
          </div>

          <h1 className="font-display font-bold text-5xl leading-tight tracking-wide text-slate-100 mb-6">
            Tots els<br />
            <span className="text-amber-500">documents elèctrics</span><br />
            a un sol quadre.
          </h1>

          <p className="text-slate-400 font-body leading-relaxed max-w-xs mb-10">
            La suite per a instal·ladors de baixa tensió a Catalunya.
            Genera, signa i exporta cada document oficial en minuts.
          </p>

          {/* Lista de las 5 herramientas */}
          <div className="space-y-2.5">
            {EINES.map((eina, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="flex items-center gap-3 text-[12.5px] font-body"
              >
                {eina.estat === 'available' ? (
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-ink-700 border border-ink-500 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                  </span>
                )}
                <span className={eina.estat === 'available' ? 'text-slate-300' : 'text-slate-500'}>
                  {eina.nom}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[10px] font-mono text-slate-600 tracking-widest uppercase">
          REBT · RD 842/2002 · ITC-BT
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
              Quadre
            </span>
          </div>

          <div className="mb-8">
            {(mode === 'forgot' || mode === 'magic') && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="text-[12px] text-slate-500 hover:text-amber-400 font-body flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-3 h-3" /> Torna a l'accés
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
              <label className="field-label">Correu electrònic</label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correu.com"
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
                  <label className="field-label">Contrasenya</label>
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
                      Reenviar el correu de confirmació
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
                  Processant…
                </span>
              ) : ctaByMode[mode]}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => changeMode('forgot')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full"
                >
                  Has oblidat la contrasenya?
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('magic')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full"
                >
                  Entra amb enllaç màgic (sense contrasenya)
                </button>
                <button
                  type="button"
                  onClick={() => changeMode('register')}
                  className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body block w-full pt-2 border-t border-ink-600/30"
                >
                  No tens compte? Registra't
                </button>
              </>
            )}
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => changeMode('login')}
                className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body"
              >
                Ja tens compte? Accedeix
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Correu o contrasenya incorrectes.'
  if (msg.includes('Email not confirmed')) return 'El teu correu no està confirmat. Revisa la safata o reenvia el correu de confirmació a sota.'
  if (msg.includes('already registered')) return 'Aquest correu ja està registrat. Prova a iniciar sessió.'
  if (msg.toLowerCase().includes('password') && msg.toLowerCase().includes('short')) return 'La contrasenya ha de tenir almenys 6 caràcters.'
  if (msg.includes('rate limit') || msg.includes('Too many')) return 'Massa intents. Espera uns minuts i torna a provar.'
  if (msg.includes('Network')) return 'Error de xarxa. Comprova la teva connexió.'
  return msg
}
