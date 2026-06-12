import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cloud, FileDown, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { getCertificatElec1, updateCertificatElec1, type CertificatElec1 } from '../lib/supabase-elec1'
import { getProjecte, updateProjecte, mapElec1FieldToProjecte } from '../lib/supabase-projectes'
import type { Projecte } from '../lib/supabase-projectes'
import { FormInput } from '../components/ui/FormField'
import toast from 'react-hot-toast'

const TIPUS_ACTUACIO_OPT = [
  { value: 'nova', label: 'Nova instal·lació' },
  { value: 'ampliacio', label: 'Ampliació' },
  { value: 'modificacio', label: 'Modificació o reforma' },
]
const CLASSIFICACIO_OPT = [
  { value: 'mtd', label: 'Memòria tècnica de disseny' },
  { value: 'p1', label: 'Classe P1' },
  { value: 'p2', label: 'Classe P2' },
]
const US_INSTALLACIO_OPT = [
  { value: "a) Instal·lacions industrials", label: "a) Industrial / Taller (fàbrica, producció)" },
  { value: "b) Instal·lacions comercials i oficines", label: "b) Local comercial / Oficina / Magatzem comercial" },
  { value: "c) Instal·lacions d'ús públic i espectacles", label: "c) Ús públic / Espectacles" },
  { value: "d) Garatges i aparcaments", label: "d) Garatge / Aparcament" },
  { value: "e) Piscines i fonts", label: "e) Piscines / Fonts" },
  { value: "f) Instal·lacions d'habitatges", label: "f) Habitatge (unifamiliar / bloc)" },
  { value: "g) Instal·lacions en locals amb risc d'incendi o explosió", label: "g) Local amb risc d'incendi o explosió" },
  { value: "h) Altres", label: "h) Altres" },
]

