import { useEffect, useRef, useState } from 'react'

// ── SVG calibration ────────────────────────────────────────────────────────────

interface SvgMarker {
  id: string; name: string; x: number; y: number; screenX: number; screenY: number
}

const SVGS: Record<string, { w: number; h: number; label: string }> = {
  '/svg/esquema-elec2.svg':       { w: 322.51, h: 505.19, label: 'Esquema ELEC-2' },
  '/svg/simbolo-diferencial.svg': { w: 20.42,  h: 30.93,  label: 'Símbolo diferencial' },
  '/svg/simbolo-termico.svg':     { w: 33.68,  h: 16.63,  label: 'Símbolo tèrmic' },
}

// ── PDF calibration ────────────────────────────────────────────────────────────

interface PdfMarker {
  id: string; name: string; x: number; y: number; screenX: number; screenY: number
}

const IMG_SCALE = 150 / 72   // elec2-p1.png was generated at 150dpi (1pt = 150/72 px)
const PAGE_HEIGHT_PTS = 836  // ELEC-2 PDF page height

const PDF_FIELDS = [
  { key: 'seccio_connexio',        label: 'Secció connexió de servei' },
  { key: 'tensio',                 label: 'Tensió' },
  { key: 'empresa_distribuidora',  label: 'Empresa distribuïdora' },
  { key: 'emplacament',            label: 'Emplaçament' },
  { key: 'titular',                label: 'Titular' },
  { key: 'instalador',             label: 'Instal·lador (nom + RASIC)' },
]

