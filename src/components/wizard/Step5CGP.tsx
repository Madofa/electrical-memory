import { useWizardStore } from '../../stores/wizardStore'
import { FormTextarea, FormInput } from '../ui/FormField'
import { PhotoUpload } from '../ui/PhotoUpload'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props { onNext: () => void }

const TIPOS_CGP = [
  'Caja General de Protección (CGP)',
  'Caja General de Protección y Medida (CGPM)',
  'Equipo de Medida en Fachada',
]

export function Step5CGP({ onNext: _onNext }: Props) {
  const { data, setElementoFrontera, addFoto, updateFoto, removeFoto } = useWizardStore()
  const ef = { ...data.elementoFrontera, fotos: data.elementoFrontera.fotos ?? [] }

  const handleAddFoto = () => {
    addFoto({ id: crypto.randomUUID(), titulo: '', base64: '' })
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
            </motion.div>
          ))}
        </AnimatePresence>

        <button type="button" onClick={handleAddFoto} className="btn-secondary w-full justify-center">
          <Plus className="w-4 h-4" />
          Añadir foto o croquis
        </button>
      </div>
    </div>
  )
}
