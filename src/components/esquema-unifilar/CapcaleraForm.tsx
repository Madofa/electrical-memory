import { useEsquemaStore } from '../../stores/esquemaUnifilarStore'

export function CapcaleraForm() {
  const { capcalera, setCapcalera } = useEsquemaStore()

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60">
        Capçalera del document
      </span>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
          placeholder="Empresa distribuïdora"
          value={capcalera.empresa_distribuidora}
          onChange={(e) => setCapcalera({ empresa_distribuidora: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
            placeholder="Secció (ex: 10mm²)"
            value={capcalera.seccio_connexio}
            onChange={(e) => setCapcalera({ seccio_connexio: e.target.value })}
          />
          <input
            className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
            placeholder="Tensió (230V)"
            value={capcalera.tensio}
            onChange={(e) => setCapcalera({ tensio: e.target.value })}
          />
        </div>
        <input
          className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
          placeholder="Emplaçament"
          value={capcalera.emplacament}
          onChange={(e) => setCapcalera({ emplacament: e.target.value })}
        />
        <input
          className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
          placeholder="Titular"
          value={capcalera.titular}
          onChange={(e) => setCapcalera({ titular: e.target.value })}
        />
      </div>
    </div>
  )
}
