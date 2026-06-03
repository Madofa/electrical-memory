import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cloud, FileDown, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { getElec3Doc, updateElec3Doc, type Elec3Doc } from '../lib/supabase-elec3'
import { getProjecte, type Projecte } from '../lib/supabase-projectes'
import { getEsquemaByProjecte } from '../lib/supabase-esquemes'
import type { Diferencial, Circuit } from '../types/esquemaUnifilar'
import { calculaTrams, migrateTrams, FIXED_SLOTS, type Tram, type TramCalculat } from '../lib/elec3-calculs'
import { FormInput, FormSelect } from '../components/ui/FormField'
import { generateElec3PDF } from '../lib/pdf-elec3'
import toast from 'react-hot-toast'

// FIXED_SLOTS imported to satisfy module dependency (used by migrateTrams internally)
void FIXED_SLOTS

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
  const [projecte, setProjecte] = useState<Projecte | null>(null)
  const [esquemaDifs, setEsquemaDifs] = useState<Diferencial[]>([])
  const [esquemaCircuits, setEsquemaCircuits] = useState<Circuit[]>([])

  useEffect(() => {
    if (!id) return
    let mounted = true
    getElec3Doc(id).then(({ data, error }) => {
      if (!mounted) return
      if (error || !data) { toast.error('Document no trobat'); navigate('/elec3'); return }
      const rawDoc = data as Elec3Doc
      // Migrate old free-form trams to fixed slots if needed
      if (rawDoc.trams.length !== 13 || rawDoc.trams[0]?.id !== 'derivacio_individual') {
        rawDoc.trams = migrateTrams(rawDoc.trams)
      }
      setDoc(rawDoc)
      setLoading(false)
      const pid = (data as typeof data & { projecte_id?: string }).projecte_id ?? null
      setProjecteId(pid)
      if (pid) {
        getProjecte(pid).then(({ data: p }) => {
          if (!p || !mounted) return
          const proj = p as Projecte
          setProjecteNom(proj.nom)
          setProjecte(proj)
          // Load circuits + differentials from linked ELEC-2 and prefill trams
          getEsquemaByProjecte(pid).then(({ data: esq }) => {
            if (!esq || !mounted) return
            const difs = (esq as { diferencials: Diferencial[] }).diferencials || []
            const circs = (esq as { circuits: Circuit[] }).circuits || []
            setEsquemaDifs(difs)
            setEsquemaCircuits(circs)

            // Prefill trams from ELEC-2 circuit data if tram has no power yet
            setDoc(d => {
              if (!d) return d
              const trams = d.trams.map((t, idx) => {
                // Tram 0 = DI: use project power + LGA section
                if (idx === 0) {
                  const seccio = parseFloat(proj.seccio_lga_mm2) || t.seccio_mm2
                  const potencia = proj.potencia_kw || t.potencia_kw
                  if (t.potencia_kw && t.seccio_mm2 === seccio) return t // already set
                  return {
                    ...t,
                    potencia_kw: t.potencia_kw || potencia,
                    cos_fi: t.cos_fi === 0.9 ? 1 : t.cos_fi,  // DI cosfi=1
                    seccio_mm2: seccio,
                    conduc_neutre_mm2: t.conduc_neutre_mm2 ?? seccio,
                    conduc_protec_mm2: t.conduc_protec_mm2 ?? seccio,
                    canal_tub_encastat_mm: t.canal_tub_encastat_mm ?? (seccio <= 6 ? 25 : 32),
                  }
                }
                // Trams 1-12 = C-D through Y-Z: map from ELEC-2 circuits[idx-1]
                const circ = circs[idx - 1]
                if (!circ) return t
                if (t.potencia_kw !== 0) return t  // already has data
                // Parse section from "2×1,5+1,5" → 1.5
                const seccioMatch = circ.seccio.replace(',', '.').match(/[×x]\s*(\d+\.?\d*)/)
                const seccio = seccioMatch ? parseFloat(seccioMatch[1]) : t.seccio_mm2
                return {
                  ...t,
                  potencia_kw: circ.potencia_kw || t.potencia_kw,
                  seccio_mm2: seccio || t.seccio_mm2,
                  conduc_neutre_mm2: t.conduc_neutre_mm2 ?? seccio,
                  conduc_protec_mm2: t.conduc_protec_mm2 ?? seccio,
                  canal_tub_encastat_mm: t.canal_tub_encastat_mm ?? 20,
                }
              })
              const changed = trams.some((t, i) => t !== d.trams[i])
              if (changed && id) updateElec3Doc(id, { trams }).catch(() => {})
              return changed ? { ...d, trams } : d
            })
          }).catch(() => {})
          // Merge project technical data into doc if fields are empty
          setDoc(d => {
            if (!d) return d
            const patch: Partial<Elec3Doc> = {}
            if (!d.us_installacio)          patch.us_installacio          = proj.us_installacio || ''
            if (!d.empresa_distribuidora)   patch.empresa_distribuidora   = proj.empresa_distribuidora || ''
            if (!d.resist_terra_ohm   && proj.resist_terra_ohm)    patch.resist_terra_ohm   = proj.resist_terra_ohm
            if (!d.potencia_instal_kw && proj.potencia_kw)         patch.potencia_instal_kw = proj.potencia_kw
            if (!d.intensitat_iga_a   && proj.iga_amperatge)       patch.intensitat_iga_a   = proj.iga_amperatge
            if (!d.superficie_local_m2 && proj.superficie_local_m2) patch.superficie_local_m2 = proj.superficie_local_m2
            if (Object.keys(patch).length > 0 && id) updateElec3Doc(id, patch).catch(() => {})
            return { ...d, ...patch }
          })
        })
      }
    })
    return () => { mounted = false }
  }, [id, navigate])

  // Refresh project data when user returns to this tab — always overwrites doc fields
  useEffect(() => {
    const onFocus = () => {
      if (!projecteId) return
      getProjecte(projecteId).then(({ data: p }) => {
        if (!p) return
        const proj = p as Projecte
        setProjecte(proj)
        // Force-update doc fields from project (project is source of truth)
        if (id) {
          const patch: Partial<Elec3Doc> = {
            us_installacio:        proj.us_installacio        || '',
            empresa_distribuidora: proj.empresa_distribuidora || '',
            resist_terra_ohm:      proj.resist_terra_ohm      ?? null,
            potencia_instal_kw:    proj.potencia_kw           || null,
            intensitat_iga_a:      proj.iga_amperatge         || null,
            superficie_local_m2:   proj.superficie_local_m2  ?? null,
            nova_ampliacio_reforma: proj.nova_ampliacio_reforma || 'nova',
          }
          setDoc(d => d ? { ...d, ...patch } : d)
          updateElec3Doc(id, patch).catch(() => {})
        }
      })
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [projecteId, id])

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

  const updTram = (tramId: string, field: keyof Tram, value: string | number | null) => {
    setDoc((d) => {
      if (!d) return d
      const trams = d.trams.map((t) => t.id === tramId ? { ...t, [field]: value } : t)
      save(trams)
      setDirty(true)
      return { ...d, trams }
    })
  }

  const updDoc = (field: keyof Elec3Doc, value: string | number | null) => {
    setDoc((d) => d ? { ...d, [field]: value } : d)
    setDirty(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try { await updateElec3Doc(id, { [field]: value as never }); setDirty(false) }
      catch { toast.error('Error desant') }
      setAutoSaving(false)
    }, 2000)
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
      // Refresh project data to get latest changes
      let freshProjecte = projecte
      if (projecteId) {
        const { data: p } = await getProjecte(projecteId)
        if (p) { freshProjecte = p as Projecte; setProjecte(p as Projecte) }
      }
      const pdfBytes = await generateElec3PDF(doc, instalador, freshProjecte ?? undefined, esquemaDifs, esquemaCircuits)
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elec3_${(doc.nom || 'calculs').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en exportar')
    }
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
          <div className="mb-4">
            <p className="section-sub">Caiguda de tensió · REBT ITC-BT-19</p>
            <h2 className="font-display font-bold text-xl uppercase text-slate-100">Taula de càlculs</h2>
          </div>

          {/* Table */}
          <div className="min-w-[1600px]">
            {/* Header */}
            <div
              className="grid text-[9px] font-display font-semibold tracking-widest uppercase text-amber-500/60 border-b border-amber-500/20 pb-1.5 mb-1"
              style={{ gridTemplateColumns: '2fr 0.5fr 0.7fr 0.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.5fr 0.8fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr 0.6fr' }}
            >
              <span>Tram</span>
              <span className="text-right">Càrg%</span>
              <span className="text-right">Pot kW</span>
              <span className="text-right">cos φ</span>
              <span className="text-right">Int A</span>
              <span>Secc mm²</span>
              <span className="text-right">Long m</span>
              <span className="text-right">Moment</span>
              <span className="text-right">ΔU parc%</span>
              <span className="text-right">ΔU tot%</span>
              <span>Cond.</span>
              <span>Tensió aïll.</span>
              <span className="text-right">Enc mm</span>
              <span className="text-right">S/enc mm</span>
              <span className="text-right">Ent. m</span>
              <span className="text-right">kΩ</span>
              <span className="text-right">Neutre</span>
              <span className="text-right">Protec</span>
            </div>

            {trams.map((t) => (
              <div
                key={t.id}
                className={`grid items-center gap-0.5 py-1 border-b border-ink-600/30 ${!t.ok ? 'bg-red-950/20' : ''}`}
                style={{ gridTemplateColumns: '2fr 0.5fr 0.7fr 0.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.5fr 0.8fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr 0.6fr' }}
              >
                <div className="text-[11px] text-slate-300 px-1 truncate">{t.nom}</div>
                <input
                  type="number"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.carrega_pct}
                  onChange={(e) => updTram(t.id, 'carrega_pct', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
                <input
                  type="number"
                  step="0.01"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.potencia_kw || ''}
                  onChange={(e) => updTram(t.id, 'potencia_kw', parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.cos_fi}
                  onChange={(e) => updTram(t.id, 'cos_fi', parseFloat(e.target.value) || 0)}
                />
                <div className="text-[11px] text-amber-300/80 font-mono text-right pr-0.5">{t.intensitat_a}</div>
                <select
                  className="bg-ink-800 border border-ink-600 text-[11px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.seccio_mm2}
                  onChange={(e) => updTram(t.id, 'seccio_mm2', parseFloat(e.target.value))}
                >
                  {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.5"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.longitud_m || ''}
                  onChange={(e) => updTram(t.id, 'longitud_m', parseFloat(e.target.value) || 0)}
                />
                <div className="text-[11px] text-slate-400 font-mono text-right pr-0.5">{t.moment_kwm}</div>
                <div className="text-[11px] text-slate-400 font-mono text-right pr-0.5">{t.caiguda_parcial_pct.toFixed(2)}%</div>
                <div className={`text-[11px] font-mono text-right pr-0.5 font-semibold ${t.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.caiguda_total_pct.toFixed(2)}%
                </div>
                <select
                  className="bg-ink-800 border border-ink-600 text-[10px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.tipus_conductor}
                  onChange={(e) => updTram(t.id, 'tipus_conductor', e.target.value as 'Cu' | 'Al')}
                >
                  <option value="Cu">Cu</option>
                  <option value="Al">Al</option>
                </select>
                <select
                  className="bg-ink-800 border border-ink-600 text-[10px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.tensio_nominal_aillament}
                  onChange={(e) => updTram(t.id, 'tensio_nominal_aillament', e.target.value)}
                >
                  <option value="0,45/0,75">0,45/0,75</option>
                  <option value="0,6/1">0,6/1</option>
                </select>
                <input
                  type="number"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.canal_tub_encastat_mm ?? ''}
                  onChange={(e) => updTram(t.id, 'canal_tub_encastat_mm', e.target.value ? parseFloat(e.target.value) : null)}
                />
                <input
                  type="number"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.canal_tub_sense_encas_mm ?? ''}
                  onChange={(e) => updTram(t.id, 'canal_tub_sense_encas_mm', e.target.value ? parseFloat(e.target.value) : null)}
                />
                <input
                  type="number"
                  step="0.1"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.canal_enterrat_prof_m ?? ''}
                  onChange={(e) => updTram(t.id, 'canal_enterrat_prof_m', e.target.value ? parseFloat(e.target.value) : null)}
                />
                <input
                  type="number"
                  step="0.1"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.aillament_instal_kohm ?? ''}
                  onChange={(e) => updTram(t.id, 'aillament_instal_kohm', e.target.value ? parseFloat(e.target.value) : null)}
                />
                <input
                  type="number"
                  step="0.5"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.conduc_neutre_mm2 ?? ''}
                  onChange={(e) => updTram(t.id, 'conduc_neutre_mm2', e.target.value ? parseFloat(e.target.value) : null)}
                />
                <input
                  type="number"
                  step="0.5"
                  className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none"
                  value={t.conduc_protec_mm2 ?? ''}
                  onChange={(e) => updTram(t.id, 'conduc_protec_mm2', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
            <span>Ambre = calculat automàticament · ✓ ≤5% (ITC-BT-19) · il·luminació ≤3%</span>
            <span className="text-red-400">Vermell = supera el límit</span>
          </div>

          {/* Page 2 data */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 card space-y-4"
          >
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Dades resum (pàgina 2)</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Ús de la instal·lació"
                value={doc.us_installacio ?? ''}
                onChange={(e) => updDoc('us_installacio', e.target.value)}
                placeholder="Vivenda Elevada"
              />
              <FormInput
                label="Empresa distribuïdora"
                value={doc.empresa_distribuidora ?? ''}
                onChange={(e) => updDoc('empresa_distribuidora', e.target.value)}
              />
              <FormSelect
                label="Nova / Ampliació / Reforma"
                value={doc.nova_ampliacio_reforma ?? 'nova'}
                onChange={(e) => updDoc('nova_ampliacio_reforma', e.target.value)}
                options={[
                  { value: 'nova', label: 'Nova' },
                  { value: 'ampliacio', label: 'Ampliació' },
                  { value: 'reforma', label: 'Reforma' },
                ]}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormInput
                label="Resistència terra (Ω)"
                type="number"
                step="0.1"
                value={String(doc.resist_terra_ohm ?? '')}
                onChange={(e) => updDoc('resist_terra_ohm', e.target.value ? parseFloat(e.target.value) : null)}
                className="font-mono"
              />
              <FormInput
                label="Potència a instal·lar (kW)"
                type="number"
                step="0.01"
                value={String(doc.potencia_instal_kw ?? '')}
                onChange={(e) => updDoc('potencia_instal_kw', e.target.value ? parseFloat(e.target.value) : null)}
                className="font-mono"
              />
              <FormInput
                label="Intensitat IGA (A)"
                type="number"
                value={String(doc.intensitat_iga_a ?? '')}
                onChange={(e) => updDoc('intensitat_iga_a', e.target.value ? parseFloat(e.target.value) : null)}
                className="font-mono"
              />
              <FormInput
                label="Superfície local (m²)"
                type="number"
                value={String(doc.superficie_local_m2 ?? '')}
                onChange={(e) => updDoc('superficie_local_m2', e.target.value ? parseFloat(e.target.value) : null)}
                className="font-mono"
              />
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
