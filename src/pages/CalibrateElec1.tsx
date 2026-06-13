import { useState } from 'react'

interface Marker {
  id: string
  name: string
  x: number
  y: number
  page: number
  screenX: number
  screenY: number
}

const IMG_SCALE = 2
const PAGE_HEIGHT_PTS = 842

const ALL_FIELDS = [
  // Titular
  { key: 'titular_nom',       label: 'Nom/Raó social titular' },
  { key: 'titular_nif',       label: 'NIF/DNI titular' },
  { key: 'titular_tipus_via', label: 'Titular – Tipus via' },
  { key: 'titular_nom_via',   label: 'Titular – Nom via' },
  { key: 'titular_numero',    label: 'Titular – Núm.' },
  { key: 'titular_bloc',      label: 'Titular – Bloc' },
  { key: 'titular_escala',    label: 'Titular – Escala' },
  { key: 'titular_pis',       label: 'Titular – Pis' },
  { key: 'titular_porta',     label: 'Titular – Porta' },
  { key: 'titular_cp',        label: 'Titular – C.P.' },
  { key: 'titular_poblacio',  label: 'Titular – Població' },
  { key: 'titular_tel',       label: 'Titular – Telèfon' },
  { key: 'titular_correu',    label: 'Titular – Correu' },
  // Empresa
  { key: 'empresa_nom',       label: 'Empresa – Nom/Raó social' },
  { key: 'empresa_rasic',     label: 'Empresa – RASIC' },
  { key: 'empresa_nif',       label: 'Empresa – NIF' },
  { key: 'instalador_nom',    label: 'Instal·lador – Nom' },
  { key: 'instalador_cat',    label: 'Instal·lador – Categoria' },
  { key: 'instalador_dni',    label: 'Instal·lador – DNI' },
  { key: 'empresa_tipus_via', label: 'Empresa – Tipus via' },
  { key: 'empresa_nom_via',   label: 'Empresa – Nom via' },
  { key: 'empresa_cp',        label: 'Empresa – C.P.' },
  { key: 'empresa_tel',       label: 'Empresa – Telèfon' },
  { key: 'empresa_correu',    label: 'Empresa – Correu' },
  // Instal·lació
  { key: 'inst_tipus_via',    label: 'Instal·lació – Tipus via' },
  { key: 'inst_nom_via',      label: 'Instal·lació – Nom via' },
  { key: 'inst_numero',       label: 'Instal·lació – Núm.' },
  { key: 'inst_bloc',         label: 'Instal·lació – Bloc' },
  { key: 'inst_escala',       label: 'Instal·lació – Escala' },
  { key: 'inst_pis',          label: 'Instal·lació – Pis' },
  { key: 'inst_porta',        label: 'Instal·lació – Porta' },
  { key: 'inst_cp',           label: 'Instal·lació – C.P.' },
  { key: 'inst_poblacio',     label: 'Instal·lació – Població' },
  // Característiques
  { key: 'chk_nova',          label: '☐ Nova instal·lació' },
  { key: 'chk_ampliacio',     label: '☐ Ampliació' },
  { key: 'chk_modificacio',   label: '☐ Modificació o reforma' },
  { key: 'cups',              label: 'CUPS' },
  { key: 'opt_p1',            label: '☐ Classe P1' },
  { key: 'opt_p2',            label: '☐ Classe P2' },
  { key: 'opt_memoria',       label: '☐ Memòria tècnica' },
  { key: 'us_installacio',    label: 'Ús de la instal·lació' },
  // Dades tècniques (pàgina 2)
  { key: 'potencia_max',          label: 'Potència màxima (kW)' },
  { key: 'calibre_cgp',           label: 'Calibre fusibles CGP (A)' },
  { key: 'tensio',                label: 'Tensió (V)' },
  { key: 'iga_igm',               label: 'Intensitat IGM (A)' },
  { key: 'num_circuits',          label: 'Nombre de circuits' },
  { key: 'seccio_lga',            label: 'Secció LGA (mm²)' },
  { key: 'material_conductor',    label: 'Material conductor' },
  { key: 'ubicacio_comptadors',   label: 'Ubicació comptadors' },
  { key: 'resist_conductors',     label: 'Resist. aïllament conductors (MΩ)' },
  { key: 'aillament_terra',       label: 'Resist. aïllament terra (MΩ)' },
  { key: 'resist_terra',          label: 'Resistència terra (Ω)' },
  { key: 'iga',                   label: 'Intensitat IGA (A)' },
  { key: 'opt_submin_si',         label: '☐ Subministrament complementari: Sí' },
  { key: 'opt_submin_no',         label: '☐ Subministrament complementari: No' },
  { key: 'observacions',          label: 'Observacions' },
  { key: 'signatura_nom',         label: 'Signatura – Nom instal·lador' },
  { key: 'data_signatura',        label: 'Data de signatura' },
]

