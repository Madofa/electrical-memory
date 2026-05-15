import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ExternalLink, Save } from 'lucide-react'
import { LABELS_TIPO_INSTALADOR } from '../../types'
import type { TipoInstalador } from '../../types'
import { FormInput, FormSelect } from '../ui/FormField'
import { upsertInstalador } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Props { onNext: () => void }

const TIPO_OPTIONS = (Object.entries(LABELS_TIPO_INSTALADOR) as [TipoInstalador, string][])
  .map(([value, label]) => ({ value, label }))

export function Step8Redactor({ onNext: _onNext }: Props) {
  const { user, instalador, setInstalador } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre_completo: instalador?.nombre_completo ?? '',
    dni_nie: instalador?.dni_nie ?? '',
    tipo: (instalador?.tipo ?? 'IBTM') as TipoInstalador,
    numero_carnet: instalador?.numero_carnet ?? '',
    empresa_nombre: instalador?.empresa_nombre ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const perfilCompleto = !!(instalador?.nombre_completo && instalador?.dni_nie && instalador?.numero_carnet)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = { ...instalador, ...form, id: user.id }
      await upsertInstalador(updated)
      setInstalador(updated as any)
      toast.success('Datos guardados')
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  if (perfilCompleto) {
    const fields = [
      { label: 'Nombre completo', value: instalador!.nombre_completo },
      { label: 'DNI / NIE', value: instalador!.dni_nie },
      { label: 'Tipo', value: LABELS_TIPO_INSTALADOR[instalador!.tipo] },
      { label: 'Nº carnet', value: instalador!.numero_carnet },
      ...(instalador!.numero_colegiado ? [{ label: 'Nº colegiado', value: instalador!.numero_colegiado }] : []),
      ...(instalador!.empresa_nombre ? [{ label: 'Empresa', value: instalador!.empresa_nombre }] : []),
    ]

    return (
      <div className="space-y-4">
        <div className="card border-emerald-800/30">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="font-display font-semibold text-xs tracking-widest uppercase text-emerald-500">
              Datos del redactor listos
            </span>
          </div>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between py-2 border-b border-ink-600/40 last:border-0">
                <span className="text-[11px] font-display font-semibold tracking-widest uppercase text-amber-500/60 w-36 flex-shrink-0">
                  {f.label}
                </span>
                <span className="font-body text-[13px] text-slate-300 text-right">{f.value}</span>
              </div>
            ))}
          </div>
          {instalador!.firma_url && (
            <div className="mt-4 pt-4 border-t border-ink-600/40">
              <span className="field-label mb-2">Firma registrada</span>
              <div className="h-16 rounded-xl border border-ink-500 bg-white/5 flex items-center justify-center overflow-hidden">
                <img src={instalador!.firma_url} className="h-14 object-contain" alt="Firma" />
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => navigate('/perfil')} className="btn-ghost text-sm w-full justify-center">
          <ExternalLink className="w-3.5 h-3.5" />
          Editar perfil completo (firma, logo...)
        </button>
      </div>
    )
  }

  // Perfil incompleto — formulario inline
  return (
    <div className="space-y-5">
      <div className="card space-y-5">
        <div>
          <h3 className="font-body font-semibold text-slate-200 mb-1">Tus datos como instalador</h3>
          <p className="text-[12px] text-slate-500 font-body">
            Aparecerán en la sección 8 del documento. Si los dejas en blanco, el PDF tendrá líneas vacías para rellenar a mano.
          </p>
        </div>

        <FormInput label="Nombre y apellidos" value={form.nombre_completo} onChange={set('nombre_completo')} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="DNI / NIE" value={form.dni_nie} onChange={set('dni_nie')} />
          <FormInput label="Nº de carnet / autorización" value={form.numero_carnet} onChange={set('numero_carnet')} />
        </div>
        <FormSelect label="Tipo de instalador" value={form.tipo} onChange={set('tipo') as any} options={TIPO_OPTIONS} />
        <FormInput label="Empresa (opcional)" value={form.empresa_nombre} onChange={set('empresa_nombre')} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 justify-center"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Guardando...' : 'Guardar mis datos'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="btn-ghost text-sm px-4"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Perfil completo
          </button>
        </div>
      </div>

      <div className="card bg-ink-700/20 border-ink-600/30">
        <p className="text-[12px] text-slate-500 font-body leading-relaxed">
          Si no rellenas los datos ahora, la sección 8 del PDF tendrá líneas en blanco para firmar a mano.
        </p>
      </div>
    </div>
  )
}
