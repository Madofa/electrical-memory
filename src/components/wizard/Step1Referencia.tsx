import { useWizardStore } from '../../stores/wizardStore'
import { FormInput } from '../ui/FormField'
import { FileText, Hash } from 'lucide-react'

interface Props { onNext: () => void }

export function Step1Referencia({ onNext: _onNext }: Props) {
  const { data, setReferencia } = useWizardStore()

  return (
    <div className="space-y-6">
      <div className="card border-amber-500/10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-body font-semibold text-slate-200 mb-1">Referencia interna</h3>
            <p className="text-[13px] text-slate-500 font-body mb-4">
              Código identificador de tu expediente. Aparecerá en la cabecera del documento.
            </p>
            <FormInput
              label="Referencia"
              value={data.referencia_interna}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder=""
              hint=""
            />
          </div>
        </div>
      </div>

      <div className="card border-ink-600/50 bg-ink-700/30">
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-slate-500 font-body leading-relaxed">
            La referencia se genera automáticamente si la dejas en blanco. Puedes modificarla en cualquier momento
            sin afectar al contenido del documento.
          </p>
        </div>
      </div>
    </div>
  )
}
