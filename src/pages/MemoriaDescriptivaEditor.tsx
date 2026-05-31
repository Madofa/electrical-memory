import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cloud, FileDown, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { useAuthStore } from '../stores/authStore'
import {
  getMemoriaDescriptiva, updateMemoriaDescriptiva,
  type MemoriaDescriptiva,
} from '../lib/supabase-memoria-descriptiva'
import { MemoriaDescriptivaPDF } from '../components/pdf/MemoriaDescriptivaPDF'
import toast from 'react-hot-toast'

const SECCIONS: { key: keyof MemoriaDescriptiva; label: string; placeholder: string; rows: number }[] = [
  {
    key: 'seccio_immoble',
    label: "1. Descripció de l'immoble",
    placeholder: "Descriu l'immoble: tipus, situació, superfície, plantes, estat general, ús actual...",
    rows: 5,
  },
  {
    key: 'seccio_escomesa',
    label: '2. Escomesa i derivació individual',
    placeholder: "Descriu com arriba l'electricitat: ubicació de la CPM/CGP, tipus i secció de la derivació individual, longitud, tipus d'instal·lació...",
    rows: 5,
  },
  {
    key: 'seccio_quadre',
    label: '3. Quadre de distribució',
    placeholder: 'Descriu la ubicació del quadre, composició, IGA, diferencials i circuits principals...',
    rows: 5,
  },
  {
    key: 'seccio_treballs',
    label: '4. Treballs realitzats',
    placeholder: 'Descriu els treballs executats: cablejat, mecanismes instal·lats, elements substituïts...',
    rows: 6,
  },
  {
    key: 'seccio_justificacio',
    label: '5. Justificació tècnica',
    placeholder: 'Justifica les decisions tècniques adoptades: perquè el grau triat, subdivisions de circuits, proteccions especials...',
    rows: 5,
  },
]

export function MemoriaDescriptivaEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { instalador } = useAuthStore()
  const [doc, setDoc] = useState<MemoriaDescriptiva | null>(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    getMemoriaDescriptiva(id).then(({ data, error }) => {
      if (error || !data) { toast.error('Document no trobat'); navigate('/memoria-descriptiva'); return }
      setDoc(data as MemoriaDescriptiva)
      setLoading(false)
    })
  }, [id, navigate])

  const update = (field: keyof MemoriaDescriptiva, value: string) => {
    setDoc((d) => d ? { ...d, [field]: value } : d)
    setDirty(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try {
        await updateMemoriaDescriptiva(id, { [field]: value })
        setDirty(false)
      } catch { toast.error('Error desant') }
      setAutoSaving(false)
    }, 2000)
  }

  const handleExport = async () => {
    if (!doc || !instalador) return
    setExporting(true)
    try {
      const blob = await pdf(<MemoriaDescriptivaPDF doc={doc} instalador={instalador} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memoria_descriptiva_${(doc.nom || 'document').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch { toast.error('Error en exportar') }
    setExporting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )
  if (!doc) return null

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/90 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/memoria-descriptiva')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <input
            value={doc.nom}
            onChange={(e) => update('nom', e.target.value)}
            placeholder="Nom del projecte"
            className="bg-transparent text-sm font-display font-bold tracking-widest uppercase text-slate-100 focus:outline-none flex-1 min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {autoSaving && <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1"><Cloud className="w-3 h-3 animate-pulse" /> desant…</span>}
          {!autoSaving && !dirty && <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1"><Cloud className="w-3 h-3" /> desat</span>}
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Exportant…</> : <><FileDown className="w-4 h-4" /> Exporta PDF</>}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Capçalera del document */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card space-y-4">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              Capçalera
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Lloc de signatura</label>
                <input className="input-field" value={doc.lloc_signatura} onChange={(e) => update('lloc_signatura', e.target.value)} placeholder="Barcelona" />
              </div>
              <div>
                <label className="field-label">Data</label>
                <input className="input-field" type="date" value={doc.data_signatura} onChange={(e) => update('data_signatura', e.target.value)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Seccions de text */}
        {SECCIONS.map(({ key, label, placeholder, rows }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (i + 1) }}
            className="card space-y-3"
          >
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              {label}
            </h3>
            <textarea
              rows={rows}
              value={doc[key] as string}
              onChange={(e) => update(key, e.target.value)}
              placeholder={placeholder}
              className="input-box w-full resize-y text-[13px] leading-relaxed"
            />
          </motion.div>
        ))}
      </main>
    </div>
  )
}
