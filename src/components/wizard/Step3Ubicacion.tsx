import { useWizardStore } from '../../stores/wizardStore'
import { FormInput, FormSelect } from '../ui/FormField'
import type { TipoSolicitud, UsoFinca } from '../../types'
import { LABELS_TIPO_SOLICITUD, LABELS_USO_FINCA } from '../../types'

interface Props { onNext: () => void }

const TIPO_OPTIONS = (Object.entries(LABELS_TIPO_SOLICITUD) as [TipoSolicitud, string][])
  .map(([value, label]) => ({ value, label }))

const USO_OPTIONS = (Object.entries(LABELS_USO_FINCA) as [UsoFinca, string][])
  .map(([value, label]) => ({ value, label }))

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

  return (
    <div className="space-y-4">
      <div className="card space-y-5">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Tipo de solicitud
        </h3>
        <FormSelect
          label="Tipo de solicitud"
          value={u.tipo_solicitud ?? ''}
          onChange={(e) => setUbicacion({ tipo_solicitud: e.target.value as TipoSolicitud })}
          options={TIPO_OPTIONS}
          placeholder="Selecciona el tipo..."
          required
        />
        <FormSelect
          label="Uso de la finca"
          value={u.uso_finca ?? ''}
          onChange={(e) => setUbicacion({ uso_finca: e.target.value as UsoFinca })}
          options={USO_OPTIONS}
          placeholder="Selecciona el uso..."
          required
        />
      </div>

      <div className="card space-y-5">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Dirección del suministro
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Dirección" value={u.direccion} onChange={set('direccion')} placeholder="C/ Major" className="col-span-2" />
          <FormInput label="Número" value={u.numero} onChange={set('numero')} placeholder="5" />
        </div>
        <FormInput label="Piso / Puerta" value={u.piso_puerta} onChange={set('piso_puerta')} placeholder="2º 1ª (opcional)" />
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Municipio" value={u.municipio} onChange={set('municipio')} className="col-span-2" required />
          <FormInput label="C.P." value={u.cp} onChange={set('cp')} placeholder="08001" />
        </div>
        <FormSelect label="Provincia" value={u.provincia} onChange={set('provincia') as any} options={PROVINCIAS} placeholder="Selecciona..." />
      </div>

      <div className="card space-y-5">
        <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">
          Datos registrales <span className="text-slate-600 normal-case font-body font-normal ml-1">(opcionales)</span>
        </h3>
        <FormInput label="Referencia catastral" value={u.referencia_catastral} onChange={set('referencia_catastral')} hint="Disponible en la sede electrónica del Catastro" />
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="UTM X (ETRS89)" value={u.utm_x} onChange={set('utm_x')} className="font-mono" />
          <FormInput label="UTM Y" value={u.utm_y} onChange={set('utm_y')} className="font-mono" />
          <FormInput label="Huso" value={u.utm_huso} onChange={set('utm_huso')} placeholder="31" className="font-mono" />
        </div>
        <FormInput label="CUPS (si es ampliación)" value={u.cups} onChange={set('cups')} hint="Solo si se trata de una ampliación de suministro existente" />
      </div>
    </div>
  )
}
