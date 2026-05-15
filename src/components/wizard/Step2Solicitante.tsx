import { useWizardStore } from '../../stores/wizardStore'
import { FormInput } from '../ui/FormField'

interface Props { onNext: () => void }

export function Step2Solicitante({ onNext: _onNext }: Props) {
  const { data, setSolicitante } = useWizardStore()
  const s = data.solicitante
  const set = (field: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSolicitante({ [field]: e.target.value })

  return (
    <div className="card space-y-5">
      <p className="text-[12px] text-amber-500/70 font-body bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
        Debe ser el <strong>propietario del inmueble</strong>. Si el solicitante es el inquilino, e-distribución exige adjuntar autorización del propietario.
      </p>
      <FormInput label="Razón social / Nombre" value={s.razon_social} onChange={set('razon_social')} />
      <FormInput label="CIF / NIF" value={s.cif_nif} onChange={set('cif_nif')} />
      <div className="divider my-1" />
      <FormInput label="Dirección" value={s.direccion} onChange={set('direccion')} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Municipio" value={s.municipio} onChange={set('municipio')} />
        <FormInput label="Código postal" value={s.cp} onChange={set('cp')} />
      </div>
      <div className="divider my-1" />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Teléfono" value={s.telefono} onChange={set('telefono')} type="tel" />
        <FormInput label="Email" value={s.email} onChange={set('email')} type="email" />
      </div>
    </div>
  )
}
