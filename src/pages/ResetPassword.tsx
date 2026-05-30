import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase, updatePassword } from '../lib/supabase'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  // Cuando Supabase detecta el token en la URL dispara PASSWORD_RECOVERY.
  // Sólo entonces tiene sentido mostrar el formulario.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    // Si ya hay sesión activa (token procesado), también podemos cambiar contraseña.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contrasenya ha de tenir almenys 6 caràcters.')
      return
    }
    if (password !== password2) {
      setError('Les contrasenyes no coincideixen.')
      return
    }
    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/', { replace: true }), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-lg tracking-widest uppercase text-slate-100">
            Quadre
          </span>
        </div>

        <h2 className="font-display font-bold text-3xl tracking-wide uppercase text-slate-100">
          Nova contrasenya
        </h2>
        <p className="text-slate-500 mt-1 mb-8 font-body text-sm">
          Tria una nova contrasenya per al teu compte.
        </p>

        {!ready && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-400 text-sm font-body mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Processant l'enllaç de recuperació…
          </div>
        )}

        {done ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-sm font-body">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Contrasenya actualitzada. Redirigint…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="field-label">Nova contrasenya</label>
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
                  disabled={!ready}
                />
              </div>
            </div>
            <div>
              <label className="field-label">Repeteix-la</label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-6"
                  minLength={6}
                  required
                  disabled={!ready}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 text-sm font-body">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Desant…' : 'Desa la contrasenya'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-slate-500 hover:text-amber-400 transition-colors font-body w-full text-center"
            >
              Torna a l'accés
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
