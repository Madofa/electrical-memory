import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Cloud, FileDown, Loader2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { useAuthStore } from '../stores/authStore'
import { getCertificatElec1, updateCertificatElec1, type CertificatElec1 } from '../lib/supabase-elec1'
import { CertificatElec1PDF } from '../components/pdf/CertificatElec1PDF'
import { FormInput, FormSelect } from '../components/ui/FormField'
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
  { value: "a) Instal·lacions industrials", label: "a) Industrial" },
  { value: "b) Instal·lacions comercials i oficines", label: "b) Comercial / Oficina" },
  { value: "c) Instal·lacions d'ús públic i espectacles", label: "c) Ús públic" },
  { value: "d) Garatges i aparcaments", label: "d) Garatge / Aparcament" },
  { value: "e) Piscines i fonts", label: "e) Piscines / Fonts" },
  { value: "f) Instal·lacions d'habitatges", label: "f) Habitatge" },
  { value: "g) Instal·lacions en locals amb risc d'incendi o explosió", label: "g) Local amb risc" },
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

  useEffect(() => {
    if (!id) return
    getCertificatElec1(id).then(({ data, error }) => {
      if (error || !data) { toast.error('Document no trobat'); navigate('/elec1'); return }
      setCert(data as CertificatElec1)
      setLoading(false)
    })
  }, [id, navigate])

  const upd = (field: keyof CertificatElec1, value: string | number) => {
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
    if (!cert || !instalador) return
    setExporting(true)
    try {
      const blob = await pdf(<CertificatElec1PDF cert={cert} instalador={instalador} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elec1_${(cert.nom || 'document').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch { toast.error('Error en exportar') }
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
        <button onClick={() => navigate('/elec1')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
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
          <div className="grid grid-cols-3 gap-4">
            <FormSelect label="Tipus d'actuació" value={cert.tipus_actuacio} onChange={(e) => upd('tipus_actuacio', e.target.value)} options={TIPUS_ACTUACIO_OPT} />
            {fi('cups', 'CUPS', 'ES0021...')}
            <FormSelect label="Classificació" value={cert.classificacio} onChange={(e) => upd('classificacio', e.target.value)} options={CLASSIFICACIO_OPT} />
          </div>
          <FormSelect label="Ús de la instal·lació" value={cert.us_installacio} onChange={(e) => upd('us_installacio', e.target.value)} options={US_INSTALLACIO_OPT} />
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
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="Resist. aïllament (MΩ)" type="number" step="0.1" value={String(cert.resist_aillament_mt || '')} onChange={(e) => upd('resist_aillament_mt', parseFloat(e.target.value) || 0)} className="font-mono" />
            <FormInput label="Resistència a terra (Ω)" type="number" step="0.1" value={String(cert.resist_terra_ohm || '')} onChange={(e) => upd('resist_terra_ohm', parseFloat(e.target.value) || 0)} className="font-mono" />
            <FormInput label="Intensitat IGA (A)" type="number" value={String(cert.intensitat_iga_a || '')} onChange={(e) => upd('intensitat_iga_a', parseInt(e.target.value) || 0)} className="font-mono" />
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
              Si no has configurat la signatura, aneu a <button onClick={() => window.open('/perfil')} className="text-amber-400 underline">Perfil</button> per afegir-la.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
