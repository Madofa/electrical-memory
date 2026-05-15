import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Zap, AlertCircle, ChevronDown, ChevronUp, Sparkles, Loader2, Camera } from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import type { Receptor, GradoElectrificacion, UsoFinca } from '../../types'
import { FormInput, FormSelect } from '../ui/FormField'
import { analizarFotoReceptores } from '../../lib/gemini'
import { compressImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'

interface Props { onNext: () => void }

type Preset = { label: string; concepto: string; grado: GradoElectrificacion; tension: string; potencia_kw: number; hint?: string }

const ALL_PRESETS: Preset[] = [
  { label: 'Vivienda básica',   concepto: 'Vivienda',        grado: 'basica',  tension: '230 V',       potencia_kw: 5.75, hint: 'Grado básico (mín. 5,75 kW)' },
  { label: 'Vivienda elevada',  concepto: 'Vivienda',        grado: 'elevada', tension: '230 V',       potencia_kw: 9.20, hint: 'Grado elevado (mín. 9,20 kW)' },
  { label: 'Trastero',          concepto: 'Trastero',        grado: '',        tension: '230 V',       potencia_kw: 0 },
  { label: 'Garaje / Parking',  concepto: 'Garaje',          grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Zonas comunes',     concepto: 'Zonas comunes',   grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Ascensor',          concepto: 'Ascensor',        grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Local comercial',   concepto: 'Local comercial', grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Oficina',           concepto: 'Oficina',         grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Uso industrial',    concepto: 'Uso industrial',  grado: '',        tension: '3×230/400 V', potencia_kw: 0 },
  { label: 'Otro',              concepto: '',                grado: '',        tension: '230 V',       potencia_kw: 0 },
]

const PRESETS_BY_USO: Record<UsoFinca | 'default', string[]> = {
  vivienda:        ['Vivienda básica', 'Vivienda elevada', 'Trastero', 'Garaje / Parking', 'Zonas comunes', 'Ascensor', 'Otro'],
  local_comercial: ['Local comercial', 'Oficina', 'Zonas comunes', 'Otro'],
  garaje:          ['Garaje / Parking', 'Zonas comunes', 'Ascensor', 'Otro'],
  industrial:      ['Uso industrial', 'Oficina', 'Otro'],
  otro:            ['Local comercial', 'Uso industrial', 'Garaje / Parking', 'Zonas comunes', 'Otro'],
  default:         ALL_PRESETS.map(p => p.label),
}

function getPresets(uso: string | null): Preset[] {
  const keys = (uso ? PRESETS_BY_USO[uso as UsoFinca] : undefined) ?? PRESETS_BY_USO.default
  return keys.map((k: string) => ALL_PRESETS.find(p => p.label === k)!).filter(Boolean)
}

const GRADO_OPTIONS: { value: GradoElectrificacion; label: string }[] = [
  { value: 'basica',   label: 'Básica — 5,75 kW (ITC-BT-10)' },
  { value: 'elevada',  label: 'Elevada — 9,20 kW (ITC-BT-10)' },
  { value: '',         label: 'Sin grado (locales, garajes, servicios...)' },
]

const TENSION_OPTIONS = [
  { value: '230 V',       label: '230 V (monofásico)' },
  { value: '3×230/400 V', label: '3×230/400 V (trifásico)' },
]

function newReceptor(preset?: Preset): Receptor {
  return {
    id: crypto.randomUUID(),
    concepto: preset?.concepto ?? '',
    aclarador: '',
    potencia_kw: preset?.potencia_kw ?? 0,
    tension: preset?.tension ?? '230 V',
    grado: preset?.grado ?? '',
  }
}

export function Step4Receptores({ onNext: _onNext }: Props) {
  const { data, addReceptor, updateReceptor, removeReceptor, getPotenciaTotal } = useWizardStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(data.receptores.length === 0)
  const [analyzingIA, setAnalyzingIA] = useState(false)
  const [draggingIA, setDraggingIA] = useState(false)

  const presets = getPresets(data.ubicacion.uso_finca)

  const potenciaTotal = getPotenciaTotal()
  const needsTrifasico = potenciaTotal > 15

  const handleAdd = (preset?: Preset) => {
    const r = newReceptor(preset)
    addReceptor(r)
    setExpanded(r.id)
    setShowPresets(false)
  }

  const upd = (id: string) => (field: keyof Receptor) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = field === 'potencia_kw' ? parseFloat(e.target.value) || 0 : e.target.value
    updateReceptor(id, { [field]: value })
  }

  const esVivienda = (concepto: string) =>
    concepto.toLowerCase().includes('vivienda')

  const handleAnalyzeFiles = async (fileList: FileList) => {
    setAnalyzingIA(true)
    let totalAdded = 0
    try {
      await Promise.all(Array.from(fileList).map(async (file) => {
        const raw = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const base64 = await compressImage(raw)
        const result = await analizarFotoReceptores(base64)
        ;(result.receptores ?? []).forEach((r) => {
          addReceptor({
            id: crypto.randomUUID(),
            concepto: r.concepto ?? '',
            aclarador: '',
            potencia_kw: r.potencia_kw ?? 0,
            tension: r.tension ?? '230 V',
            grado: (r.grado ?? '') as GradoElectrificacion,
          })
          totalAdded++
        })
      }))
      if (totalAdded === 0) {
        toast('No he podido identificar receptores — añádelos manualmente', { icon: '🤷' })
      } else {
        setShowPresets(false)
        toast.success(`IA añadió ${totalAdded} receptor${totalAdded > 1 ? 'es' : ''}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(`Error IA: ${msg}`, { duration: 8000 })
    }
    setAnalyzingIA(false)
  }

  return (
    <div className="space-y-4">
      {/* Totalizador */}
      <div className="card border-amber-500/20 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-display font-semibold tracking-widest uppercase text-amber-500/60 mb-0.5">
            Potencia total solicitada
          </p>
          <p className="font-mono font-semibold text-2xl text-amber-400">
            {potenciaTotal.toFixed(2).replace('.', ',')} kW
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500 font-mono">
            {needsTrifasico ? '3×230/400 V · Trifásico' : '230 V · Monofásico'}
          </p>
          <p className="text-[11px] text-slate-600 font-mono">
            {data.receptores.length} {data.receptores.length === 1 ? 'elemento' : 'elementos'}
          </p>
        </div>
      </div>

      {needsTrifasico && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-400 text-xs font-body">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Potencia &gt;15 kW → suministro trifásico obligatorio (ITC-BT-10)
        </div>
      )}

      {/* Zona drag-and-drop IA */}
      {analyzingIA ? (
        <div className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl
                        border-2 border-dashed border-amber-500/30 bg-amber-500/5 text-amber-400 text-[12px] font-body font-semibold opacity-70">
          <Loader2 className="w-4 h-4 animate-spin" /> Analizando con IA...
        </div>
      ) : (
        <div
          className={`relative flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed transition-all duration-200
            ${draggingIA
              ? 'border-amber-400 bg-amber-500/15 scale-[1.01]'
              : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'}`}
          onDragOver={(e) => { e.preventDefault(); setDraggingIA(true) }}
          onDragEnter={(e) => { e.preventDefault(); setDraggingIA(true) }}
          onDragLeave={() => setDraggingIA(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDraggingIA(false)
            if (e.dataTransfer.files.length) handleAnalyzeFiles(e.dataTransfer.files)
          }}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <Camera className="w-4 h-4 text-amber-400" />
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <p className={`text-[12px] font-body font-semibold ${draggingIA ? 'text-amber-300' : 'text-amber-400'}`}>
              {draggingIA ? 'Suelta los planos aquí' : 'Subir plano / esquema → IA extrae receptores'}
            </p>
          </div>
          <p className="text-[10px] text-amber-500/50 font-mono pointer-events-none">
            Arrastra o haz clic · puedes soltar varios a la vez
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { if (e.target.files?.length) handleAnalyzeFiles(e.target.files) }}
          />
        </div>
      )}

      {/* Lista */}
      <AnimatePresence>
        {data.receptores.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`card cursor-pointer transition-all duration-200 ${expanded === r.id ? 'border-amber-500/30' : 'hover:border-ink-400'}`}>
              <div className="flex items-center gap-3" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-500/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-semibold text-slate-200 text-[13px] truncate">
                    {r.concepto || `Elemento ${i + 1}`}
                  </div>
                  <div className="text-[11px] text-amber-500/60 font-mono">
                    {r.potencia_kw > 0
                      ? `${r.potencia_kw.toFixed(2)} kW · ${r.tension}${r.grado === 'basica' ? ' · Básica' : r.grado === 'elevada' ? ' · Elevada' : ''}`
                      : 'Sin potencia definida'}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {expanded === r.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeReceptor(r.id) }}
                    className="btn-ghost p-1.5 text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 mt-4 border-t border-[#1e2d47] space-y-4">
                      <FormInput
                        label="Tipo de espacio"
                        value={r.concepto}
                        onChange={upd(r.id)('concepto')}
                        placeholder="Vivienda, Almacén 1, Local..."
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput
                          label="Potencia solicitada (kW)"
                          value={r.potencia_kw || ''}
                          onChange={upd(r.id)('potencia_kw')}
                          type="number"
                          step="0.01"
                          min="0"
                          className="font-mono"
                          hint="Editable — independiente del grado"
                        />
                        <FormSelect
                          label="Tensión"
                          value={r.tension}
                          onChange={upd(r.id)('tension') as any}
                          options={TENSION_OPTIONS}
                        />
                      </div>
                      {esVivienda(r.concepto) && (
                        <FormSelect
                          label="Grado de electrificación (ITC-BT-10)"
                          value={r.grado}
                          onChange={upd(r.id)('grado') as any}
                          options={GRADO_OPTIONS}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Botón añadir + presets */}
      <button
        type="button"
        onClick={() => setShowPresets(!showPresets)}
        className="btn-secondary w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Añadir elemento
        {showPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleAdd(p)}
                  className="text-left px-3 py-2.5 rounded-xl border border-ink-500 bg-ink-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200"
                >
                  <div className="font-body font-semibold text-[12px] text-slate-300">{p.label}</div>
                  <div className="text-[10px] font-mono text-amber-500/50">
                    {p.hint ?? (p.potencia_kw > 0 ? `${p.potencia_kw.toFixed(2)} kW` : 'Potencia a definir')}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
