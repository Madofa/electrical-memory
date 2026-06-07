import { useEffect, useRef, useState } from 'react'

interface Marker {
  id: string
  name: string
  x: number
  y: number
  screenX: number
  screenY: number
}

// Available SVG sources to calibrate
const SVGS: Record<string, { w: number; h: number; label: string }> = {
  '/svg/esquema-elec2.svg':      { w: 322.51, h: 505.19, label: 'Esquema ELEC-2' },
  '/svg/simbolo-diferencial.svg': { w: 20.42,  h: 30.93,  label: 'Símbolo diferencial' },
  '/svg/simbolo-termico.svg':     { w: 33.68,  h: 16.63,  label: 'Símbolo tèrmic' },
}

export function CalibrateElec2() {
  const [svgSrc, setSvgSrc] = useState('/svg/esquema-elec2.svg')
  const [markers, setMarkers] = useState<Marker[]>([])
  const [pending, setPending] = useState<{ screenX: number; screenY: number; x: number; y: number } | null>(null)
  const [name, setName] = useState('')
  const [zoom, setZoom] = useState(1.6)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const VB_W = SVGS[svgSrc]?.w ?? 322.51
  const VB_H = SVGS[svgSrc]?.h ?? 505.19
  const displayW = VB_W * zoom
  const displayH = VB_H * zoom

  function toSvgCoords(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const x = Math.round((screenX / zoom) * 100) / 100
    const y = Math.round((screenY / zoom) * 100) / 100
    return { screenX, screenY, x, y }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const c = toSvgCoords(e)
    setPending(c)
    setName('')
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const c = toSvgCoords(e)
    setHover({ x: c.x, y: c.y })
  }

  function addMarker() {
    if (!pending || !name.trim()) return
    setMarkers((ms) => [
      ...ms,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        x: pending.x,
        y: pending.y,
        screenX: pending.screenX,
        screenY: pending.screenY,
      },
    ])
    setPending(null)
    setName('')
  }

  function copyAll() {
    const txt = markers.map(m => `${m.name}: x=${m.x}  y=${m.y}`).join('\n')
    navigator.clipboard.writeText(txt)
  }

  function exportJSON() {
    const data = markers.map(({ name, x, y }) => ({ name, x, y }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elec2-coords.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Submit pending marker on Enter
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && pending && name.trim()) addMarker()
      if (e.key === 'Escape') { setPending(null); setName('') }
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
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-slate-500">SVG</span>
          {Object.entries(SVGS).map(([src, { label }]) => (
            <button key={src} onClick={() => { setSvgSrc(src); setMarkers([]) }}
              className={`text-xs px-2 py-1 rounded ${svgSrc === src ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-slate-500">Zoom</span>
          {[1, 1.6, 2, 3].map((s) => (
            <button key={s} onClick={() => setZoom(s)}
              className={`text-xs px-2 py-1 rounded ${zoom === s ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
              {(s * 100).toFixed(0)}%
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            viewBox {VB_W} × {VB_H}
          </span>
          {hover && (
            <span className="text-xs text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded">
              x={hover.x.toFixed(1)} · y={hover.y.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-slate-400">{markers.length} marques</span>
          <button onClick={copyAll} disabled={markers.length === 0}
            className="btn-ghost text-xs disabled:opacity-30">📋 Copiar</button>
          <button onClick={exportJSON} disabled={markers.length === 0}
            className="btn-primary text-sm disabled:opacity-30">⬇ JSON</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SVG canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-slate-900">
          <div
            ref={containerRef}
            className="relative cursor-crosshair shadow-2xl"
            style={{
              width: `${displayW}px`,
              height: `${displayH}px`,
              backgroundColor: '#ffffff',
              backgroundImage: `url(${svgSrc})`,
              backgroundSize: `${displayW}px ${displayH}px`,
              backgroundRepeat: 'no-repeat',
            }}
            onClick={handleClick}
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          >
            {/* Crosshair lines */}
            {hover && !pending && (
              <>
                <div className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: hover.x * zoom, width: 1, background: 'rgba(245,158,11,0.7)' }} />
                <div className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: hover.y * zoom, height: 1, background: 'rgba(245,158,11,0.7)' }} />
              </>
            )}

            {/* Existing markers */}
            {markers.map((m) => (
              <div key={m.id} className="absolute pointer-events-none"
                style={{ left: m.screenX - 6, top: m.screenY - 6 }}>
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                <div className="absolute left-4 top-0 bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap font-mono shadow-md">
                  {m.name} ({m.x},{m.y})
                </div>
              </div>
            ))}

            {/* Pending click */}
            {pending && (
              <div className="absolute pointer-events-none"
                style={{ left: pending.screenX - 7, top: pending.screenY - 7 }}>
                <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-[#1e2d47] flex flex-col bg-[#0f1729]">
          {pending ? (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-[#1e2d47] bg-amber-500/10 flex items-center justify-between">
                <span className="text-xs text-amber-400 font-mono">
                  x={pending.x.toFixed(2)} · y={pending.y.toFixed(2)}
                </span>
                <button onClick={() => { setPending(null); setName('') }}
                  className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
              </div>
              <div className="p-3 space-y-3">
                <label className="block text-xs text-slate-400">Nom del punt</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: ext_line_start"
                  className="input-box w-full text-xs font-mono"
                />
                <button onClick={addMarker} disabled={!name.trim()}
                  className="btn-primary w-full text-sm disabled:opacity-30">
                  Afegir (Enter)
                </button>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Esc = cancel·la · Enter = afegeix
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-[#1e2d47]">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-semibold">Com usar-ho:</span><br />
                  1. Fes clic sobre el dibuix<br />
                  2. Posa un nom al punt<br />
                  3. Enter per afegir<br />
                  4. Copia o exporta el JSON
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mb-2">
                  Marques ({markers.length})
                </p>
                {markers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-[11px] group">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="flex-1 font-mono truncate text-emerald-400">{m.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{m.x},{m.y}</span>
                    <button onClick={() => setMarkers((ms) => ms.filter((x) => x.id !== m.id))}
                      className="opacity-0 group-hover:opacity-100 text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {markers.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">Cap marca encara</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
