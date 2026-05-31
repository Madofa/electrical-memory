import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Zap, FileText, Trash2, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate } from '../lib/supabase'
import { getElec3Docs, createElec3Doc, deleteElec3Doc, type Elec3Doc } from '../lib/supabase-elec3'
import toast from 'react-hot-toast'

export function Elec3List() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [docs, setDocs] = useState<Elec3Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getElec3Docs(user.id).then(({ data }) => {
      setDocs((data as Elec3Doc[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      const id = await createElec3Doc(user.id)
      navigate(`/elec3/${id}`)
    } catch { toast.error('Error en crear el document') }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await deleteElec3Doc(id)
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.success('Document esborrat')
    setDeleting(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">ELEC-3 · Càlculs caiguda de tensió</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="section-sub mb-1">REBT ITC-BT-19 · Generalitat de Catalunya</p>
            <h1 className="font-display font-bold text-4xl tracking-wide uppercase text-slate-100">Memòries tècniques ELEC-3</h1>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            <Plus className="w-4 h-4" /> {creating ? 'Creant…' : 'Nou càlcul'}
          </button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-ink-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">Cap càlcul</h3>
            <p className="text-slate-600 text-sm font-body">Crea el teu primer càlcul de caiguda de tensió.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="card-hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-500/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-body font-semibold text-slate-200 text-[14px] truncate">{d.nom || 'Sense nom'}</span>
                      <span className={d.estat === 'finalitzat' ? 'badge-done' : 'badge-draft'}>{d.estat === 'finalitzat' ? '✓ Finalitzat' : '○ Esborrany'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{d.trams.length} trams · {formatDate(d.updated_at)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/elec3/${d.id}`)} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} className="btn-ghost p-2 text-slate-600 hover:text-red-400">
                      {deleting === d.id ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
