import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Save, FileDown, Cloud, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { useAuthStore } from '../stores/authStore'
import { useEsquemaStore } from '../stores/esquemaUnifilarStore'
import { getEsquema, updateEsquema } from '../lib/supabase-esquemes'
import { getProjecte } from '../lib/supabase-projectes'
import type { Projecte } from '../lib/supabase-projectes'
import type { EsquemaUnifilar } from '../types/esquemaUnifilar'
import { CircuitTaula } from '../components/esquema-unifilar/CircuitTaula'
import { DiferencialPanel } from '../components/esquema-unifilar/DiferencialPanel'
import { CapcaleraForm } from '../components/esquema-unifilar/CapcaleraForm'
import { UnifilarSVG } from '../components/esquema-unifilar/UnifilarSVG'
import { EsquemaUnifilarPDF } from '../components/pdf/EsquemaUnifilarPDF'
import { instanciarPlantilla } from '../lib/plantilles-installacio'
import { LABELS_TIPUS_INSTALLACIO, type TipusInstallacio } from '../types/esquemaUnifilar'
import toast from 'react-hot-toast'

export function EsquemaUnifilarEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const store = useEsquemaStore()
  const [loading, setLoading] = useState(true)
  const [autoSaving, setAutoSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const saveInProgress = useRef(false)
  const [projecteId, setProjecteId] = useState<string | null>(null)
  const [projecteNom, setProjecteNom] = useState('')
  const [canviantPlantilla, setCanviantPlantilla] = useState(false)

  useEffect(() => {
    if (!id) return
    let mounted = true
    getEsquema(id).then(({ data, error }) => {
      if (!mounted) return
      if (error || !data) {
        toast.error('Esquema no trobat')
        navigate('/unifilar')
        return
      }
      store.loadFromServer(data as EsquemaUnifilar)
      setLoading(false)
      const pid = (data as typeof data & { projecte_id?: string }).projecte_id ?? null
      setProjecteId(pid)
      if (pid) {
        getProjecte(pid).then(({ data: p }) => {
          if (p && mounted) setProjecteNom((p as Projecte).nom)
        })
      }
    })
    return () => { mounted = false; store.reset() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Autoguardado con debounce de 2 s
  useEffect(() => {
    if (!store.dirty || !id || !user) return
    const t = setTimeout(async () => {
      if (saveInProgress.current) return
      saveInProgress.current = true
      setAutoSaving(true)
      try {
        await updateEsquema(id, {
          nom: store.nom,
          tipus_installacio: store.tipus_installacio,
          circuits: store.circuits,
          diferencials: store.diferencials,
          iga_amperatge: store.iga_amperatge,
          capcalera: store.capcalera,
          estat: store.estat,
        })
        store.markClean()
      } catch (e) {
        toast.error(`Error desant: ${e instanceof Error ? e.message : 'desconegut'}`)
      }
      setAutoSaving(false)
      saveInProgress.current = false
    }, 2000)
    return () => clearTimeout(t)
  }, [store.dirty, id, user, store])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const blob = await pdf(
        <EsquemaUnifilarPDF
          nom={store.nom}
          circuits={store.circuits}
          diferencials={store.diferencials}
          iga={store.iga_amperatge}
          capcalera={store.capcalera}
        />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safe = (store.nom || 'esquema').replace(/[^a-zA-Z0-9_-]+/g, '_')
      a.download = `unifilar_${safe}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : 'desconegut'}`)
    }
    setExporting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/90 backdrop-blur sticky top-0 z-50">
        {projecteId ? (
          <button onClick={() => navigate(`/projectes/${projecteId}`)} className="btn-ghost text-sm gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-amber-400/80 truncate max-w-[120px]">{projecteNom || 'Projecte'}</span>
          </button>
        ) : (
          <button onClick={() => navigate('/unifilar')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <input
            value={store.nom}
            onChange={(e) => store.setNom(e.target.value)}
            placeholder="Nom del projecte"
            className="bg-transparent text-sm font-display font-bold tracking-widest uppercase text-slate-100 focus:outline-none flex-1 min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {autoSaving && (
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <Cloud className="w-3 h-3 animate-pulse" /> desant…
            </span>
          )}
          {!autoSaving && !store.dirty && (
            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
              <Cloud className="w-3 h-3" /> desat
            </span>
          )}
          {store.dirty && !autoSaving && (
            <span className="text-[11px] text-amber-500/70 font-mono flex items-center gap-1">
              <Save className="w-3 h-3" /> canvis pendents
            </span>
          )}
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary"
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Exportant…</>
              : <><FileDown className="w-4 h-4" /> Exporta PDF</>}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row">
        {/* Panel izquierdo: editor */}
        <section className="xl:w-[520px] xl:border-r border-[#1e2d47] p-6 space-y-5 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <CapcaleraForm />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <DiferencialPanel />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60">
                Circuits ({store.circuits.length})
              </div>
              {!canviantPlantilla ? (
                <button
                  type="button"
                  onClick={() => setCanviantPlantilla(true)}
                  className="text-[11px] text-slate-500 hover:text-amber-400 font-mono transition-colors"
                >
                  Canviar plantilla
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    autoFocus
                    className="bg-ink-800 border border-amber-500/40 text-[12px] text-slate-200 rounded px-2 py-1 focus:outline-none"
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      if (!window.confirm('Canviar la plantilla substituirà tots els circuits actuals. Continuar?')) {
                        setCanviantPlantilla(false)
                        return
                      }
                      const { circuits, diferencials, iga_amperatge } = instanciarPlantilla(e.target.value as TipusInstallacio)
                      store.reorderCircuits([])
                      circuits.forEach((c) => store.updateCircuit(c.id, c))
                      // Reemplaça circuits i diferencials complets via store reset parcial
                      useEsquemaStore.setState({ circuits, diferencials, iga_amperatge, dirty: true })
                      setCanviantPlantilla(false)
                      toast.success('Plantilla carregada')
                    }}
                  >
                    <option value="" disabled>Tria el tipus…</option>
                    {(Object.entries(LABELS_TIPUS_INSTALLACIO) as [TipusInstallacio, string][]).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => setCanviantPlantilla(false)} className="text-[11px] text-slate-500 hover:text-slate-300">✕</button>
                </div>
              )}
            </div>
            <div className="card p-2">
              <CircuitTaula />
            </div>
          </motion.div>
        </section>

        {/* Panel derecho: previsualización */}
        <section className="flex-1 p-6 bg-ink-900/30 overflow-auto">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="section-sub">Vista prèvia</p>
              <p className="text-[10px] text-slate-600 font-mono">
                Model ELEC 2 · {store.circuits.length} circuits
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#1e2d47] shadow-2xl">
              <UnifilarSVG
                circuits={store.circuits}
                diferencials={store.diferencials}
                iga={store.iga_amperatge}
                capcalera={store.capcalera}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