// Already calibrated — shown as pre-loaded markers
const PDF_CALIBRATED: Omit<PdfMarker, 'id' | 'screenX' | 'screenY'>[] = [
  { name: 'empresa_distribuidora', x: 54,  y: 181 },
  { name: 'emplacament',           x: 170, y: 154 },
  { name: 'titular',               x: 170, y: 93  },
  { name: 'instalador',            x: 170, y: 122 },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function CalibrateElec2() {
  const [mode, setMode] = useState<'svg' | 'pdf'>('svg')

  // ── SVG state ──
  const [svgSrc, setSvgSrc] = useState('/svg/esquema-elec2.svg')
  const [svgMarkers, setSvgMarkers] = useState<SvgMarker[]>([])
  const [svgPending, setSvgPending] = useState<{ screenX: number; screenY: number; x: number; y: number } | null>(null)
  const [svgName, setSvgName] = useState('')
  const [svgZoom, setSvgZoom] = useState(1.6)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const VB_W = SVGS[svgSrc]?.w ?? 322.51
  const VB_H = SVGS[svgSrc]?.h ?? 505.19

  // ── PDF state ──
  const [pdfMarkers, setPdfMarkers] = useState<PdfMarker[]>(
    PDF_CALIBRATED.map(m => ({ ...m, id: crypto.randomUUID(), screenX: 0, screenY: 0 }))
  )
  const [pdfPending, setPdfPending] = useState<{ screenX: number; screenY: number; pdfX: number; pdfY: number } | null>(null)
  const [pdfSearch, setPdfSearch] = useState('')
  const [pdfZoom, setPdfZoom] = useState(0.75)
  const [logoMode, setLogoMode] = useState(false)
  const [logoCorners, setLogoCorners] = useState<{ screenX: number; screenY: number; pdfX: number; pdfY: number }[]>([])

  const usedKeys = new Set(pdfMarkers.map(m => m.name))
  const remaining = PDF_FIELDS.filter(f => !usedKeys.has(f.key))
  const filtered = pdfSearch
    ? remaining.filter(f => f.label.toLowerCase().includes(pdfSearch.toLowerCase()) || f.key.includes(pdfSearch))
    : remaining

  const round1 = (n: number) => Math.round(n * 10) / 10
  const logoBox = logoCorners.length === 4 ? {
    x: round1(Math.min(...logoCorners.map(c => c.pdfX))),
    y: round1(Math.min(...logoCorners.map(c => c.pdfY))),
    width: round1(Math.max(...logoCorners.map(c => c.pdfX)) - Math.min(...logoCorners.map(c => c.pdfX))),
    height: round1(Math.max(...logoCorners.map(c => c.pdfY)) - Math.min(...logoCorners.map(c => c.pdfY))),
  } : null
  const logoScreenBox = logoCorners.length === 4 ? {
    left: Math.min(...logoCorners.map(c => c.screenX)),
    top: Math.min(...logoCorners.map(c => c.screenY)),
    width: Math.max(...logoCorners.map(c => c.screenX)) - Math.min(...logoCorners.map(c => c.screenX)),
    height: Math.max(...logoCorners.map(c => c.screenY)) - Math.min(...logoCorners.map(c => c.screenY)),
  } : null

  // ── SVG handlers ──
  function toSvgCoords(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const x = Math.round((screenX / svgZoom) * 100) / 100
    const y = Math.round((screenY / svgZoom) * 100) / 100
    return { screenX, screenY, x, y }
  }

  function svgHandleClick(e: React.MouseEvent<HTMLDivElement>) {
    const c = toSvgCoords(e); setSvgPending(c); setSvgName('')
  }
  function svgHandleMove(e: React.MouseEvent<HTMLDivElement>) {
    setHover(toSvgCoords(e))
  }
  function svgAddMarker() {
    if (!svgPending || !svgName.trim()) return
    setSvgMarkers(ms => [...ms, { id: crypto.randomUUID(), name: svgName.trim(), ...svgPending }])
    setSvgPending(null); setSvgName('')
  }
  function svgCopyAll() {
    navigator.clipboard.writeText(svgMarkers.map(m => `${m.name}: x=${m.x}  y=${m.y}`).join('\n'))
  }
  function svgExportJSON() {
    const blob = new Blob([JSON.stringify(svgMarkers.map(({ name, x, y }) => ({ name, x, y })), null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'elec2-coords.json' })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  // ── PDF handlers ──
  function toPdfCoords(e: React.MouseEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const displayScale = pdfZoom * IMG_SCALE
    const pdfX = Math.round((screenX / displayScale) * 10) / 10
    const pdfY = Math.round((PAGE_HEIGHT_PTS - screenY / displayScale) * 10) / 10
    return { screenX, screenY, pdfX, pdfY }
  }
  function pdfHandleClick(e: React.MouseEvent<HTMLImageElement>) {
    const c = toPdfCoords(e)
    if (logoMode) {
      if (logoCorners.length >= 4) return
      const next = [...logoCorners, c]
      setLogoCorners(next)
      if (next.length === 4) setLogoMode(false)
      return
    }
    setPdfPending(c); setPdfSearch('')
  }
  function pdfAddMarker(fieldKey: string) {
    if (!pdfPending) return
    setPdfMarkers(ms => [...ms, { id: crypto.randomUUID(), name: fieldKey, x: pdfPending.pdfX, y: pdfPending.pdfY, screenX: pdfPending.screenX, screenY: pdfPending.screenY }])
    setPdfPending(null)
  }
  function pdfExportJSON() {
    const data: { name: string; x: number; y: number; width?: number; height?: number }[] =
      pdfMarkers.map(({ name, x, y }) => ({ name, x, y }))
    if (logoBox) data.push({ name: 'logo_zone', ...logoBox })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'elec2-pdf-coords.json' })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (mode === 'svg') {
        if (e.key === 'Enter' && svgPending && svgName.trim()) svgAddMarker()
        if (e.key === 'Escape') { setSvgPending(null); setSvgName('') }
      } else {
        if (e.key === 'Escape') setPdfPending(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 border-b border-[#1e2d47] px-6 py-3 flex items-center gap-4 flex-wrap">
        <span className="font-display font-bold text-sm tracking-widest uppercase text-amber-500">
          Calibració ELEC-2
        </span>

        {/* Mode toggle */}
        <div className="flex gap-1 ml-4">
          {(['svg', 'pdf'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded font-bold ${mode === m ? 'bg-amber-500 text-black' : 'btn-ghost'}`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {mode === 'svg' ? (
          <>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500">SVG</span>
              {Object.entries(SVGS).map(([src, { label }]) => (
                <button key={src} onClick={() => { setSvgSrc(src); setSvgMarkers([]) }}
                  className={`text-xs px-2 py-1 rounded ${svgSrc === src ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500">Zoom</span>
              {[1, 1.6, 2, 3].map(s => (
                <button key={s} onClick={() => setSvgZoom(s)}
                  className={`text-xs px-2 py-1 rounded ${svgZoom === s ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
                  {(s * 100).toFixed(0)}%
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">viewBox {VB_W} × {VB_H}</span>
              {hover && <span className="text-xs text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded">x={hover.x.toFixed(1)} · y={hover.y.toFixed(1)}</span>}
              <span className="text-xs text-slate-400">{svgMarkers.length} marques</span>
              <button onClick={svgCopyAll} disabled={svgMarkers.length === 0} className="btn-ghost text-xs disabled:opacity-30">📋 Copiar</button>
              <button onClick={svgExportJSON} disabled={svgMarkers.length === 0} className="btn-primary text-sm disabled:opacity-30">⬇ JSON</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500">Zoom</span>
              {[0.5, 0.75, 1].map(s => (
                <button key={s} onClick={() => setPdfZoom(s)}
                  className={`text-xs px-2 py-1 rounded ${pdfZoom === s ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
                  {s === 0.5 ? '50%' : s === 0.75 ? '75%' : '100%'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500">Logo</span>
              <button onClick={() => setLogoMode(m => !m)}
                className={`text-xs px-2 py-1 rounded font-bold ${logoMode ? 'bg-sky-500 text-black' : 'btn-ghost'}`}>
                {logoMode ? 'Marcant…' : 'Marca cantonades'}
              </button>
              <span className="text-xs text-slate-400 font-mono">{logoCorners.length}/4</span>
              {logoCorners.length > 0 && (
                <button onClick={() => { setLogoCorners([]); setLogoMode(true) }} className="text-xs px-2 py-1 rounded btn-ghost">↺ Reinicia</button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-400">{pdfMarkers.length}/{PDF_FIELDS.length} camps</span>
              <button onClick={pdfExportJSON} disabled={pdfMarkers.length === 0 && !logoBox} className="btn-primary text-sm disabled:opacity-30">⬇ Exportar JSON</button>
            </div>
          </>
        )}
      </div>

      {/* ── SVG mode ── */}
      {mode === 'svg' && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-slate-900">
            <div ref={containerRef} className="relative cursor-crosshair shadow-2xl"
              style={{ width: `${VB_W * svgZoom}px`, height: `${VB_H * svgZoom}px`, backgroundColor: '#ffffff', backgroundImage: `url(${svgSrc})`, backgroundSize: `${VB_W * svgZoom}px ${VB_H * svgZoom}px`, backgroundRepeat: 'no-repeat' }}
              onClick={svgHandleClick} onMouseMove={svgHandleMove} onMouseLeave={() => setHover(null)}>
              {hover && !svgPending && (
                <>
                  <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: hover.x * svgZoom, width: 1, background: 'rgba(245,158,11,0.7)' }} />
                  <div className="absolute left-0 right-0 pointer-events-none" style={{ top: hover.y * svgZoom, height: 1, background: 'rgba(245,158,11,0.7)' }} />
                </>
              )}
              {svgMarkers.map(m => (
                <div key={m.id} className="absolute pointer-events-none" style={{ left: m.screenX - 6, top: m.screenY - 6 }}>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="absolute left-4 top-0 bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap font-mono shadow-md">{m.name} ({m.x},{m.y})</div>
                </div>
              ))}
              {svgPending && (
                <div className="absolute pointer-events-none" style={{ left: svgPending.screenX - 7, top: svgPending.screenY - 7 }}>
                  <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
                </div>
              )}
            </div>
          </div>
          <div className="w-80 border-l border-[#1e2d47] flex flex-col bg-[#0f1729]">
            {svgPending ? (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-[#1e2d47] bg-amber-500/10 flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-mono">x={svgPending.x.toFixed(2)} · y={svgPending.y.toFixed(2)}</span>
                  <button onClick={() => { setSvgPending(null); setSvgName('') }} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
                </div>
                <div className="p-3 space-y-3">
                  <label className="block text-xs text-slate-400">Nom del punt</label>
                  <input autoFocus value={svgName} onChange={e => setSvgName(e.target.value)} placeholder="ex: ext_line_start" className="input-box w-full text-xs font-mono" />
                  <button onClick={svgAddMarker} disabled={!svgName.trim()} className="btn-primary w-full text-sm disabled:opacity-30">Afegir (Enter)</button>
                  <p className="text-[10px] text-slate-500">Esc = cancel·la · Enter = afegeix</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs text-slate-400">Fes clic al SVG per obtenir coordenades.</p>
                {svgMarkers.length > 0 && svgMarkers.map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-[11px] group">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="flex-1 font-mono text-emerald-400 truncate">{m.name}</span>
                    <span className="font-mono text-slate-500">{m.x},{m.y}</span>
                    <button onClick={() => setSvgMarkers(ms => ms.filter(x => x.id !== m.id))} className="opacity-0 group-hover:opacity-100 text-red-400 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PDF mode ── */}
      {mode === 'pdf' && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div className="relative inline-block cursor-crosshair">
              <img src="/calibration/elec2-p1.png" alt="ELEC-2 pàgina 1"
                style={{ width: `${1172 * pdfZoom}px` }}
                onClick={pdfHandleClick} draggable={false} />
              {pdfMarkers.map(m => m.screenX > 0 && (
                <div key={m.id} className="absolute pointer-events-none" style={{ left: m.screenX - 6, top: m.screenY - 6 }}>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="absolute left-4 top-0 bg-emerald-700 text-white text-[9px] px-1 rounded whitespace-nowrap font-mono">{m.name}</div>
                </div>
              ))}
              {pdfPending && (
                <div className="absolute pointer-events-none" style={{ left: pdfPending.screenX - 6, top: pdfPending.screenY - 6 }}>
                  <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
                </div>
              )}
              {logoCorners.map((c, i) => (
                <div key={`logo-${i}`} className="absolute pointer-events-none" style={{ left: c.screenX - 8, top: c.screenY - 8 }}>
                  <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center text-[9px] font-bold text-black">{i + 1}</div>
                </div>
              ))}
              {logoScreenBox && (
                <div className="absolute pointer-events-none border-2 border-dashed border-sky-400 bg-sky-400/10"
                  style={{ left: logoScreenBox.left, top: logoScreenBox.top, width: logoScreenBox.width, height: logoScreenBox.height }} />
              )}
            </div>
          </div>

          <div className="w-80 border-l border-[#1e2d47] flex flex-col bg-[#0f1729]">
            {pdfPending ? (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-[#1e2d47] bg-amber-500/10 flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-mono">x={pdfPending.pdfX} y={pdfPending.pdfY}</span>
                  <button onClick={() => setPdfPending(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
                </div>
                <div className="px-3 pt-3 pb-1">
                  <input autoFocus className="input-box w-full text-xs" placeholder="Filtra camps..." value={pdfSearch} onChange={e => setPdfSearch(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {filtered.map(f => (
                    <button key={f.key} onClick={() => pdfAddMarker(f.key)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-ink-500 bg-ink-800/40 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 transition-all font-mono">
                      {f.label}
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-xs text-slate-600 text-center py-4">{remaining.length === 0 ? 'Tots els camps marcats ✓' : 'Cap resultat'}</p>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#1e2d47]">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Com usar-ho:</span><br />
                    1. Fes clic sobre el formulari<br />
                    2. Selecciona el camp de la llista<br />
                    3. Exporta el JSON quan acabis
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {logoMode && logoCorners.length < 4 && (
                    <div className="p-2 mb-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-[11px] text-sky-300">
                      Fes clic a la cantonada {logoCorners.length + 1} de 4 del logo a la imatge.
                    </div>
                  )}
                  {logoBox && (
                    <div className="p-2 mb-3 rounded-lg border border-sky-500/40 bg-sky-500/10 space-y-1">
                      <p className="text-[10px] text-sky-300 font-display tracking-widest uppercase">Zona del logo</p>
                      <p className="text-[11px] font-mono text-sky-200">x={logoBox.x} y={logoBox.y} w={logoBox.width} h={logoBox.height}</p>
                      <button onClick={() => navigator.clipboard.writeText(`x=${logoBox.x} y=${logoBox.y} width=${logoBox.width} height=${logoBox.height}`)}
                        className="btn-ghost text-[11px]">📋 Copiar</button>
                    </div>
                  )}
                  {remaining.length > 0 && <>
                    <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mb-2">Pendents ({remaining.length})</p>
                    {remaining.map(f => <div key={f.key} className="text-[11px] text-slate-600 font-mono px-2 py-0.5">{f.label}</div>)}
                  </>}
                  {pdfMarkers.length > 0 && <>
                    <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mt-4 mb-2">Marcats ({pdfMarkers.length})</p>
                    {pdfMarkers.map(m => {
                      const field = PDF_FIELDS.find(f => f.key === m.name)
                      return (
                        <div key={m.id} className="flex items-center gap-2 text-[11px] group">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="flex-1 font-mono text-emerald-400 truncate">{field?.label || m.name}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{m.x},{m.y}</span>
                          <button onClick={() => setPdfMarkers(ms => ms.filter(x => x.id !== m.id))} className="opacity-0 group-hover:opacity-100 text-red-400 text-xs">✕</button>
                        </div>
                      )
                    })}
                  </>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