const CALIBRATED: Omit<Marker, 'id' | 'screenX' | 'screenY'>[] = [
  { name: 'titular_nom',       x: 92,    y: 704,   page: 1 },
  { name: 'titular_nif',       x: 486.7, y: 704.7, page: 1 },
  { name: 'titular_tipus_via', x: 90.7,  y: 664.7, page: 1 },
  { name: 'titular_nom_via',   x: 180,   y: 664.7, page: 1 },
  { name: 'titular_numero',    x: 522,   y: 666.7, page: 1 },
  { name: 'titular_bloc',      x: 92,    y: 626,   page: 1 },
  { name: 'titular_escala',    x: 185.3, y: 624.7, page: 1 },
  { name: 'titular_pis',       x: 286,   y: 625.3, page: 1 },
  { name: 'titular_porta',     x: 388.7, y: 626,   page: 1 },
  { name: 'titular_cp',        x: 487,   y: 621,   page: 1 },
  { name: 'titular_poblacio',  x: 90.7,  y: 589.3, page: 1 },
  { name: 'titular_tel',       x: 317.3, y: 589.3, page: 1 },
  { name: 'titular_correu',    x: 402.7, y: 589.3, page: 1 },
  { name: 'empresa_nom',       x: 90.7,  y: 532,   page: 1 },
  { name: 'empresa_rasic',     x: 375.3, y: 533.3, page: 1 },
  { name: 'empresa_nif',       x: 487.3, y: 494,   page: 1 },
  { name: 'instalador_nom',    x: 90.7,  y: 494,   page: 1 },
  { name: 'instalador_cat',    x: 374,   y: 494.7, page: 1 },
  { name: 'instalador_dni',    x: 488,   y: 532.7, page: 1 },
  { name: 'empresa_tel',       x: 319.3, y: 379.3, page: 1 },
  { name: 'empresa_correu',    x: 404,   y: 378.7, page: 1 },
  { name: 'inst_tipus_via',    x: 89.3,  y: 456,   page: 1 },
  { name: 'inst_nom_via',      x: 178,   y: 456.7, page: 1 },
  { name: 'inst_numero',       x: 522,   y: 310.7, page: 1 },
  { name: 'inst_bloc',         x: 90.7,  y: 268.7, page: 1 },
  { name: 'inst_escala',       x: 186.7, y: 268,   page: 1 },
  { name: 'inst_pis',          x: 285.3, y: 267.3, page: 1 },
  { name: 'inst_porta',        x: 386,   y: 268,   page: 1 },
  { name: 'inst_cp',           x: 487,   y: 268,   page: 1 },
  { name: 'inst_poblacio',     x: 94.7,  y: 234,   page: 1 },
  { name: 'chk_nova',          x: 87.3,  y: 219,   page: 1 },
  { name: 'chk_ampliacio',     x: 142,   y: 217.7, page: 1 },
  { name: 'chk_modificacio',   x: 213.3, y: 217.7, page: 1 },
  { name: 'cups',              x: 386.7, y: 176.7, page: 1 },
  { name: 'opt_p1',            x: 86.7,  y: 145.7, page: 1 },
  { name: 'opt_p2',            x: 161.3, y: 145,   page: 1 },
  { name: 'opt_memoria',       x: 236,   y: 145,   page: 1 },
  { name: 'us_installacio',    x: 91.3,  y: 67.3,  page: 1 },
  { name: 'potencia_max',      x: 294,   y: 726.7, page: 2 },
  { name: 'calibre_cgp',       x: 465.3, y: 727.3, page: 2 },
  { name: 'tensio',            x: 137.3, y: 710,   page: 2 },
  { name: 'iga_igm',           x: 522,   y: 710,   page: 2 },
  { name: 'num_circuits',      x: 244,   y: 692.7, page: 2 },
  { name: 'seccio_lga',        x: 390,   y: 692.7, page: 2 },
  { name: 'material_conductor',x: 518,   y: 691.3, page: 2 },
  { name: 'ubicacio_comptadors',x: 430,  y: 676,   page: 2 },
  { name: 'resist_conductors', x: 282,   y: 675.3, page: 2 },
  { name: 'aillament_terra',   x: 286.7, y: 658.7, page: 2 },
  { name: 'resist_terra',      x: 285.3, y: 642,   page: 2 },
  { name: 'iga',               x: 284.7, y: 624.7, page: 2 },
  { name: 'opt_submin_si',     x: 227.3, y: 606.7, page: 2 },
  { name: 'opt_submin_no',     x: 262,   y: 607.3, page: 2 },
  { name: 'observacions',      x: 94.7,  y: 457.3, page: 2 },
  { name: 'signatura_nom',     x: 115.3, y: 544,   page: 2 },
  { name: 'data_signatura',    x: 400,   y: 388,   page: 2 },
]

