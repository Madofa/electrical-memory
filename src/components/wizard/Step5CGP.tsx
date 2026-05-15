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
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const addFotoInputRef = useRef<HTMLInputElement>(null)

  const handleAddFoto = () => {
    addFotoInputRef.current?.click()
  }

  const handleAddFotoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      addFoto({ id: crypto.randomUUID(), titulo: '', base64: reader.result as string })
    }
    reader.readAsDataURL(file)
    if (addFotoInputRef.current) addFotoInputRef.current.value = ''
  }

  const handleAnalizar = async (fotoId: string, base64: string) => {
    setAnalyzing(fotoId)
    try {
      const result = await analizarFotoCGP(base64)

      const updates: Record<string, string> = {}
      if (result.tipo_elemento) updates.tipo_elemento = result.tipo_elemento
      if (result.descripcion) updates.descripcion = result.descripcion

      if (Object.keys(updates).length > 0) {
        setElementoFrontera(updates)
        toast.success('IA ha rellenado los campos detectados')
      } else {
        toast('No he podido identificar el elemento — rellena manualmente', { icon: '🤷' })
      }

      if (result.notas) {
        const fotoActual = ef.fotos.find((f) => f.id === fotoId)
        if (fotoActual && !fotoActual.titulo) {
          updateFoto(fotoId, { titulo: result.notas })
        }
      }
    } catch {
      toast.error('Error al analizar la imagen')
    }
    setAnalyzing(null)
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
            Fotografías y croquis
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">{ef.fotos.length} adjuntos</span>
        </div>

        {/* Hint IA */}
        {ef.fotos.length === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/70 font-body leading-relaxed">
              Sube una foto y la IA detectará automáticamente el tipo de elemento y su ubicación.
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
                <FormInput
                  label="Título / descripción"
                  value={foto.titulo}
                  onChange={(e) => updateFoto(foto.id, { titulo: e.target.value })}
                  placeholder="Ej: Fachada actual, Propuesta CGP, Croquis planta..."
                  className="flex-1"
                />
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
                onChange={(b64) => updateFoto(foto.id, { base64: b64 })}
                onClear={() => updateFoto(foto.id, { base64: '' })}
              />

              {/* Botón Analizar con IA — visible solo cuando hay imagen */}
              <AnimatePresence>
                {foto.base64 && (
                  <motion.button
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    type="button"
                    onClick={() => handleAnalizar(foto.id, foto.base64)}
                    disabled={analyzing === foto.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                               border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10
                               text-amber-400 text-[12px] font-body font-semibold
                               transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing === foto.id
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando con IA...</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Analizar con IA → rellenar campos</>
                    }
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        <button type="button" onClick={handleAddFoto} className="btn-secondary w-full justify-center">
          <Plus className="w-4 h-4" />
          Añadir foto o croquis
        </button>
        <input
          ref={addFotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddFotoFile(f) }}
        />
      </div>
    </div>
  )
}
