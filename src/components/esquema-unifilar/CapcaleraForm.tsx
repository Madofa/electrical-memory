import { useEsquemaStore } from '../../stores/esquemaUnifilarStore'
import { useAuthStore } from '../../stores/authStore'

export function CapcaleraForm() {
  const { capcalera, setCapcalera } = useEsquemaStore()
  const { instalador } = useAuthStore()

  const field = (label: string, hint: string, value: string, onChange: (v: string) => void) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-display tracking-widest uppercase text-amber-500/50">{label}</span>
      <input
        className="bg-ink-800 border border-ink-500 text-[12px] text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40"
        placeholder={hint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60">
        Peu del document
      </span>
      <div className="grid grid-cols-2 gap-2">
        {field('Empresa distribuïdora', 'ex: Endesa, e-distribució...', capcalera.empresa_distribuidora, (v) => setCapcalera({ empresa_distribuidora: v }))}
        <div className="grid grid-cols-2 gap-2">
          {field('Secció LGA', 'ex: 10mm²', capcalera.seccio_connexio, (v) => setCapcalera({ seccio_connexio: v }))}
          {field('Tensió', '230V / 400V', capcalera.tensio, (v) => setCapcalera({ tensio: v }))}
        </div>
        {field('Emplaçament (adreça de la instal·lació)', 'Carrer, núm, CP, població del CLIENT', capcalera.emplacament, (v) => setCapcalera({ emplacament: v }))}
        {field('Titular (propietari / client)', 'Nom del propietari de la instal·lació', capcalera.titular, (v) => setCapcalera({ titular: v }))}
      </div>
      {instalador && (
        <p className="text-[10px] text-slate-500 font-body">
          Instal·lador: <span className="text-slate-400">{instalador.nombre_completo}</span>
          {instalador.numero_carnet ? <span className="text-slate-500"> · RASIC {instalador.numero_carnet}</span> : null}
          <span className="text-slate-600"> — ve del teu perfil</span>
        </p>
      )}
    </div>
  )
}
