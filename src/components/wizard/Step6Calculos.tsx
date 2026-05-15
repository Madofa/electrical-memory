import { useEffect } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormInput, FormToggle } from '../ui/FormField'
import { Calculator, CheckCircle } from 'lucide-react'

interface Props { onNext: () => void }

export function Step6Calculos({ onNext: _onNext }: Props) {
  const { data, setIncluirCalculos, setCalculos, getPotenciaTotal } = useWizardStore()
  const c = data.calculos

  const potenciaTotal = getPotenciaTotal()

  // Auto-calcular intensidad cuando cambia potencia demanda
  useEffect(() => {
    if (!c.potencia_demanda_kw || !c.tension_nominal_v) return
    const I = (c.potencia_demanda_kw * 1000) / (Math.sqrt(3) * c.tension_nominal_v)
    setCalculos({ intensidad_nominal_a: Math.round(I * 10) / 10 })
  }, [c.potencia_demanda_kw, c.tension_nominal_v])

  const setField = (field: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCalculos({ [field]: parseFloat(e.target.value) || 0 })

  const setStrField = (field: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCalculos({ [field]: e.target.value })

  return (
    <div className="space-y-4">
      <FormToggle
        label="Incluir justificación de cálculos"
        description="Añade la sección 6 con cálculo de la LGA, sección de cable, caída de tensión y protecciones."
        checked={data.incluir_calculos}
        onChange={setIncluirCalculos}
      />

      {!data.incluir_calculos ? (
        <div className="card border-ink-600/30 flex items-start gap-3 py-5">
          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-slate-500 font-body leading-relaxed">
            Sin cálculos justificativos. La sección 6 no aparecerá en el documento.
            Puedes activarla si e-distribución la requiere para tu tipo de solicitud.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5" /> Datos de cálculo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="field-label">Potencia total instalada (kW)</span>
                <div className="input-field font-mono text-amber-400/80 cursor-default select-none">
                  {potenciaTotal.toFixed(2)}
                </div>
              </div>
              <FormInput label="Coef. de simultaneidad" value={c.coef_simultaneidad || ''} onChange={setField('coef_simultaneidad')} type="number" step="0.01" min="0" max="1" placeholder="0,60" className="font-mono" />
              <FormInput label="Potencia de demanda (kW)" value={c.potencia_demanda_kw || ''} onChange={setField('potencia_demanda_kw')} type="number" step="0.01" min="0" placeholder="Pot. total × coef." className="font-mono" />
              <FormInput label="Tensión nominal (V)" value={c.tension_nominal_v || ''} onChange={setField('tension_nominal_v')} type="number" placeholder="400" className="font-mono" />
              <div className="col-span-2">
                <span className="field-label">Intensidad nominal (A) — calculada</span>
                <div className="input-field font-mono text-amber-400/80 cursor-default">
                  {c.intensidad_nominal_a ? `${c.intensidad_nominal_a} A` : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              Línea general de alimentación (LGA)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Material conductor" value={(c.material_conductor as string) || ''} onChange={setStrField('material_conductor')} placeholder="Cobre (Cu)" />
              <FormInput label="Tipo de conductor" value={(c.tipo_conductor as string) || ''} onChange={setStrField('tipo_conductor')} placeholder="RZ1-K 0,6/1 kV" />
              <FormInput label="Tipo de instalación" value={(c.tipo_instalacion as string) || ''} onChange={setStrField('tipo_instalacion')} placeholder="Tubo empotrado en pared" className="col-span-2" />
              <FormInput label="Longitud estimada (m)" value={c.longitud_m || ''} onChange={setField('longitud_m')} type="number" step="0.1" placeholder="15" className="font-mono" />
              <FormInput label="Sección normalizada (mm²)" value={c.seccion_normalizada_mm2 || ''} onChange={setField('seccion_normalizada_mm2')} type="number" step="0.5" placeholder="16" className="font-mono" />
              <FormInput label="Caída de tensión (%)" value={c.caida_tension_pct || ''} onChange={setField('caida_tension_pct')} type="number" step="0.01" placeholder="0,85" className="font-mono" hint="Límite ITC-BT-14: 1,5%" />
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              Protecciones
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormInput label="ICP recomendado (A)" value={c.icp_a || ''} onChange={setField('icp_a')} type="number" placeholder="63" className="font-mono" />
              <FormInput label="Diferencial (A)" value={c.diferencial_a || ''} onChange={setField('diferencial_a')} type="number" placeholder="40" className="font-mono" />
              <FormInput label="Sensibilidad (mA)" value={c.diferencial_ma || ''} onChange={setField('diferencial_ma')} type="number" placeholder="30" className="font-mono" />
            </div>
            <FormInput label="Puesta a tierra" value={(c.puesta_tierra_desc as string) || ''} onChange={setStrField('puesta_tierra_desc')} placeholder="Descripción del sistema de puesta a tierra..." />
          </div>
        </div>
      )}
    </div>
  )
}
