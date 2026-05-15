import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { User, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { LABELS_TIPO_INSTALADOR } from '../../types'

interface Props { onNext: () => void }

export function Step8Redactor({ onNext: _onNext }: Props) {
  const { instalador } = useAuthStore()
  const navigate = useNavigate()

  if (!instalador?.nombre_completo) {
    return (
      <div className="space-y-4">
        <div className="card border-amber-800/40 bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-body font-semibold text-amber-300 mb-1">Perfil incompleto</h3>
              <p className="text-[13px] text-amber-400/70 font-body mb-4">
                Necesitas completar tu perfil de instalador antes de generar la memoria.
                Los datos del redactor son obligatorios en la sección 8.
              </p>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="btn-primary text-sm px-4 py-2"
              >
                <User className="w-3.5 h-3.5" />
                Completar perfil
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fields = [
    { label: 'Nombre completo', value: instalador.nombre_completo },
    { label: 'DNI / NIE', value: instalador.dni_nie },
    { label: 'Tipo de instalador', value: LABELS_TIPO_INSTALADOR[instalador.tipo] },
    { label: 'Nº de carnet', value: instalador.numero_carnet },
    ...(instalador.numero_colegiado ? [{ label: 'Nº colegiado', value: instalador.numero_colegiado }] : []),
    ...(instalador.empresa_nombre ? [{ label: 'Empresa', value: instalador.empresa_nombre }] : []),
    ...(instalador.empresa_cif ? [{ label: 'CIF empresa', value: instalador.empresa_cif }] : []),
    ...(instalador.empresa_telefono ? [{ label: 'Teléfono', value: instalador.empresa_telefono }] : []),
    ...(instalador.empresa_email ? [{ label: 'Email', value: instalador.empresa_email }] : []),
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
              <span className="font-body text-[13px] text-slate-300 text-right">
                {f.value}
              </span>
            </div>
          ))}
        </div>

        {instalador.firma_url && (
          <div className="mt-4 pt-4 border-t border-ink-600/40">
            <span className="field-label mb-2">Firma registrada</span>
            <div className="h-16 rounded-xl border border-ink-500 bg-white/5 flex items-center justify-center overflow-hidden">
              <img src={instalador.firma_url} className="h-14 object-contain" alt="Firma" />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/perfil')}
        className="btn-ghost text-sm w-full justify-center"
      >
        <User className="w-3.5 h-3.5" />
        Modificar datos del perfil
      </button>

      <div className="card bg-ink-700/20 border-ink-600/30">
        <p className="text-[12px] text-slate-600 font-body leading-relaxed text-center">
          Al pulsar <strong className="text-slate-500">Finalizar y generar PDF</strong>, la memoria quedará
          guardada como finalizada y podrás descargar el documento.
        </p>
      </div>
    </div>
  )
}
