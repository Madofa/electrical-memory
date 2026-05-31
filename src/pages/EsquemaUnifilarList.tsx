import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Zap, FileText, Trash2, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate } from '../lib/supabase'
import { getEsquemes, deleteEsquema, createEsquemaFromPlantilla } from '../lib/supabase-esquemes'
import type { EsquemaUnifilar, TipusInstallacio } from '../types/esquemaUnifilar'
import { LABELS_TIPUS_INSTALLACIO } from '../types/esquemaUnifilar'
import toast from 'react-hot-toast'

export function EsquemaUnifilarList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [esquemes, setEsquemes] = useState<EsquemaUnifilar[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newNom, setNewNom] = useState('')
  const [newTipus, setNewTipus] = useState<TipusInstallacio>('habitatge_basica')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getEsquemes(user.id).then(({ data, error }) => {
      if (error) toast.error(`Error en carregar: ${error.message}`)
      setEsquemes((data as EsquemaUnifilar[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const handleCreate = async () => {
    if (!user || !newNom.trim()) return
    setCreating(true)
    try {
      const id = await createEsquemaFromPlantilla(user.id, newTipus, newNom.trim())
      toast.success('Esquema creat')
      navigate(`/unifilar/${id}`)
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : 'desconegut'}`)
    }
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const { error } = await deleteEsquema(id)
    if (error) toast.error(error.message)
    else {
      setEsquemes((prev) => prev.filter((e) => e.id !== id))
      toast.success('Esquema esborrat')
    }
    setDeleting(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">
            Esquema Unifilar
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <p className="section-sub mb-1">Model ELEC 2 · Generalitat de Catalunya</p>
            <h1 className="font-display font-bold text-4xl tracking-wide uppercase text-slate-100">
              Esquemes unifilars
            </h1>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nou esquema
          </button>
        </motion.div>

        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8 space-y-4"
          >
            <h3 className="font-body font-semibold text-slate-200">Crear esquema des de plantilla</h3>
            <div>
              <span className="field-label">Nom del projecte</span>
              <input
                className="input-field"
                placeholder="Ex. Can Manel"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <span className="field-label">Tipus d'instal·lació</span>
              <select
                className="input-field"
                value={newTipus}
                onChange={(e) => setNewTipus(e.target.value as TipusInstallacio)}
              >
                {Object.entries(LABELS_TIPUS_INSTALLACIO).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newNom.trim()}
                className="btn-primary flex-1 justify-center"
              >
                {creating ? 'Creant…' : 'Crear i obrir editor'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-ghost">
                Cancel·la
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : esquemes.length === 0 && !showNew ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-ink-700 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">
              Encara no tens cap esquema
            </h3>
            <p className="text-slate-600 text-sm font-body mb-6">
              Crea el teu primer esquema unifilar des d'una plantilla.
            </p>
            <button onClick={() => setShowNew(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Nou esquema
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {esquemes.map((e) => (
              <div key={e.id} className="card-hover">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ink-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-500/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-body font-semibold text-slate-200 text-[14px] truncate">
                        {e.nom || 'Sense nom'}
                      </span>
                      <span className={e.estat === 'finalitzat' ? 'badge-done' : 'badge-draft'}>
                        {e.estat === 'finalitzat' ? '✓ Finalitzat' : '○ Esborrany'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {LABELS_TIPUS_INSTALLACIO[e.tipus_installacio]} · {e.circuits.length} circuits · {formatDate(e.updated_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/unifilar/${e.id}`)}
                      className="btn-ghost p-2"
                      title="Obrir editor"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deleting === e.id}
                      className="btn-ghost p-2 text-slate-600 hover:text-red-400"
                      title="Esborrar"
                    >
                      {deleting === e.id
                        ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" />
                        : <Trash2 className="w-4 h-4" />}
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