export function Elec1Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { instalador } = useAuthStore()
  const [cert, setCert] = useState<CertificatElec1 | null>(null)
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
    getCertificatElec1(id).then(({ data, error }) => {
      if (!mounted) return
      if (error || !data) { toast.error('Document no trobat'); navigate('/elec1'); return }
      setCert(data as CertificatElec1)
      setLoading(false)
      const pid = (data as typeof data & { projecte_id?: string }).projecte_id ?? null
      setProjecteId(pid)
      if (pid) {
        getProjecte(pid).then(({ data: p }) => {
          if (!p || !mounted) return
          const proj = p as Projecte
          setProjecteNom(proj.nom)
          // Merge project technical data into cert if fields are empty/zero
          setCert(c => {
            if (!c) return c
            const patch: Partial<CertificatElec1> = {}
            // Dades del titular: el projecte és la font de veritat
            if (proj.titular_nom && proj.titular_nom !== c.titular_nom)         patch.titular_nom = proj.titular_nom
            if (proj.titular_nif && proj.titular_nif !== c.titular_nif)         patch.titular_nif = proj.titular_nif
            if (proj.titular_telefon && proj.titular_telefon !== c.titular_telefon) patch.titular_telefon = proj.titular_telefon
            if (proj.titular_correu && proj.titular_correu !== c.titular_correu)   patch.titular_correu = proj.titular_correu
            if (!c.tensio_v)                  patch.tensio_v                  = proj.tensio_v || '230'
            if (!c.seccio_lga_mm2)            patch.seccio_lga_mm2            = proj.seccio_lga_mm2 || ''
            if (!c.potencia_kw)               patch.potencia_kw               = proj.potencia_kw || 0
            if (!c.calibre_fusibles_cgp_a)    patch.calibre_fusibles_cgp_a    = proj.calibre_fusibles_cgp_a || 0
            if (!c.material_conductor || c.material_conductor === 'Coure')
              if (proj.material_conductor)     patch.material_conductor        = proj.material_conductor
            if (!c.intensitat_iga_a)          patch.intensitat_iga_a          = proj.iga_amperatge || 0
            if (!c.resist_terra_ohm && proj.resist_terra_ohm) patch.resist_terra_ohm = proj.resist_terra_ohm
            if (!c.us_installacio || c.us_installacio === "f) Instal·lacions d'habitatges")
              if (proj.us_installacio)         patch.us_installacio            = proj.us_installacio
            if (!c.cups)                      patch.cups                      = proj.cups || ''
            if (proj.classificacio)           patch.classificacio             = proj.classificacio
            if (proj.nova_ampliacio_reforma)  patch.tipus_actuacio            =
              proj.nova_ampliacio_reforma === 'nova' ? 'nova' :
              proj.nova_ampliacio_reforma === 'ampliacio' ? 'ampliacio' : 'modificacio'
            if (Object.keys(patch).length > 0 && id) updateCertificatElec1(id, patch).catch(() => {})
            return { ...c, ...patch }
          })
        })
      }
    })
    return () => { mounted = false; if (timer.current) clearTimeout(timer.current) }
  }, [id, navigate])

  // Refresh project data when user returns to this tab
  useEffect(() => {
    const onFocus = () => {
      if (!projecteId) return
      getProjecte(projecteId).then(({ data: p }) => {
        if (!p) return
        const proj = p as Projecte
        setCert(c => {
          if (!c) return c
          // Doc values always win — project only fills genuinely empty fields
          return {
            ...c,
            // Dades del titular: el projecte és la font de veritat
            titular_nom:            proj.titular_nom            || c.titular_nom,
            titular_nif:            proj.titular_nif            || c.titular_nif,
            titular_telefon:        proj.titular_telefon        || c.titular_telefon,
            titular_correu:         proj.titular_correu         || c.titular_correu,
            tensio_v:               c.tensio_v               || proj.tensio_v              || c.tensio_v,
            seccio_lga_mm2:         c.seccio_lga_mm2         || proj.seccio_lga_mm2        || '',
            potencia_kw:            c.potencia_kw            || proj.potencia_kw            || 0,
            calibre_fusibles_cgp_a: c.calibre_fusibles_cgp_a || proj.calibre_fusibles_cgp_a || 0,
            material_conductor:     c.material_conductor     || proj.material_conductor     || c.material_conductor,
            intensitat_iga_a:       c.intensitat_iga_a       || proj.iga_amperatge          || 0,
            resist_terra_ohm:       c.resist_terra_ohm       ?? proj.resist_terra_ohm       ?? null,
            us_installacio:         c.us_installacio         || proj.us_installacio         || c.us_installacio,
            cups:                   c.cups                   || proj.cups                   || '',
          }
        })
      })
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [projecteId])

  const upd = (field: keyof CertificatElec1, value: string | number) => {
    setCert((c) => c ? { ...c, [field]: value } : c)
    setDirty(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try {
        await updateCertificatElec1(id, { [field]: value })
        setDirty(false)
        // El document és la font prioritària: si el camp ve del projecte, l'actualitzem
        if (projecteId) {
          const projPatch = mapElec1FieldToProjecte(field, value)
          if (projPatch) updateProjecte(projecteId, projPatch).catch(() => {})
        }
      }
      catch { toast.error('Error desant') }
      setAutoSaving(false)
    }, 2000)
  }

  const updBool = (field: keyof CertificatElec1, value: boolean) => {
    setCert((c) => c ? { ...c, [field]: value } : c)
    setDirty(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!id) return
      setAutoSaving(true)
      try { await updateCertificatElec1(id, { [field]: value }); setDirty(false) }
      catch { toast.error('Error desant') }
      setAutoSaving(false)
    }, 2000)
  }

  const handleExport = async () => {
    if (!cert) return
    if (!instalador) { toast.error('Cal completar el perfil d\'instal·lador abans d\'exportar'); return }
    setExporting(true)
    try {
      const { generateElec1PDF } = await import('../lib/pdf-elec1')
      const pdfBytes = await generateElec1PDF(cert, instalador)
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elec1_${(cert.nom || 'document').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en exportar')
    }
    setExporting(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
  if (!cert) return null

  const fi = (field: keyof CertificatElec1, label: string, placeholder = '') => (
    <FormInput label={label} value={String(cert[field] ?? '')} onChange={(e) => upd(field, e.target.value)} placeholder={placeholder} />
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
          <button onClick={() => navigate('/elec1')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <input
            value={cert.nom}
            onChange={(e) => upd('nom', e.target.value)}
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Titular */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Titular de la instal·lació</h3>
          <div className="grid grid-cols-3 gap-4">
            {fi('titular_nom', 'Raó social / Nom i cognoms', 'Titular del futur contracte')}
            {fi('titular_nif', 'NIF/DNI')}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {fi('titular_tipus_via', 'Tipus via', 'Carrer')}
            <div className="col-span-2">{fi('titular_nom_via', 'Nom de la via')}</div>
            {fi('titular_numero', 'Núm.')}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {fi('titular_bloc', 'Bloc')} {fi('titular_escala', 'Escala')} {fi('titular_pis', 'Pis')} {fi('titular_porta', 'Porta')} {fi('titular_cp', 'C.P.')}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {fi('titular_poblacio', 'Població')} {fi('titular_telefon', 'Telèfon')} {fi('titular_correu', 'Correu electrònic')}
          </div>
        </motion.div>

        {/* Instal·lació */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card space-y-4">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Adreça de la instal·lació</h3>
          <div className="grid grid-cols-4 gap-4">
            {fi('inst_tipus_via', 'Tipus via', 'Carrer')}
            <div className="col-span-2">{fi('inst_nom_via', 'Nom de la via')}</div>
            {fi('inst_numero', 'Núm.')}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {fi('inst_bloc', 'Bloc')} {fi('inst_escala', 'Escala')} {fi('inst_pis', 'Pis')} {fi('inst_porta', 'Porta')} {fi('inst_cp', 'C.P.')}
          </div>
          <div className="grid grid-cols-2 gap-4">{fi('inst_poblacio', 'Població')}</div>
        </motion.div>

        {/* Característiques */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card space-y-4">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Característiques</h3>

          <div className="space-y-1.5">
            <span className="field-label">Tipus d'actuació</span>
            <div className="flex gap-2 flex-wrap">
              {TIPUS_ACTUACIO_OPT.map(o => (
                <button key={o.value} onClick={() => upd('tipus_actuacio', o.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${cert.tipus_actuacio === o.value ? 'bg-amber-500 border-amber-500 text-black font-semibold' : 'border-ink-500 text-slate-400 hover:border-amber-500/40'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="field-label">Classificació</span>
              <div className="flex gap-2">
                {CLASSIFICACIO_OPT.map(o => (
                  <button key={o.value} onClick={() => upd('classificacio', o.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${cert.classificacio === o.value ? 'bg-amber-500 border-amber-500 text-black font-semibold' : 'border-ink-500 text-slate-400 hover:border-amber-500/40'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {fi('cups', 'CUPS', 'ES0021...')}
          </div>

          <div className="space-y-1.5">
            <span className="field-label">Ús de la instal·lació</span>
            <div className="flex gap-2 flex-wrap">
              {US_INSTALLACIO_OPT.map(o => (
                <button key={o.value} onClick={() => upd('us_installacio', o.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${cert.us_installacio === o.value ? 'bg-amber-500 border-amber-500 text-black font-semibold' : 'border-ink-500 text-slate-400 hover:border-amber-500/40'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dades tècniques */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card space-y-4">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Dades tècniques</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="Potència màxima (kW)" type="number" step="0.01" value={String(cert.potencia_kw || '')} onChange={(e) => upd('potencia_kw', parseFloat(e.target.value) || 0)} className="font-mono" />
            {fi('tensio_v', 'Tensió (V)', '230')}
            {fi('seccio_lga_mm2', 'Secció LGA (mm²)', '10')}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="Nombre de circuits" type="number" value={String(cert.num_circuits || '')} onChange={(e) => upd('num_circuits', parseInt(e.target.value) || 0)} className="font-mono" />
            <FormInput label="Calibre fusibles CGP (A)" type="number" value={String(cert.calibre_fusibles_cgp_a || '')} onChange={(e) => upd('calibre_fusibles_cgp_a', parseInt(e.target.value) || 0)} className="font-mono" />
            {fi('material_conductor', 'Material conductor', 'Coure')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Resist. aïllament amb terra (MΩ)" type="number" step="0.1" value={String(cert.resist_aillament_mt || '')} onChange={(e) => upd('resist_aillament_mt', parseFloat(e.target.value) || 0)} className="font-mono" />
            <FormInput label="Resist. entre conductors (MΩ)" type="number" step="0.1" value={String(cert.resist_aillament_conductors_mt || '')} onChange={(e) => upd('resist_aillament_conductors_mt', parseFloat(e.target.value) || 0)} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Resistència a terra (Ω)" type="number" step="0.1" value={String(cert.resist_terra_ohm || '')} onChange={(e) => upd('resist_terra_ohm', parseFloat(e.target.value) || 0)} className="font-mono" />
            <FormInput label="Intensitat IGA (A)" type="number" value={String(cert.intensitat_iga_a || '')} onChange={(e) => upd('intensitat_iga_a', parseInt(e.target.value) || 0)} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Ubicació de comptadors"
              value={cert.ubicacio_comptadors}
              onChange={(e) => upd('ubicacio_comptadors', e.target.value)}
              placeholder="Armari, Escala, Altra..."
            />
            <div className="flex flex-col gap-1.5">
              <label className="field-label">Subministrament complementari?</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="subministrament"
                    checked={cert.te_subministrament_complementari === true}
                    onChange={() => updBool('te_subministrament_complementari', true)}
                    className="accent-amber-500"
                  /> Sí
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="subministrament"
                    checked={cert.te_subministrament_complementari === false}
                    onChange={() => updBool('te_subministrament_complementari', false)}
                    className="accent-amber-500"
                  /> No
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Observacions i data */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card space-y-4">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Certificació</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Data de signatura" type="date" value={cert.data_signatura} onChange={(e) => upd('data_signatura', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Observacions</label>
            <textarea rows={3} className="input-box w-full resize-none" value={cert.observacions} onChange={(e) => upd('observacions', e.target.value)} placeholder="Observacions opcionals…" />
          </div>
          <div className="bg-ink-700/30 border border-ink-600/50 rounded-xl p-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">La signatura del certificat</span> prové del teu perfil d'instal·lador.
              Si no has configurat la signatura, aneu a <button type="button" onClick={() => navigate('/perfil')} className="text-amber-400 underline">Perfil</button> per afegir-la.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
