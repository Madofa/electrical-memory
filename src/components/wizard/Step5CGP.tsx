import { useState } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormTextarea, FormInput } from '../ui/FormField'
import { PhotoUpload } from '../ui/PhotoUpload'
import { Trash2, Info, ImagePlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { compressImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'

interface Props { onNext: () => void }

const TIPOS_CGP_NUEVA = [
  'Caja General de Protección (CGP)',
  'Caja General de Protección y Medida (CGPM)',
  'Equipo de Medida en Fachada',
]

const TIPOS_CENTRALIZACION = [
  'Centralización de contadores en portería',
  'Centralización de contadores en local técnico',
  'Centralización en armario de fachada',
]

export function Step5CGP({ onNext: _onNext }: Props) {
  const { data, setElementoFrontera, addFoto, updateFoto, removeFoto } = useWizardStore()
  const ef = { ...data.elementoFrontera, fotos: data.elementoFrontera.fotos ?? [] }
  const centralizado = data.ubicacion.centralizacion_existente
  const tipos = centralizado ? TIPOS_CENTRALIZACION : TIPOS_CGP_NUEVA
  const tituloDesc = centralizado
    ? 'Ubicación del módulo de contador asignado'
    : 'Descripción de la ubicación propuesta'
  const placeholderDesc = centralizado
    ? 'Indica dónde está el armario de centralización y el módulo asignado a este suministro (planta, número de módulo, etiqueta...).'
    : 'Describe dónde se propone instalar el elemento frontera: fachada, portal, local técnico...'
  const ayudaFotos = centralizado
    ? 'Sube foto del módulo de contador asignado y/o del armario de centralización completo.'
    : 'Sube fotos de la fachada, plano de la propuesta y cualquier elemento de la acometida.'
  const [dragging, setDragging] = useState(false)

  const readBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })

  const handleFiles = async (files: FileList) => {
    const arr = Array.from(files)
    if (arr.length > 1) toast.loading(`Procesando ${arr.length} fotos...`, { id: 'upload' })

    await Promise.all(arr.map(async (file) => {
      const raw = await readBase64(file)
      const base64 = await compressImage(raw)
      const id = crypto.randomUUID()
      addFoto({ id, titulo: '', base64 })
    }))

    if (arr.length > 1) toast.success(`${arr.length} fotos añadidas`, { id: 'upload' })
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-5">
        {centralizado && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
            <Info className="w-3.5 h-3.5 text-emerald-400/70 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-300/80 font-body leading-relaxed">
              La finca ya dispone de centralización de contadores. Se aprovecha la existente; basta con identificar el módulo del nuevo suministro.
            </p>
          </div>
        )}
        <div>
          <span className="field-label">{centralizado ? 'Tipo de centralización existente' : 'Tipo de elemento frontera propuesto'}</span>
          <div className="space-y-2 mt-2">
            {tipos.map((tipo) => (
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
          label={tituloDesc}
          value={ef.descripcion}
          onChange={(e) => setElementoFrontera({ descripcion: e.target.value })}
          placeholder={placeholderDesc}
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
            <Info className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/70 font-body leading-relaxed">
              {ayudaFotos}
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
                <div className="flex-1">
                  <FormInput
                    label="¿Qué muestra esta foto?"
                    value={foto.titulo}
                    onChange={(e) => updateFoto(foto.id, { titulo: e.target.value })}
                    placeholder="Cuadro de contadores, Fachada, CGP existente, Croquis..."
                  />
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
                onChange={(b64) => updateFoto(foto.id, { base64: b64 })}
                onClear={() => updateFoto(foto.id, { base64: '' })}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div
          className={`relative flex flex-col items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed transition-all duration-200
            ${dragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-ink-500 bg-ink-800/40 hover:border-amber-500/40 hover:bg-amber-500/5'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
          }}
        >
          <ImagePlus className={`w-6 h-6 transition-colors ${dragging ? 'text-amber-400' : 'text-slate-500'}`} />
          <div className="text-center pointer-events-none">
            <p className={`text-[13px] font-body font-semibold transition-colors ${dragging ? 'text-amber-300' : 'text-slate-400'}`}>
              {dragging ? 'Suelta las fotos aquí' : 'Arrastra fotos aquí'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">o haz clic para seleccionar</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
          />
        </div>
      </div>
    </div>
  )
}
