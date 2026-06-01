import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cloud, FileDown, Plus, Trash2, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { useAuthStore } from '../stores/authStore'
import { getElec3Doc, updateElec3Doc, type Elec3Doc } from '../lib/supabase-elec3'
import { getProjecte } from '../lib/supabase-projectes'
import type { Projecte } from '../lib/supabase-projectes'
import { calculaTrams, tramBuit, type Tram, type TramCalculat } from '../lib/elec3-calculs'
import { Elec3PDF } from '../components/pdf/Elec3PDF'
import toast from 'react-hot-toast'

const SECCIONS_STD = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50]

export function Elec3Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { instalador } = useAuthStore()
  const [doc, setDoc] = useState<Elec3Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [projecteId, setProjecteId] = useState<string | null>(null)
  const [projecteNom, setProjecteNom] = useState('')

  useEffect(() => {
    if (!id) return
    let mounted = true
    getElec3Doc(id).then(({ data, error }) => {
      if (!mounted) return
      if (error || !data) { toast.error('Document no trobat'); navigate('/elec3'); return }
      setDoc(data as Elec3Doc)
      setLoading(false)
      const pid = (data as typeof data & { projecte_id?: string }).projecte_id ?? null
      setProjecteId(pid)
      if (pid) {
        getProjecte(pid).then(({ data: p }) => {
          if (p && mounted) setProjecteNom((p as Projecte).nom)
        })
      }
    })
    return () => { mounted = false }
  }, [id, navigate])

  const save = (trams: Tram[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try { await updateElec3Doc(id, { trams }); setDirty(false) }
      catch { toast.error('Error desant') }
      setAutoSaving(false)
    }, 2000)
  }

  const updTram = (tramId: string, field: keyof Tram, value: string | number) => {
    setDoc((d) => {
      if (!d) return d
      const trams = d.trams.map((t) => t.id === tramId ? { ...t, [field]: value } : t)
      save(trams)
      setDirty(true)
      return { ...d, trams }
    })
  }

  const addTram = () => {
    setDoc((d) => {
      if (!d) return d
      const trams = [...d.trams, tramBuit()]
      save(trams)
      setDirty(true)
      return { ...d, trams }
    })
  }

  const removeTram = (tramId: string) => {
    setDoc((d) => {
      if (!d) return d
      const trams = d.trams.filter((t) => t.id !== tramId)
      save(trams)
      setDirty(true)
      return { ...d, trams }
    })
  }

  const updNom = (nom: string) => {
    setDoc((d) => d ? { ...d, nom } : d)
    setDirty(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try { await updateElec3Doc(id, { nom }); setDirty(false) }
      catch { /* silent */ }
      setAutoSaving(false)
    }, 2000)
  }

  const handleExport = async () => {
    if (!doc || !instalador) return
    setExporting(true)
    try {
      const blob = await pdf(<Elec3PDF doc={doc} instalador={instalador} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elec3_${(doc.nom || 'calculs').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch { toast.error('Error en exportar') }
    setExporting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
  if (!doc) return null

  const trams: TramCalculat[] = calculaTrams(doc.trams)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/90 backdrop-blur sticky top-0 z-50">
        {projecteId ? (
          <button onClick={() => navigate(`/projectes/${projecteId}`)} className="btn-ghost text-sm gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-amber-400/80 truncate max-w-[120px]">{projecteNom || 'Projecte'}</span>
          </button>
        ) : (
          <button onClick={() => navigate('/elec3')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <input
            value={doc.nom}
            onChange={(e) => updNom(e.target.value)}
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

      <main className="flex-1 px-4 py-6 overflow-x-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-sub">Caiguda de tensió · REBT ITC-BT-19</p>
              <h2 className="font-display font-bold text-xl uppercase text-slate-100">Taula de càlculs</h2>
            </div>
            <button onClick={addTram} className="btn-ghost text-sm">
              <Plus className="w-3.5 h-3.5" /> Afegir tram
            </button>
          </div>

          {/* Taula */}
          <div className="min-w-[1100px]">
            {/* Capçalera */}
            <div className="grid grid-cols-[2fr_0.6fr_0.8fr_0.6fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr_1fr_1fr_0.4fr] text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60 border-b border-amber-500/20 pb-1.5 mb-1">
              <span>Tram</span>
              <span className="text-right">Càrg %</span>
              <span className="text-right">Pot kW</span>
              <span className="text-right">cos φ</span>
              <span className="text-right">Int A</span>
              <span>Secció</span>
              <span className="text-right">Long m</span>
              <span className="text-right">Moment</span>
              <span className="text-right">ΔU parc %</span>
              <span className="text-right">ΔU total %</span>
              <span>Tipus</span>
              <span></span>
            </div>

            {trams.map((t, i) => (
              <div
                key={t.id}
                className={`grid grid-cols-[2fr_0.6fr_0.8fr_0.6fr_0.8fr_0.9fr_0.8fr_0.8fr_1fr_1fr_1fr_0.4fr] items-center gap-1 py-1.5 border-b border-ink-600/30 ${!t.ok ? 'bg-red-950/20' : ''}`}
              >
                {/* Nom */}
                <input
                  className="bg-transparent text-[13px] text-slate-200 font-body focus:outline-none focus:bg-ink-800/50 rounded px-1 w-full"
                  value={t.nom}
                  onChange={(e) => updTram(t.id, 'nom', e.target.value)}
                  placeholder={i === 0 ? 'Derivació individual A-B' : `Circuit ${i}`}
                />
                {/* Càrrega */}
                <input type="number" className="bg-ink-800/50 text-[12px] text-right font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.carrega_pct} onChange={(e) => updTram(t.id, 'carrega_pct', parseFloat(e.target.value) || 0)} min="0" max="100" />
                {/* Potència */}
                <input type="number" step="0.01" className="bg-ink-800/50 text-[12px] text-right font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.potencia_kw || ''} onChange={(e) => updTram(t.id, 'potencia_kw', parseFloat(e.target.value) || 0)} />
                {/* cos fi */}
                <input type="number" step="0.01" min="0" max="1" className="bg-ink-800/50 text-[12px] text-right font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.cos_fi} onChange={(e) => updTram(t.id, 'cos_fi', parseFloat(e.target.value) || 0)} />
                {/* Intensitat (calculada) */}
                <div className="text-[12px] text-amber-300/80 font-mono text-right pr-1">{t.intensitat_a}</div>
                {/* Secció */}
                <select className="bg-ink-800 border border-ink-600 text-[12px] font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.seccio_mm2} onChange={(e) => updTram(t.id, 'seccio_mm2', parseFloat(e.target.value))}>
                  {SECCIONS_STD.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                </select>
                {/* Longitud */}
                <input type="number" step="0.5" className="bg-ink-800/50 text-[12px] text-right font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.longitud_m || ''} onChange={(e) => updTram(t.id, 'longitud_m', parseFloat(e.target.value) || 0)} />
                {/* Moment (calculat) */}
                <div className="text-[12px] text-slate-400 font-mono text-right pr-1">{t.moment_kwm}</div>
                {/* ΔU parcial (calculat) */}
                <div className="text-[12px] text-slate-400 font-mono text-right pr-1">{t.caiguda_parcial_pct.toFixed(2)}%</div>
                {/* ΔU total (calculat) */}
                <div className={`text-[13px] font-mono text-right pr-1 font-semibold ${t.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.caiguda_total_pct.toFixed(2)}%
                </div>
                {/* Tipus */}
                <select className="bg-ink-800 border border-ink-600 text-[11px] font-mono rounded px-1 py-0.5 w-full focus:outline-none" value={t.tipus} onChange={(e) => updTram(t.id, 'tipus', e.target.value as 'mono' | 'tri')}>
                  <option value="mono">Mono</option>
                  <option value="tri">Tri</option>
                </select>
                {/* Esborrar */}
                <button onClick={() => removeTram(t.id)} className="text-slate-600 hover:text-red-400 flex justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Llegenda */}
          <div className="mt-6 flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
            <span>Columnes en ambre = calculades automàticament</span>
            <span>✓ ≤5% (ITC-BT-19) · il·luminació ≤3%</span>
            <span className="text-red-400">Vermell = supera el límit</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
