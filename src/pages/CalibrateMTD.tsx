import { useEffect, useState } from 'react'

// Pàgina A4 en punts (mateixa unitat que fa servir @react-pdf/renderer per a `position: absolute`)
const PAGE_W = 595.28
const PAGE_H = 841.89

interface Corner { screenX: number; screenY: number; x: number; y: number }

export function CalibrateMTD() {
  const [zoom, setZoom] = useState(0.8)
  const [corners, setCorners] = useState<Corner[]>([])
  const [marking, setMarking] = useState(false)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)

  const round1 = (n: number) => Math.round(n * 10) / 10

  const box = corners.length === 4 ? {
    x: round1(Math.min(...corners.map(c => c.x))),
    y: round1(Math.min(...corners.map(c => c.y))),
    width: round1(Math.max(...corners.map(c => c.x)) - Math.min(...corners.map(c => c.x))),
    height: round1(Math.max(...corners.map(c => c.y)) - Math.min(...corners.map(c => c.y))),
  } : null

  const screenBox = corners.length === 4 ? {
    left: Math.min(...corners.map(c => c.screenX)),
    top: Math.min(...corners.map(c => c.screenY)),
    width: Math.max(...corners.map(c => c.screenX)) - Math.min(...corners.map(c => c.screenX)),
    height: Math.max(...corners.map(c => c.screenY)) - Math.min(...corners.map(c => c.screenY)),
  } : null

  function toCoords(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    return { screenX, screenY, x: round1(screenX / zoom), y: round1(screenY / zoom) }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!marking || corners.length >= 4) return
    const c = toCoords(e)
    const next = [...corners, c]
    setCorners(next)
    if (next.length === 4) setMarking(false)
  }

  function copyBox() {
    if (!box) return
    navigator.clipboard.writeText(`x=${box.x} y=${box.y} width=${box.width} height=${box.height}`)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMarking(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const gridLines: { type: 'v' | 'h'; pos: number }[] = []
  for (let x = 0; x <= PAGE_W; x += 50) gridLines.push({ type: 'v', pos: x })
  for (let y = 0; y <= PAGE_H; y += 50) gridLines.push({ type: 'h', pos: y })

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex flex-col">
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 border-b border-[#1e2d47] px-6 py-3 flex items-center gap-4 flex-wrap">
        <span className="font-display font-bold text-sm tracking-widest uppercase text-amber-500">
          Calibració MTD — Logo
        </span>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-slate-500">Zoom</span>
          {[0.6, 0.8, 1].map(z => (
            <button key={z} onClick={() => setZoom(z)}
              className={`text-xs px-2 py-1 rounded ${zoom === z ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
              {(z * 100).toFixed(0)}%
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button onClick={() => { setMarking(m => !m); if (!marking) setCorners([]) }}
            className={`text-xs px-2 py-1 rounded font-bold ${marking ? 'bg-sky-500 text-black' : 'btn-ghost'}`}>
            {marking ? 'Marcant…' : 'Marca cantonades'}
          </button>
          <span className="text-xs text-slate-400 font-mono">{corners.length}/4</span>
          {corners.length > 0 && (
            <button onClick={() => { setCorners([]); setMarking(true) }} className="text-xs px-2 py-1 rounded btn-ghost">↺ Reinicia</button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {hover && (
            <span className="text-xs text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded">
              x={hover.x.toFixed(1)} · y={hover.y.toFixed(1)} pt
            </span>
          )}
          {box && (
            <>
              <span className="text-xs text-sky-300 font-mono bg-sky-500/10 px-2 py-1 rounded">
                x={box.x} y={box.y} w={box.width} h={box.height}
              </span>
              <button onClick={copyBox} className="btn-primary text-sm">📋 Copiar</button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
        <div
          className="relative shadow-2xl bg-white cursor-crosshair"
          style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }}
          onClick={handleClick}
          onMouseMove={e => setHover(toCoords(e))}
          onMouseLeave={() => setHover(null)}
        >
          {/* graella de referència cada 50pt */}
          {gridLines.map((g, i) => g.type === 'v' ? (
            <div key={`v${i}`} className="absolute top-0 bottom-0 border-l border-dashed border-slate-200 pointer-events-none" style={{ left: g.pos * zoom }} />
          ) : (
            <div key={`h${i}`} className="absolute left-0 right-0 border-t border-dashed border-slate-200 pointer-events-none" style={{ top: g.pos * zoom }} />
          ))}

          {/* Mockup de la capçalera actual de PDFTemplate.tsx (s.header / s.logo) */}
          <div
            className="absolute flex items-start justify-between pointer-events-none"
            style={{
              left: 30 * zoom, right: 30 * zoom, top: 30 * zoom,
              borderBottom: `${2 * zoom}px solid #000`, paddingBottom: 10 * zoom,
            }}
          >
            <img src="/img/logo-lelctric.png" alt="logo actual"
              style={{ maxHeight: 50 * zoom, maxWidth: 150 * zoom, objectFit: 'contain', opacity: 0.4 }} />
            <div style={{ textAlign: 'right', fontFamily: 'Helvetica, Arial, sans-serif', color: '#000' }}>
              <div style={{ fontSize: 14 * zoom, fontWeight: 700, textTransform: 'uppercase' }}>Memoria Técnica Descriptiva</div>
              <div style={{ fontSize: 10 * zoom, marginTop: 2 * zoom }}>Instalación Eléctrica en Baja Tensión</div>
              <div style={{ fontSize: 10 * zoom, color: '#555', marginTop: 4 * zoom }}>Ref: 2026-001  |  Fecha: 09/06/2026</div>
            </div>
          </div>

          {/* marcadors de cantonada */}
          {corners.map((c, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ left: c.screenX - 8, top: c.screenY - 8 }}>
              <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center text-[9px] font-bold text-black">{i + 1}</div>
            </div>
          ))}
          {screenBox && (
            <div className="absolute pointer-events-none border-2 border-dashed border-sky-400 bg-sky-400/10"
              style={{ left: screenBox.left, top: screenBox.top, width: screenBox.width, height: screenBox.height }} />
          )}
        </div>
      </div>

      <div className="px-6 py-3 text-xs text-slate-500 border-t border-[#1e2d47]">
        Pàgina A4 ({PAGE_W}×{PAGE_H} pt). El logo semitransparent (dalt a l'esquerra) és la posició actual.
        Fes clic a "Marca cantonades" i marca les 4 cantonades de la zona on vols col·locar el logo —
        coordenades en punts, origen a la cantonada superior esquerra (igual que <code>position: absolute</code> de react-pdf).
      </div>
    </div>
  )
}
