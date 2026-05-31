import { Plus, Trash2 } from 'lucide-react'
import { useEsquemaStore } from '../../stores/esquemaUnifilarStore'

const DIF_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899']

export function DiferencialPanel() {
  const { diferencials, circuits, addDiferencial, updateDiferencial, removeDiferencial, setIga, iga_amperatge } = useEsquemaStore()

  const countByDif = (id: string) => circuits.filter((c) => c.diferencial_grup === id).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60">
          Diferencials i IGA
        </span>
        <button
          type="button"
          onClick={addDiferencial}
          className="btn-ghost text-xs"
        >
          <Plus className="w-3 h-3" /> Diferencial
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {diferencials.map((d, i) => {
          const used = countByDif(d.id)
          const color = DIF_COLORS[i % DIF_COLORS.length]
          return (
            <div
              key={d.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-500 bg-ink-800/40"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 font-mono mb-1">Dif {i + 1} · {used} circuits</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    className="w-14 bg-ink-700 text-[13px] text-slate-200 font-mono rounded px-1.5 py-0.5 focus:outline-none"
                    value={d.amperatge}
                    onChange={(e) => updateDiferencial(d.id, { amperatge: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-[11px] text-slate-500">A</span>
                  <input
                    type="number"
                    className="w-14 bg-ink-700 text-[13px] text-slate-200 font-mono rounded px-1.5 py-0.5 ml-1 focus:outline-none"
                    value={d.sensibilitat_ma}
                    onChange={(e) => updateDiferencial(d.id, { sensibilitat_ma: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-[11px] text-slate-500">mA</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDiferencial(d.id)}
                disabled={diferencials.length <= 1}
                className="text-slate-600 hover:text-red-400 disabled:opacity-20"
                aria-label="Esborrar diferencial"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5">
        <span className="text-[11px] font-display font-semibold tracking-widest uppercase text-amber-500/80">IGA</span>
        <input
          type="number"
          className="w-16 bg-ink-700 text-[13px] text-amber-300 font-mono rounded px-1.5 py-0.5 ml-auto focus:outline-none"
          value={iga_amperatge}
          onChange={(e) => setIga(parseInt(e.target.value) || 0)}
        />
        <span className="text-[11px] text-amber-500/60">A</span>
      </div>
    </div>
  )
}
