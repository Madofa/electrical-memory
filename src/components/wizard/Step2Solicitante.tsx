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
      <FormInput label="Raó social / Nom" value={s.razon_social} onChange={set('razon_social')} />
      <FormInput label="CIF / NIF" value={s.cif_nif} onChange={set('cif_nif')} />
      <div className="divider my-1" />
      <FormInput label="Adreça fiscal" value={s.direccion} onChange={set('direccion')} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Municipi" value={s.municipio} onChange={set('municipio')} />
        <FormInput label="Codi postal" value={s.cp} onChange={set('cp')} />
      </div>
      <div className="divider my-1" />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Telèfon" value={s.telefono} onChange={set('telefono')} type="tel" />
        <FormInput label="Correu electrònic" value={s.email} onChange={set('email')} type="email" />
      </div>
    </div>
  )
}
