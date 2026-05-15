import { useRef, useState } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormTextarea, FormInput } from '../ui/FormField'
import { PhotoUpload } from '../ui/PhotoUpload'
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { analizarFotoCGP } from '../../lib/gemini'
import toast from 'react-hot-toast'

interface Props { onNext: () => void }

const TIPOS_CGP = [
  'Caja General de Protección (CGP)',
  'Caja General de Protección y Medida (CGPM)',
  'Equipo de Medida en Fachada',
]

export function Step5CGP({ onNext: _onNext }: Props) {
  const { data, setElementoFrontera, addFoto, updateFoto, removeFoto } = useWizardStore()
  const ef = { ...data.elementoFrontera, fotos: data.elementoFrontera.fotos ?? [] }
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
  const addFotoInputRef = useRef<HTMLInputElement>(null)

  const readBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

  const analizarYRellenar = async (fotoId: string, base64: string) => {
    setAnalyzing((s) => new Set(s).add(fotoId))
    try {
      const result = await analizarFotoCGP(base64)

      // Rellena título con la etiqueta detectada
      if (result.notas) updateFoto(fotoId, { titulo: result.notas })

      // Rellena campos del formulario si los detecta (sin sobreescribir si ya están)
      const updates: Record<string, string> = {}
      if (result.tipo_elemento && !data.elementoFrontera.tipo_elemento) updates.tipo_elemento = result.tipo_elemento
      if (result.descripcion && !data.elementoFrontera.descripcion) updates.descripcion = result.descripcion
      if (Object.keys(updates).length > 0) setElementoFrontera(updates)
    } catch {
      // silencioso — la foto queda igual, el usuario rellena a mano
    }
    setAnalyzing((s) => { const n = new Set(s); n.delete(fotoId); return n })
  }

  const handleFiles = async (files: FileList) => {
    const arr = Array.from(files)
    const toastId = arr.length > 1 ? toast.loading(`Subiendo ${arr.length} fotos...`) : undefined

    await Promise.all(arr.map(async (file) => {
      const base64 = await readBase64(file)
      const id = crypto.randomUUID()
      addFoto({ id, titulo: '', base64 })
      analizarYRellenar(id, base64) // análisis en paralelo, sin bloquear
    }))

    if (toastId) toast.dismiss(toastId)
    if (arr.length > 1) toast.success(`${arr.length} fotos añadidas — analizando con IA...`)
    if (addFotoInputRef.current) addFotoInputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-5">
        <div>
          <span className="field-label">Tipo de elemento frontera</span>
          <div className="space-y-2 mt-2">
            {TIPOS_CGP.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setElementoFrontera({ tipo_elemento: tipo })}
                className={`
                  w-full text-left px-4 py-3 rounded-xl border text-[13px] font-body
                  transition-all duration-200
                  ${ef.tipo_elemento === tipo
                    ? 'border-amber-500/40 bg-amber-500/8 text-amber-300'
                    : 'border-ink-500 bg-ink-700/30 text-slate-400 hover:border-ink-400'}
                `}
              >
                <span className={`mr-2 ${ef.tipo_elemento === tipo ? 'text-amber-500' : 'text-slate-600'}`}>
                  {ef.tipo_elemento === tipo ? '◉' : '○'}
                </span>
                {tipo}
              </button>
            ))}
          </div>
        </div>

        <FormTextarea
          label="Descripción de la ubicación propuesta"
          value={ef.descripcion}
          onChange={(e) => setElementoFrontera({ descripcion: e.target.value })}
          placeholder="Describe dónde se propone instalar el elemento frontera: fachada, portal, local técnico..."
        />
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
            Fotos de la instalación
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">{ef.fotos.length} adjuntos</span>
        </div>

        {ef.fotos.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/70 font-body leading-relaxed">
              Sube fotos del cuadro de portería, la acometida, croquis o cualquier elemento de la instalación.
              La IA los identifica y rellena los campos automáticamente.
            </p>
          </div>
        )}

        <AnimatePresence>
          {ef.fotos.map((foto) => (
            <motion.div
              key={foto.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border border-ink-500 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <FormInput
                    label="¿Qué muestra esta foto?"
                    value={foto.titulo}
                    onChange={(e) => updateFoto(foto.id, { titulo: e.target.value })}
                    placeholder="Cuadro de contadores, Fachada, CGP existente, Croquis..."
                  />
                  {analyzing.has(foto.id) && (
                    <div className="absolute right-3 top-7 flex items-center gap-1 text-amber-500/70">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px] font-mono">IA...</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFoto(foto.id)}
                  className="btn-ghost p-2 text-slate-600 hover:text-red-400 mt-5 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <PhotoUpload
                label=""
                value={foto.base64}
                onChange={(b64) => {
                  updateFoto(foto.id, { base64: b64 })
                  if (b64) analizarYRellenar(foto.id, b64)
                }}
                onClear={() => updateFoto(foto.id, { base64: '' })}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => addFotoInputRef.current?.click()}
          className="btn-secondary w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Añadir fotos
          <span className="text-[10px] text-slate-500 font-mono ml-1">(puedes seleccionar varias)</span>
        </button>
        <input
          ref={addFotoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
        />
      </div>
    </div>
  )
}
