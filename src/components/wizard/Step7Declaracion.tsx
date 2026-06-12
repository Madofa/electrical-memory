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
            <h3 className="font-body font-semibold text-slate-200 mb-1">Declaració responsable</h3>
            <p className="text-[12px] text-slate-500 font-body">
              Text obligatori segons e-distribució. Apareixerà literalment al document.
            </p>
          </div>
        </div>

        {/* Texto legal de la MTD, en català */}
        <div className="bg-ink-700/40 border border-ink-600/50 rounded-xl p-5 mb-6">
          <p className="text-[12px] text-slate-400 font-body leading-relaxed text-justify italic">
            "En qualitat de sol·licitant, declaro sota la meva responsabilitat que la instal·lació
            elèctrica objecte de la sol·licitud d'accés i connexió complirà amb la normativa de
            qualitat de l'ona vigent i buits de tensió."
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-3">
            I perquè així consti als efectes oportuns, signo la present a <strong className="text-slate-400">[lloc]</strong>, el <strong className="text-slate-400">[data]</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <FormInput
            label="Lloc de signatura"
            value={data.lugarFirma}
            onChange={(e) => setFirma(e.target.value, data.fechaFirma)}
            placeholder="Barcelona"
          />
          <FormInput
            label="Data"
            value={data.fechaFirma}
            onChange={(e) => setFirma(data.lugarFirma, e.target.value)}
            type="date"
          />
        </div>
      </div>

      <div className="card bg-ink-700/20 border-ink-600/30">
        <p className="text-[12px] text-slate-600 font-body leading-relaxed">
          L'espai de signatura del sol·licitant apareixerà en blanc al PDF perquè el pugui signar
          a mà o amb signatura electrònica la persona sol·licitant.
        </p>
      </div>
    </div>
  )
}
