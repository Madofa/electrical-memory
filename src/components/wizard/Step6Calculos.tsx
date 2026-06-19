import { useEffect } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormInput, FormToggle } from '../ui/FormField'
import { Calculator, CheckCircle } from 'lucide-react'

interface Props { onNext: () => void }

export function Step6Calculos({ onNext: _onNext }: Props) {
  const { data, setIncluirCalculos, setCalculos, getPotenciaTotal } = useWizardStore()
  const c = data.calculos

  const potenciaTotal = getPotenciaTotal()

  // Auto-calcular intensitat. Monofàsic (V ≤ 250): I = P/V. Trifàsic (V > 250): I = P/(√3·V)
  useEffect(() => {
    if (!c.potencia_demanda_kw || !c.tension_nominal_v) return
    const esTrifasic = c.tension_nominal_v > 250
    const I = esTrifasic
      ? (c.potencia_demanda_kw * 1000) / (Math.sqrt(3) * c.tension_nominal_v)
      : (c.potencia_demanda_kw * 1000) / c.tension_nominal_v
    setCalculos({ intensidad_nominal_a: Math.round(I * 10) / 10 })
  }, [c.potencia_demanda_kw, c.tension_nominal_v])

  const setField = (field: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCalculos({ [field]: parseFloat(e.target.value) || 0 })

  const setStrField = (field: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCalculos({ [field]: e.target.value })

  return (
    <div className="space-y-4">
      <FormToggle
        label="Incloure justificació de càlculs"
        description="Afegeix la secció 6 amb càlcul de la LGA, secció de cable, caiguda de tensió i proteccions."
        checked={data.incluir_calculos}
        onChange={setIncluirCalculos}
      />

      {!data.incluir_calculos ? (
        <div className="card border-ink-600/30 flex items-start gap-3 py-5">
          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-slate-500 font-body leading-relaxed">
            Sense càlculs justificatius. La secció 6 no apareixerà al document.
            Pots activar-la si e-distribució la requereix per al teu tipus de sol·licitud.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5" /> Dades de càlcul
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="field-label">Potència total instal·lada (kW)</span>
                <div className="input-field font-mono text-amber-400/80 cursor-default select-none">
                  {potenciaTotal.toFixed(2)}
                </div>
              </div>
              <FormInput label="Coef. de simultaneïtat" value={c.coef_simultaneidad || ''} onChange={setField('coef_simultaneidad')} type="number" step="0.01" min="0" max="1" placeholder="0,60" className="font-mono" />
              <FormInput label="Potència de demanda (kW)" value={c.potencia_demanda_kw || ''} onChange={setField('potencia_demanda_kw')} type="number" step="0.01" min="0" placeholder="Pot. total × coef." className="font-mono" />
              <FormInput label="Tensió nominal (V)" value={c.tension_nominal_v || ''} onChange={setField('tension_nominal_v')} type="number" placeholder="400" className="font-mono" />
              <div className="col-span-2">
                <span className="field-label">Intensitat nominal (A) — calculada</span>
                <div className="input-field font-mono text-amber-400/80 cursor-default">
                  {c.intensidad_nominal_a ? `${c.intensidad_nominal_a} A` : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              Línia general d'alimentació (LGA)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Material conductor" value={(c.material_conductor as string) || ''} onChange={setStrField('material_conductor')} placeholder="Coure (Cu)" />
              <FormInput label="Tipus de conductor" value={(c.tipo_conductor as string) || ''} onChange={setStrField('tipo_conductor')} placeholder="RZ1-K 0,6/1 kV" />
              <FormInput label="Tipus d'instal·lació" value={(c.tipo_instalacion as string) || ''} onChange={setStrField('tipo_instalacion')} placeholder="Tub encastat a la paret" className="col-span-2" />
              <FormInput label="Longitud estimada (m)" value={c.longitud_m || ''} onChange={setField('longitud_m')} type="number" step="0.1" placeholder="15" className="font-mono" />
              <FormInput label="Secció normalitzada (mm²)" value={c.seccion_normalizada_mm2 || ''} onChange={setField('seccion_normalizada_mm2')} type="number" step="0.5" placeholder="16" className="font-mono" />
              <FormInput label="Caiguda de tensió (%)" value={c.caida_tension_pct || ''} onChange={setField('caida_tension_pct')} type="number" step="0.01" placeholder="0,85" className="font-mono" hint="Límit ITC-BT-14: 1,5%" />
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
              Proteccions
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <FormInput label="ICP recomanat (A)" value={c.icp_a || ''} onChange={setField('icp_a')} type="number" placeholder="63" className="font-mono" />
              <FormInput label="Diferencial (A)" value={c.diferencial_a || ''} onChange={setField('diferencial_a')} type="number" placeholder="40" className="font-mono" />
              <FormInput label="Sensibilitat (mA)" value={c.diferencial_ma || ''} onChange={setField('diferencial_ma')} type="number" placeholder="30" className="font-mono" />
            </div>
            <FormInput label="Posada a terra" value={(c.puesta_tierra_desc as string) || ''} onChange={setStrField('puesta_tierra_desc')} placeholder="Descripció del sistema de posada a terra…" />
          </div>
        </div>
      )}
    </div>
  )
}
