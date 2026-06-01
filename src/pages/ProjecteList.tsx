// src/pages/ProjecteList.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Zap, User, LogOut, ChevronRight, Trash2, FolderOpen } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate, signOut } from '../lib/supabase'
import {
  getProjectes, createProjecte, deleteProjecte,
  type Projecte, type ProjecteForm,
} from '../lib/supabase-projectes'
import { ProjecteForm as ProjecteFormModal } from '../components/projecte/ProjecteForm'
import toast from 'react-hot-toast'

export function ProjecteList() {
  const navigate = useNavigate()
  const { user, instalador, logout } = useAuthStore()
  const [projectes, setProjectes] = useState<Projecte[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProjectes(user.id).then(({ data }) => {
      setProjectes((data as Projecte[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const handleCreate = async (data: ProjecteForm) => {
    if (!user) return
    const newId = await createProjecte(user.id, data)
    toast.success('Projecte creat')
    navigate(`/projectes/${newId}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Esborrar aquest projecte? Els documents associats no s\'esborraran.')) return
    setDeleting(id)
    const { error } = await deleteProjecte(id)
    if (error) { toast.error(error.message); setDeleting(null); return }
    setProjectes((prev) => prev.filter((p) => p.id !== id))
    toast.success('Projecte esborrat')
    setDeleting(null)
  }

  const handleLogout = async () => {
    await signOut()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center justify-between bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">Quadre</span>
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
          <div>
            <p className="section-sub mb-1">Els meus expedients</p>
            <h1 className="font-display font-bold text-4xl tracking-wide uppercase text-slate-100">Projectes</h1>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nou projecte
          </button>
        </motion.div>

        {/* Accés ràpid a documents sense projecte */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all mb-8 text-left"
        >
          <FolderOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-body font-semibold text-amber-300">Documents sense projecte</div>
            <div className="text-[11px] text-slate-500 font-body">Memòries tècniques i documents creats abans dels projectes</div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500/60 flex-shrink-0" />
        </motion.button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : projectes.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">Cap projecte</h3>
            <p className="text-slate-600 text-sm font-body mb-6">
              Crea el teu primer expedient per organitzar tots els documents d'una instal·lació.
            </p>
            <button onClick={() => setShowNew(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Nou projecte
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projectes.map((p, i) => {
              const adreça = [p.inst_nom_via, p.inst_numero, p.inst_cp, p.inst_poblacio].filter(Boolean).join(', ')
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/projectes/${p.id}`)}>
                      <div className="font-body font-semibold text-slate-200 text-[15px] truncate">{p.nom || 'Sense nom'}</div>
                      {adreça && <div className="text-[12px] text-slate-500 font-mono truncate mt-0.5">{adreça}</div>}
                      {p.titular_nom && <div className="text-[11px] text-slate-600 font-body mt-0.5">{p.titular_nom}</div>}
                      <div className="text-[10px] text-slate-700 font-mono mt-1">{formatDate(p.updated_at)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => navigate(`/projectes/${p.id}`)} className="btn-ghost p-2">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="btn-ghost p-2 text-slate-600 hover:text-red-400"
                      >
                        {deleting === p.id
                          ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

      </main>

      <footer className="border-t border-[#1e2d47]/50 px-6 py-3 text-center">
        <span className="text-[10px] font-mono text-slate-700">Quadre · v {__APP_VERSION__}</span>
      </footer>

      {showNew && (
        <ProjecteFormModal
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}