const INITIAL_MARKERS: Marker[] = CALIBRATED.map(m => ({
  ...m, id: crypto.randomUUID(), screenX: 0, screenY: 0,
}))

export function CalibrateElec1() {
  const [markers, setMarkers] = useState<Marker[]>(INITIAL_MARKERS)
  const [pendingClick, setPendingClick] = useState<{ screenX: number; screenY: number; pdfX: number; pdfY: number; page: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(0.75)

  const [search, setSearch] = useState('')
  const usedKeys = new Set(markers.map(m => m.name))
  const remaining = ALL_FIELDS.filter(f => !usedKeys.has(f.key))
  const initialKeys = new Set(CALIBRATED.map(c => c.name))
  const newMarkers = markers.filter(m => !initialKeys.has(m.name))
  const filtered = search ? remaining.filter(f => f.label.toLowerCase().includes(search.toLowerCase()) || f.key.includes(search.toLowerCase())) : remaining

  function handleImgClick(e: React.MouseEvent<HTMLImageElement>, pageNum: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const displayScale = zoom * IMG_SCALE
    const pdfX = Math.round((screenX / displayScale) * 10) / 10
    const pdfY = Math.round((PAGE_HEIGHT_PTS - screenY / displayScale) * 10) / 10
    setPendingClick({ screenX, screenY, pdfX, pdfY, page: pageNum })
    setSearch('')
  }

  function addMarker(fieldKey: string) {
    if (!pendingClick) return
    setMarkers(m => [...m, {
      id: crypto.randomUUID(),
      name: fieldKey,
      x: pendingClick.pdfX,
      y: pendingClick.pdfY,
      page: pendingClick.page,
      screenX: pendingClick.screenX,
      screenY: pendingClick.screenY,
    }])
    setPendingClick(null)
  }

  function exportJSON() {
    const data = newMarkers.map(({ name, x, y, page }) => ({ name, x, y, page }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'elec1-coordinates.json'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentMarkers = newMarkers.filter(m => m.page === currentPage)

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 border-b border-[#1e2d47] px-6 py-3 flex items-center gap-4">
        <span className="font-display font-bold text-sm tracking-widest uppercase text-amber-500">
          Calibració ELEC-1
        </span>
        <div className="flex gap-2 ml-4">
          {[1, 2].map(p => (
            <button key={p} onClick={() => { setCurrentPage(p); setPendingClick(null) }}
              className={`text-xs px-3 py-1 rounded ${currentPage === p ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
              Pàg {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Zoom</span>
          {[0.5, 0.75, 1].map(s => (
            <button key={s} onClick={() => setZoom(s)}
              className={`text-xs px-2 py-1 rounded ${zoom === s ? 'bg-amber-500 text-black' : 'btn-ghost'}`}>
              {s === 0.5 ? '50%' : s === 0.75 ? '75%' : '100%'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">{remaining.length} pendents</span>
          <button onClick={exportJSON} disabled={newMarkers.length === 0}
            className="btn-primary text-sm disabled:opacity-30">⬇ Exportar JSON</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PDF image */}
        <div className="flex-1 overflow-auto p-4">
          {[1, 2].map(p => p === currentPage && (
            <div key={p} className="relative inline-block cursor-crosshair">
              <img
                src={`/calibration/elec1-p${p}.png`}
                alt={`Pàgina ${p}`}
                style={{ width: `${1191 * zoom}px` }}
                onClick={(e) => handleImgClick(e, p)}
                draggable={false}
              />
              {currentMarkers.map(m => (
                <div key={m.id} className="absolute pointer-events-none"
                  style={{ left: m.screenX - 6, top: m.screenY - 6 }}>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="absolute left-4 top-0 bg-emerald-700 text-white text-[9px] px-1 rounded whitespace-nowrap font-mono">
                    {m.name}
                  </div>
                </div>
              ))}
              {pendingClick && pendingClick.page === currentPage && (
                <div className="absolute pointer-events-none"
                  style={{ left: pendingClick.screenX - 6, top: pendingClick.screenY - 6 }}>
                  <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-[#1e2d47] flex flex-col bg-[#0f1729]">
          {pendingClick ? (
            /* Show field buttons to pick from */
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-[#1e2d47] bg-amber-500/10 flex items-center justify-between">
                <span className="text-xs text-amber-400 font-mono">
                  x={pendingClick.pdfX} y={pendingClick.pdfY}
                </span>
                <button onClick={() => setPendingClick(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
              </div>
              <div className="px-3 pt-3 pb-1">
                <input
                  autoFocus
                  className="input-box w-full text-xs"
                  placeholder="Filtra camps..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filtered.map(f => (
                  <button key={f.key} onClick={() => addMarker(f.key)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border border-ink-500 bg-ink-800/40 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 transition-all font-mono">
                    {f.label}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">{remaining.length === 0 ? 'Tots els camps marcats ✓' : 'Cap resultat'}</p>
                )}
              </div>
            </div>
          ) : (
            /* Show progress */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-[#1e2d47]">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-semibold">Com usar-ho:</span><br />
                  1. Fes clic sobre el formulari<br />
                  2. Selecciona el camp de la llista<br />
                  3. El camp desapareix un cop marcat<br />
                  4. Exporta el JSON quan acabis
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mb-2">
                  Pendents ({remaining.length})
                </p>
                {remaining.map(f => (
                  <div key={f.key} className="text-[11px] text-slate-600 font-mono px-2 py-0.5">
                    {f.label}
                  </div>
                ))}
                {newMarkers.length > 0 && (
                  <>
                    <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mt-4 mb-2">
                      Marcats ({newMarkers.length})
                    </p>
                    {newMarkers.map(m => {
                      const field = ALL_FIELDS.find(f => f.key === m.name)
                      return (
                        <div key={m.id} className="flex items-center gap-2 text-[11px] group">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className={`flex-1 font-mono truncate ${m.page === currentPage ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {field?.label || m.name}
                          </span>
                          <button onClick={() => setMarkers(ms => ms.filter(x => x.id !== m.id))}
                            className="opacity-0 group-hover:opacity-100 text-red-400 text-xs">✕</button>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
