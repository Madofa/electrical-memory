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
      <p className="text-[13px] text-slate-500 font-body mb-2">
        Datos de la persona o empresa que solicita el suministro eléctrico.
      </p>
      <FormInput label="Razón social / Nombre" value={s.razon_social} onChange={set('razon_social')} placeholder="Promotora Ejemplo S.L." required />
      <FormInput label="CIF / NIF" value={s.cif_nif} onChange={set('cif_nif')} placeholder="B-12345678" required />
      <div className="divider my-2" />
      <FormInput label="Dirección" value={s.direccion} onChange={set('direccion')} placeholder="C/ Major, 5" required />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Municipio" value={s.municipio} onChange={set('municipio')} required />
        <FormInput label="Código postal" value={s.cp} onChange={set('cp')} placeholder="08001" />
      </div>
      <div className="divider my-2" />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Teléfono" value={s.telefono} onChange={set('telefono')} type="tel" placeholder="93 XXX XX XX" />
        <FormInput label="Email" value={s.email} onChange={set('email')} type="email" placeholder="contacto@empresa.com" />
      </div>
    </div>
  )
}
