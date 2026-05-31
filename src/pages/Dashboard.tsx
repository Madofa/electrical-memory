import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Download, Pencil, Trash2, Zap, User, LogOut, Search, ChevronRight, Clock, Activity, BookOpen, ClipboardCheck } from 'lucide-react'
import { getMemorias, deleteMemoria, signOut, formatDate } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useWizardStore } from '../stores/wizardStore'
import type { Memoria } from '../types'
import toast from 'react-hot-toast'

const PROPERES_EINES = [
  'Memòria Tècnica de càlculs (ELEC-3)',
]

export function Dashboard() {
  const navigate = useNavigate()
  const { user, instalador, logout } = useAuthStore()
  const { loadMemoria, reset } = useWizardStore()
  const [memorias, setMemorias] = useState<Memoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMemorias(user.id).then(({ data }) => {
      setMemorias((data as Memoria[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const filtered = memorias.filter((m) =>
    !search ||
    m.referencia_interna?.toLowerCase().includes(search.toLowerCase()) ||
    (m.wizard_data?.ubicacion?.municipio ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleNew = () => {
    reset()
    navigate('/wizard')
  }

  const handleEdit = (m: Memoria) => {
    loadMemoria(m.id, m.wizard_data)
    navigate('/wizard')
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await deleteMemoria(id)
    setMemorias((prev) => prev.filter((m) => m.id !== id))
    setDeleting(null)
    toast.success('Memòria eliminada')
  }

  const handleLogout = async () => {
    await signOut()
    logout()
    navigate('/login')
  }

  const potenciaTotal = (m: Memoria) =>
    (m.wizard_data?.receptores ?? []).reduce((s, r) => s + (r.potencia_kw || 0), 0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center justify-between bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">
            Quadre
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/perfil')} className="btn-ghost">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{instalador?.nombre_completo?.split(' ')[0] ?? 'Perfil'}</span>
          </button>
          <button onClick={handleLogout} className="btn-ghost text-slate-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Selector d'eines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="section-sub mb-3">Eines disponibles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleNew}
              className="card-hover text-left flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-slate-200 text-[14px]">Memòria Tècnica Descriptiva</div>
                <div className="text-[11px] text-slate-500 font-body mt-0.5">e-distribució · alta de subministrament</div>
                <div className="text-[11px] text-amber-500/70 font-mono mt-1.5 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Nova memòria
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/unifilar')}
              className="card-hover text-left flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-slate-200 text-[14px]">Esquema Unifilar</div>
                <div className="text-[11px] text-slate-500 font-body mt-0.5">Model ELEC 2 · Generalitat de Catalunya</div>
                <div className="text-[11px] text-amber-500/70 font-mono mt-1.5 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Obrir
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/memoria-descriptiva')}
              className="card-hover text-left flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-slate-200 text-[14px]">Memòria Descriptiva</div>
                <div className="text-[11px] text-slate-500 font-body mt-0.5">Document narratiu · Generalitat de Catalunya</div>
                <div className="text-[11px] text-amber-500/70 font-mono mt-1.5 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Obrir
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/elec1')}
              className="card-hover text-left flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body font-semibold text-slate-200 text-[14px]">Certificat d'instal·lació (ELEC-1)</div>
                <div className="text-[11px] text-slate-500 font-body mt-0.5">Model ELEC-1 Abril 2024 · Generalitat de Catalunya</div>
                <div className="text-[11px] text-amber-500/70 font-mono mt-1.5 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Obrir
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
          <div>
            <p className="section-sub mb-1">Les meves memòries</p>
            <h2 className="font-display font-bold text-2xl tracking-wide uppercase text-slate-100">
              Memòria Tècnica Descriptiva
            </h2>
          </div>
          <button onClick={handleNew} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova memòria
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: 'Total', value: memorias.length, color: 'text-slate-300' },
            { label: 'Esborranys', value: memorias.filter(m => m.estado === 'borrador').length, color: 'text-slate-400' },
            { label: 'Finalitzades', value: memorias.filter(m => m.estado === 'finalizada').length, color: 'text-emerald-400' },
            {
              label: 'kW totals',
              value: memorias.reduce((s, m) => s + potenciaTotal(m), 0).toFixed(1),
              color: 'text-amber-400'
            },
          ].map((stat, i) => (
            <div key={i} className="card p-4">
              <div className={`font-mono font-semibold text-2xl ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] text-slate-500 font-display font-semibold tracking-widest uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        {memorias.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per referència o municipi…"
              className="input-box w-full pl-10 py-3"
            />
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-ink-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">
              {search ? 'Sense resultats' : 'Encara no tens cap memòria'}
            </h3>
            <p className="text-slate-600 text-sm font-body mb-6">
              {search ? 'Prova amb una altra cerca.' : 'Crea la teva primera memòria tècnica descriptiva.'}
            </p>
            {!search && (
              <button onClick={handleNew} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Nova memòria
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-amber-500/70" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-amber-500/70">
                          {m.referencia_interna || '—'}
                        </span>
                        <span className={m.estado === 'finalizada' ? 'badge-done' : 'badge-draft'}>
                          {m.estado === 'finalizada' ? '✓ Finalitzada' : '○ Esborrany'}
                        </span>
                      </div>
                      <div className="font-body font-semibold text-slate-200 text-[14px] truncate">
                        {m.wizard_data?.ubicacion?.municipio
                          ? `${m.wizard_data.ubicacion.direccion || ''} ${m.wizard_data.ubicacion.numero || ''}, ${m.wizard_data.ubicacion.municipio}`
                          : 'Adreça pendent'}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                        <span>{formatDate(m.updated_at)}</span>
                        {potenciaTotal(m) > 0 && (
                          <span className="text-amber-500/60">{potenciaTotal(m).toFixed(2)} kW</span>
                        )}
                        <span>{m.wizard_data?.receptores?.length ?? 0} receptors</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(m)}
                        className="btn-ghost p-2"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/pdf/${m.id}`)}
                        className="btn-ghost p-2"
                        title="Generar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="btn-ghost p-2 text-slate-600 hover:text-red-400"
                        title="Eliminar"
                      >
                        {deleting === m.id
                          ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-600 ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Properes eines */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-[#1e2d47]/60"
        >
          <p className="section-sub mb-3">Pròximament</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROPERES_EINES.map((eina) => (
              <div
                key={eina}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-600/50 bg-ink-800/30"
              >
                <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                <span className="text-[12.5px] font-body text-slate-500">{eina}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-[#1e2d47]/50 px-6 py-3 text-center">
        <span className="text-[10px] font-mono text-slate-700">
          Quadre · v {__APP_VERSION__}
        </span>
      </footer>
    </div>
  )
}
