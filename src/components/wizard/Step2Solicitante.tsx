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
      <FormInput label="Razón social / Nombre" value={s.razon_social} onChange={set('razon_social')} required />
      <FormInput label="CIF / NIF" value={s.cif_nif} onChange={set('cif_nif')} required />
      <div className="divider my-1" />
      <FormInput label="Dirección" value={s.direccion} onChange={set('direccion')} required />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Municipio" value={s.municipio} onChange={set('municipio')} required />
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
