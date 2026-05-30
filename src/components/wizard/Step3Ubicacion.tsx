import { useState } from 'react'
import { useWizardStore } from '../../stores/wizardStore'
import { FormInput, FormSelect } from '../ui/FormField'
import type { TipoSolicitud, UsoFinca } from '../../types'
import { Zap, TrendingUp, Settings, RotateCcw, Home, ShoppingBag, Car, Factory, CircleDot, ChevronDown, ChevronUp, Wrench, Package, Briefcase, Building2 } from 'lucide-react'

interface Props { onNext: () => void }

const TIPO_CARDS: { value: TipoSolicitud; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'nuevo_suministro',   label: 'Nou subministrament',     icon: Zap,        desc: 'Finca nova sense escomesa' },
  { value: 'ampliacion_potencia',label: 'Ampliar potència',        icon: TrendingUp, desc: 'Augmentar potència contractada' },
  { value: 'modificacion',       label: 'Modificació',             icon: Settings,   desc: 'Canvis en instal·lació existent' },
  { value: 'reanudacion',        label: 'Represa',                 icon: RotateCcw,  desc: 'Reactivar subministrament tallat' },
]

const USO_CARDS: { value: UsoFinca; label: string; icon: React.ElementType }[] = [
  { value: 'vivienda',        label: 'Habitatge',  icon: Home },
  { value: 'local_comercial', label: 'Comercial',  icon: ShoppingBag },
  { value: 'taller',          label: 'Taller',     icon: Wrench },
  { value: 'almacen',         label: 'Magatzem',   icon: Package },
  { value: 'oficina',         label: 'Oficina',    icon: Briefcase },
  { value: 'garaje',          label: 'Garatge',    icon: Car },
  { value: 'industrial',      label: 'Industrial', icon: Factory },
  { value: 'comunidad',       label: 'Comunitat',  icon: Building2 },
  { value: 'otro',            label: 'Altre',      icon: CircleDot },
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
          Tipus de sol·licitud
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
          Ús de la finca
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
          Adreça del subministrament
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Carrer / Avinguda" value={u.direccion} onChange={set('direccion')} className="col-span-2" />
          <FormInput label="Número" value={u.numero} onChange={set('numero')} />
        </div>
        <FormInput label="Pis / Porta (opcional)" value={u.piso_puerta} onChange={set('piso_puerta')} />
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Municipi" value={u.municipio} onChange={set('municipio')} className="col-span-2" />
          <FormInput label="C.P." value={u.cp} onChange={set('cp')} />
        </div>
        <FormSelect label="Província" value={u.provincia} onChange={set('provincia')} options={PROVINCIAS} placeholder="Tria…" />
      </div>

      {/* Estado actual de la instalación — adaptativo */}
      <div className="card space-y-4">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Estat de la instal·lació
        </h3>

        <ToggleRow
          label="La instal·lació interior ja està legalitzada?"
          help="Hi ha butlletí (CIE) i/o número RITSIC. Permet anar per la via simplificada de l'alta de subministrament."
          value={u.instalacion_legalizada}
          onChange={(v) => setUbicacion({ instalacion_legalizada: v })}
        />

        {u.instalacion_legalizada && (
          <FormInput
            label="Número RITSIC / CIE"
            value={u.numero_ritsic}
            onChange={set('numero_ritsic')}
            placeholder="Ex. 10.000.123/2025"
            className="font-mono"
          />
        )}

        <ToggleRow
          label="Ja hi ha centralització de comptadors a l'edifici?"
          help="Armari comú amb diversos comptadors a porteria o local tècnic. Si n'hi ha, s'aprofita i no cal proposar una CGP nova."
          value={u.centralizacion_existente}
          onChange={(v) => setUbicacion({ centralizacion_existente: v })}
        />

        <ToggleRow
          label="La finca té diversos subministraments?"
          help="Edifici amb diversos habitatges, locals, garatge comunitari… Activa el càlcul amb coeficient de simultaneïtat."
          value={u.multiples_suministros}
          onChange={(v) => setUbicacion({ multiples_suministros: v })}
        />

        {(u.tipo_solicitud === 'ampliacion_potencia' || u.tipo_solicitud === 'reanudacion' || u.tipo_solicitud === 'modificacion') && (
          <FormInput
            label="CUPS del subministrament existent"
            value={u.cups}
            onChange={set('cups')}
            placeholder="ES0021000000000000XX0F"
            className="font-mono"
          />
        )}
      </div>

      {/* Datos registrales — colapsable */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-300 transition-colors font-body w-full"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Dades registrals opcionals (cadastre, UTM, CUPS)
      </button>

      {showAdvanced && (
        <div className="card space-y-4">
          <FormInput label="Referència cadastral" value={u.referencia_catastral} onChange={set('referencia_catastral')} />
          <div className="grid grid-cols-3 gap-4">
            <FormInput label="UTM X" value={u.utm_x} onChange={set('utm_x')} className="font-mono" />
            <FormInput label="UTM Y" value={u.utm_y} onChange={set('utm_y')} className="font-mono" />
            <FormInput label="Fus" value={u.utm_huso} onChange={set('utm_huso')} placeholder="31" className="font-mono" />
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label, help, value, onChange,
}: { label: string; help?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-body text-slate-200">{label}</p>
        {help && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{help}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 ${
          value ? 'bg-amber-500' : 'bg-ink-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
