import { motion, AnimatePresence } from 'framer-motion'
import type { WizardData } from '../../types'
import { LABELS_TIPO_SOLICITUD, LABELS_USO_FINCA } from '../../types'
import { formatDate } from '../../lib/supabase'

interface Props {
  data: WizardData
  currentStep: number
}

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col border-b border-[#1e2d47]/60 pb-1.5 mb-1.5"
    >
      <span className="text-[9px] font-display font-semibold tracking-widest uppercase text-amber-500/50">{label}</span>
      <span className="text-[11px] font-body text-slate-400 leading-tight">{value}</span>
    </motion.div>
  )
}

function PreviewSection({ title, children, show }: { title: string; children: React.ReactNode; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div className="text-[9px] font-display font-bold tracking-widest uppercase text-amber-500/70 mb-2 flex items-center gap-1.5">
            <div className="h-px flex-1 bg-amber-500/20" />
            {title}
            <div className="h-px flex-1 bg-amber-500/20" />
          </div>
          <div className="space-y-0">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function MiniPreview({ data, currentStep }: Props) {
  const { solicitante: s, ubicacion: u, receptores, elementoFrontera: ef } = data
  const potenciaTotal = receptores.reduce((sum, r) => sum + (r.potencia_kw || 0), 0)

  const hasRef = !!data.referencia_interna
  const hasSolicitante = !!(s.razon_social || s.cif_nif)
  const hasUbicacion = !!(u.municipio || u.direccion)
  const hasReceptores = receptores.length > 0
  const fotos = ef.fotos ?? []
  const hasCGP = !!(ef.descripcion || fotos.length)
  const hasFirma = !!(data.lugarFirma && data.fechaFirma)

  const isEmpty = !hasRef && !hasSolicitante && !hasUbicacion && !hasReceptores

  return (
    <div className="p-4 h-full">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[9px] font-display font-bold tracking-widest uppercase text-amber-500/50 mb-1">
          Vista previa del documento
        </p>
        {/* Miniature document header */}
        <div className="border border-[#1e2d47] rounded-lg p-3 bg-[#0f1729]/60">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-5 rounded bg-ink-600/60 flex items-center justify-center">
              <span className="text-[8px] text-slate-600">LOGO</span>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-display font-bold text-slate-400 leading-tight">MEMORIA TÉCNICA</div>
              <div className="text-[8px] text-slate-600 font-mono">Instalación BT</div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-amber-500/70">
            {data.referencia_interna || '——————'}
            <span className="text-slate-600 ml-2">{formatDate(data.fechaFirma)}</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-6">
          <div className="text-[10px] text-slate-600 font-body leading-relaxed">
            El documento se irá<br />completando aquí<br />conforme avances.
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <PreviewSection title="§1 Solicitud" show={hasRef || hasUbicacion}>
            <PreviewRow label="Tipo" value={u.tipo_solicitud ? LABELS_TIPO_SOLICITUD[u.tipo_solicitud] : undefined} />
            <PreviewRow label="Uso" value={u.uso_finca ? LABELS_USO_FINCA[u.uso_finca] : undefined} />
            {potenciaTotal > 0 && (
              <PreviewRow label="Potencia" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />
            )}
          </PreviewSection>

          <PreviewSection title="§2 Solicitante" show={hasSolicitante}>
            <PreviewRow label="Nombre" value={s.razon_social} />
            <PreviewRow label="NIF/CIF" value={s.cif_nif} />
            <PreviewRow label="Municipio" value={s.municipio} />
          </PreviewSection>

          <PreviewSection title="§3 Ubicación" show={hasUbicacion}>
            <PreviewRow
              label="Dirección"
              value={[u.direccion, u.numero, u.piso_puerta].filter(Boolean).join(' ')}
            />
            <PreviewRow label="Municipio" value={[u.municipio, u.cp].filter(Boolean).join(' ')} />
            <PreviewRow label="Provincia" value={u.provincia} />
          </PreviewSection>

          <PreviewSection title="§4 Receptores" show={hasReceptores}>
            {receptores.map((r) => (
              <PreviewRow
                key={r.id}
                label={r.concepto || '—'}
                value={r.potencia_kw ? `${r.potencia_kw.toFixed(2)} kW · ${r.tension}` : undefined}
              />
            ))}
            <div className="pt-1 flex justify-between items-center border-t border-amber-500/10 mt-1">
              <span className="text-[9px] font-display font-bold uppercase text-amber-500/60">Total</span>
              <span className="text-[10px] font-mono text-amber-400">{potenciaTotal.toFixed(2)} kW</span>
            </div>
          </PreviewSection>

          <PreviewSection title="§5 CGP" show={hasCGP}>
            <PreviewRow label="Elemento" value={ef.tipo_elemento} />
            {fotos.filter((f) => f.base64).slice(0, 1).map((f) => (
              <div key={f.id} className="rounded-md overflow-hidden border border-ink-600/50 mt-1.5 mb-2">
                <img src={f.base64} className="w-full h-16 object-cover opacity-60" />
              </div>
            ))}
          </PreviewSection>

          <PreviewSection title="§7 Declaración" show={hasFirma}>
            <PreviewRow label="Lugar y fecha" value={`${data.lugarFirma}, a ${formatDate(data.fechaFirma)}`} />
          </PreviewSection>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-4 pt-3 border-t border-[#1e2d47]">
        <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1">
          <span>Completado</span>
          <span>{Math.round(currentStep / 7 * 100)}%</span>
        </div>
        <div className="h-1 rounded-full bg-ink-600 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-amber-500"
            animate={{ width: `${(currentStep / 7) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
