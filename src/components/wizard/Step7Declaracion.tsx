import { useWizardStore } from '../../stores/wizardStore'
import { FormInput } from '../ui/FormField'
import { ShieldCheck } from 'lucide-react'

interface Props { onNext: () => void }

export function Step7Declaracion({ onNext: _onNext }: Props) {
  const { data, setFirma } = useWizardStore()

  return (
    <div className="space-y-5">
      <div className="card border-amber-500/15">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-body font-semibold text-slate-200 mb-1">Declaración responsable</h3>
            <p className="text-[12px] text-slate-500 font-body">
              Texto obligatorio según e-distribución. Aparecerá literalmente en el documento.
            </p>
          </div>
        </div>

        {/* Texto legal */}
        <div className="bg-ink-700/40 border border-ink-600/50 rounded-xl p-5 mb-6">
          <p className="text-[12px] text-slate-400 font-body leading-relaxed text-justify italic">
            "En calidad de solicitante, declaro bajo mi responsabilidad que la instalación eléctrica
            objeto de la solicitud de acceso y conexión cumplirá con la normativa de calidad de la
            onda vigente y huecos de tensión."
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-3">
            Y para que conste a los efectos oportunos, firma la presente en <strong className="text-slate-400">[lugar]</strong>, a <strong className="text-slate-400">[fecha]</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FormInput
            label="Lugar de firma"
            value={data.lugarFirma}
            onChange={(e) => setFirma(e.target.value, data.fechaFirma)}
            placeholder="Barcelona"
            required
          />
          <FormInput
            label="Fecha"
            value={data.fechaFirma}
            onChange={(e) => setFirma(data.lugarFirma, e.target.value)}
            type="date"
            required
          />
        </div>
      </div>

      <div className="card bg-ink-700/20 border-ink-600/30">
        <p className="text-[12px] text-slate-600 font-body leading-relaxed">
          El espacio de firma del solicitante aparecerá en blanco en el PDF para que pueda ser
          firmado a mano o con firma electrónica por la persona solicitante.
        </p>
      </div>
    </div>
  )
}
