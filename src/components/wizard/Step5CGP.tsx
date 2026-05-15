import { useWizardStore } from '../../stores/wizardStore'
import { FormTextarea } from '../ui/FormField'
import { PhotoUpload } from '../ui/PhotoUpload'

interface Props { onNext: () => void }

const TIPOS_CGP = [
  'Caja General de Protección (CGP)',
  'Caja General de Protección y Medida (CGPM)',
  'Equipo de Medida en Fachada',
]

export function Step5CGP({ onNext: _onNext }: Props) {
  const { data, setElementoFrontera } = useWizardStore()
  const ef = data.elementoFrontera
  const set = (field: keyof typeof ef) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setElementoFrontera({ [field]: e.target.value })

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
          onChange={set('descripcion')}
          placeholder="Describe dónde se propone instalar el elemento frontera: fachada, portal, local técnico..."
          hint="Texto libre que aparecerá en la sección 5 del documento"
        />
      </div>

      <div className="card space-y-5">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Fotografías y croquis
        </h3>
        <p className="text-[12px] text-slate-500 font-body -mt-2">
          Obligatorias para la presentación ante e-distribución.
        </p>

        <PhotoUpload
          label="Fotografía — punto de entrega de energía"
          value={ef.foto_punto_entrega_base64}
          onChange={(b64) => setElementoFrontera({ foto_punto_entrega_base64: b64 })}
          onClear={() => setElementoFrontera({ foto_punto_entrega_base64: '' })}
          hint="Estado actual de la fachada o punto de acometida"
        />

        <PhotoUpload
          label="Fotografía — propuesta de ubicación CGP"
          value={ef.foto_propuesta_cgp_base64}
          onChange={(b64) => setElementoFrontera({ foto_propuesta_cgp_base64: b64 })}
          onClear={() => setElementoFrontera({ foto_propuesta_cgp_base64: '' })}
          hint="Señala visualmente dónde irá el elemento frontera"
        />

        <PhotoUpload
          label="Croquis"
          value={ef.croquis_base64}
          onChange={(b64) => setElementoFrontera({ croquis_base64: b64 })}
          onClear={() => setElementoFrontera({ croquis_base64: '' })}
          hint="Plano o croquis de planta / alzado (opcional)"
        />
      </div>
    </div>
  )
}
