// src/components/projecte/DocumentCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Loader2, Trash2, Check, X } from 'lucide-react'

export type DocStatus = {
  id: string
  estat: 'esborrany' | 'finalitzat'
  nom?: string
  route: string
  onOpen?: () => void
  onDelete?: () => Promise<void>
}

interface Props {
  icon: React.ReactNode
  label: string
  sublabel: string
  docs: DocStatus[]
  onCreate: () => Promise<void>
}

export function DocumentCard({ icon, label, sublabel, docs, onCreate }: Props) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    setCreating(true)
    try { await onCreate() }
    catch { /* errors handled by parent */ }
    setCreating(false)
  }

  const handleConfirmDelete = async (d: DocStatus) => {
    if (!d.onDelete) return
    if (!window.confirm('Aquesta acció eliminarà el document de manera permanent i no es pot desfer. Continuar?')) {
      setConfirmingId(null)
      return
    }
    setDeletingId(d.id)
    try { await d.onDelete() }
    finally { setDeletingId(null); setConfirmingId(null) }
  }

  return (
    <div className="card flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-slate-200 text-[13px] leading-tight">{label}</div>
          <div className="text-[11px] text-slate-500 font-body mt-0.5">{sublabel}</div>
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-1.5">
            <button
              onClick={() => d.onOpen ? d.onOpen() : navigate(d.route)}
              className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-500 bg-ink-800/40 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"
            >
              <span className={`text-[10px] font-mono font-semibold ${d.estat === 'finalitzat' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {d.estat === 'finalitzat' ? '✓' : '○'}
              </span>
              <span className="text-[12px] text-slate-300 font-body flex-1 truncate">{d.nom || 'Sense nom'}</span>
              <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            </button>

            {d.onDelete && (
              confirmingId === d.id ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleConfirmDelete(d)}
                    disabled={deletingId === d.id}
                    title="Confirmar eliminació"
                    className="p-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    {deletingId === d.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === d.id}
                    title="Cancel·lar"
                    className="p-1.5 rounded-lg border border-ink-500 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(d.id)}
                  title="Eliminar"
                  className="p-1.5 rounded-lg border border-ink-500 text-slate-600 hover:text-red-400 hover:border-red-500/40 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="btn-ghost text-sm w-full justify-center"
      >
        {creating
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creant…</>
          : <><Plus className="w-3.5 h-3.5" /> {docs.length === 0 ? 'Crear' : 'Afegir'}</>}
      </button>
    </div>
  )
}
