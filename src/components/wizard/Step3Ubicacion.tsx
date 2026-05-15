import { useState } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormInput, FormSelect } from '../ui/FormField'
import type { TipoSolicitud, UsoFinca } from '../../types'
import { Zap, TrendingUp, Settings, RotateCcw, Home, ShoppingBag, Car, Factory, CircleDot, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { onNext: () => void }

const TIPO_CARDS: { value: TipoSolicitud; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'nuevo_suministro',   label: 'Nuevo suministro',       icon: Zap,        desc: 'Finca nueva sin acometida' },
  { value: 'ampliacion_potencia',label: 'Ampliar potencia',        icon: TrendingUp, desc: 'Aumentar potencia contratada' },
  { value: 'modificacion',       label: 'Modificación',            icon: Settings,   desc: 'Cambios en instalación existente' },
  { value: 'reanudacion',        label: 'Reanudación',             icon: RotateCcw,  desc: 'Reanudar suministro cortado' },
]

const USO_CARDS: { value: UsoFinca; label: string; icon: React.ElementType }[] = [
  { value: 'vivienda',        label: 'Vivienda',   icon: Home },
  { value: 'local_comercial', label: 'Comercial',  icon: ShoppingBag },
  { value: 'garaje',          label: 'Garaje',     icon: Car },
  { value: 'industrial',      label: 'Industrial', icon: Factory },
  { value: 'otro',            label: 'Otro',       icon: CircleDot },
]

const PROVINCIAS = [
  'Álava','Albacete','Alicante','Almería','Asturias','Ávila','Badajoz','Barcelona',
  'Burgos','Cáceres','Cádiz','Cantabria','Castellón','Ciudad Real','Córdoba','Cuenca',
  'Girona','Granada','Guadalajara','Guipúzcoa','Huelva','Huesca','Islas Baleares',
  'Jaén','La Coruña','La Rioja','Las Palmas','León','Lleida','Lugo','Madrid','Málaga',
  'Murcia','Navarra','Orense','Palencia','Pontevedra','Salamanca','Santa Cruz de Tenerife',
  'Segovia','Sevilla','Soria','Tarragona','Teruel','Toledo','Valencia','Valladolid',
  'Vizcaya','Zamora','Zaragoza',
].map((p) => ({ value: p, label: p }))

export function Step3Ubicacion({ onNext: _onNext }: Props) {
  const { data, setUbicacion } = useWizardStore()
  const u = data.ubicacion
  const set = (field: keyof typeof u) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setUbicacion({ [field]: e.target.value })
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-5">
      {/* Tipo de solicitud */}
      <div className="card space-y-4">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Tipo de solicitud
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {TIPO_CARDS.map(({ value, label, icon: Icon, desc }) => {
            const active = u.tipo_solicitud === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setUbicacion({ tipo_solicitud: value })}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  active
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-ink-500 bg-ink-800 hover:border-ink-400 hover:bg-ink-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className={`font-body font-semibold text-sm ${active ? 'text-amber-300' : 'text-slate-300'}`}>
                  {label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Uso de la finca */}
      <div className="card space-y-4">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Uso de la finca
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {USO_CARDS.map(({ value, label, icon: Icon }) => {
            const active = u.uso_finca === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setUbicacion({ uso_finca: value })}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                  active
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-ink-500 bg-ink-800 hover:border-ink-400 hover:bg-ink-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className={`text-[11px] font-body font-semibold ${active ? 'text-amber-300' : 'text-slate-400'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dirección */}
      <div className="card space-y-4">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Dirección del suministro
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Calle / Avenida" value={u.direccion} onChange={set('direccion')} className="col-span-2" required />
          <FormInput label="Número" value={u.numero} onChange={set('numero')} />
        </div>
        <FormInput label="Piso / Puerta (opcional)" value={u.piso_puerta} onChange={set('piso_puerta')} />
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Municipio" value={u.municipio} onChange={set('municipio')} className="col-span-2" required />
          <FormInput label="C.P." value={u.cp} onChange={set('cp')} />
        </div>
        <FormSelect label="Provincia" value={u.provincia} onChange={set('provincia') as any} options={PROVINCIAS} placeholder="Selecciona..." />
      </div>

      {/* Datos registrales — colapsable */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-300 transition-colors font-body w-full"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Datos registrales opcionales (catastro, UTM, CUPS)
      </button>

      {showAdvanced && (
        <div className="card space-y-4">
          <FormInput label="Referencia catastral" value={u.referencia_catastral} onChange={set('referencia_catastral')} />
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="UTM X" value={u.utm_x} onChange={set('utm_x')} className="font-mono" />
            <FormInput label="UTM Y" value={u.utm_y} onChange={set('utm_y')} className="font-mono" />
            <FormInput label="Huso" value={u.utm_huso} onChange={set('utm_huso')} placeholder="31" className="font-mono" />
          </div>
          <FormInput label="CUPS (ampliaciones)" value={u.cups} onChange={set('cups')} />
        </div>
      )}
    </div>
  )
}
