import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Zap, FileText, Trash2, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate } from '../lib/supabase'
import { getCertificatsElec1, createCertificatElec1, deleteCertificatElec1, type CertificatElec1 } from '../lib/supabase-elec1'
import toast from 'react-hot-toast'

const TIPUS_LABEL = { nova: 'Nova', ampliacio: 'Ampliació', modificacio: 'Modificació' }

export function Elec1List() {
  const navigate = useNavigate()
  const { user, instalador } = useAuthStore()
  const [certs, setCerts] = useState<CertificatElec1[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getCertificatsElec1(user.id).then(({ data }) => {
      setCerts((data as CertificatElec1[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      const id = await createCertificatElec1(user.id, instalador)
      navigate(`/elec1/${id}`)
    } catch { toast.error('Error en crear el document') }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await deleteCertificatElec1(id)
    setCerts((prev) => prev.filter((c) => c.id !== id))
    toast.success('Certificat esborrat')
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
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">ELEC-1 · Certificat d'instal·lació</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="section-sub mb-1">Model ELEC-1 · Generalitat de Catalunya</p>
            <h1 className="font-display font-bold text-4xl tracking-wide uppercase text-slate-100">Certificats d'instal·lació</h1>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            <Plus className="w-4 h-4" /> {creating ? 'Creant…' : 'Nou certificat'}
          </button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-ink-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">Cap certificat</h3>
            <p className="text-slate-600 text-sm font-body">Crea el teu primer certificat d'instal·lació ELEC-1.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c) => (
              <div key={c.id} className="card-hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-500/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-body font-semibold text-slate-200 text-[14px] truncate">{c.nom || 'Sense nom'}</span>
                      <span className={c.estat === 'finalitzat' ? 'badge-done' : 'badge-draft'}>
                        {c.estat === 'finalitzat' ? '✓ Finalitzat' : '○ Esborrany'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {TIPUS_LABEL[c.tipus_actuacio]} · {c.titular_nom || '—'} · {formatDate(c.updated_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/elec1/${c.id}`)} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} className="btn-ghost p-2 text-slate-600 hover:text-red-400">
                      {deleting === c.id ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" /> : <Trash2 className="w-4 h-4" />}
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
