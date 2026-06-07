import { useState } from 'react'
import { UnifilarSVG } from '../components/esquema-unifilar/UnifilarSVG'
import { instanciarPlantilla } from '../lib/plantilles-installacio'
import type { Circuit, Diferencial } from '../types/esquemaUnifilar'

// SVG viewBox dimensions (must match UnifilarSVG constants)
const VB_W = 480
const VB_H = 505.19

interface Marker {
  id: string
  name: string
  x: number
  y: number
}

// Sample data — habitatge bàsica
const SAMPLE = instanciarPlantilla('habitatge_basica')
const SAMPLE_CIRCUITS: Circuit[] = SAMPLE.circuits
const SAMPLE_DIFS: Diferencial[] = SAMPLE.diferencials
const SAMPLE_IGA = SAMPLE.iga_amperatge

export function CalibrateElec2() {
  const [zoom, setZoom] = useState(2)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null)
  const [pendingName, setPendingName] = useState('')

  const displayW = VB_W * zoom
  const displayH = VB_H * zoom

  function svgCoords(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * VB_W * 100) / 100
    const y = Math.round(((e.clientY - rect.top) / rect.height) * VB_H * 100) / 100
    return { x, y }
  }

  function confirmMarker() {
    if (!pending || !pendingName.trim()) return
    setMarkers(ms => [...ms, { id: crypto.randomUUID(), name: pendingName.trim(), ...pending }])
    setPending(null)
    setPendingName('')
  }

  function copyAll() {
    const txt = markers.map(m => `${m.name}: x=${m.x}  y=${m.y}`).join('\n')
    navigator.clipboard.writeText(txt)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex flex-col">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 border-b border-[#1e2d47] px-6 py-3 flex items-center gap-4 flex-wrap">
        <span className="font-display font-bold text-sm tracking-widest uppercase text-amber-500">
          Calibració ELEC-2
        </span>

        <div className="flex items-center gap-1 ml-4">
          <span className="text-xs text-slate-500 mr-1">Zoom</span>
          {[1, 1.5, 2, 3].map(s => (
            <button key={s} onClick={() => setZoom(s)}
              className={`text-xs px-2 py-1 rounded ${zoom === s ? 'bg-amber-500 text-black font-bold' : 'btn-ghost'}`}>
              {(s * 100).toFixed(0)}%
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {hover && (
            <span className="text-xs text-amber-400 font-mono bg-black/40 px-2 py-0.5 rounded">
              x={hover.x.toFixed(1)} · y={hover.y.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-slate-400">{markers.length} marques</span>
          <button onClick={copyAll} disabled={markers.length === 0}
            className="btn-ghost text-xs disabled:opacity-30">📋 Copiar</button>
          <button onClick={() => setMarkers([])} disabled={markers.length === 0}
            className="btn-ghost text-xs text-red-400 disabled:opacity-30">Netejar</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas ── */}
        <div className="flex-1 overflow-auto p-6 bg-slate-900">
          <div
            className="relative flex-shrink-0 shadow-2xl"
            style={{ width: displayW, height: displayH }}
          >
            {/* Layer 1: real UnifilarSVG diagram */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <UnifilarSVG
                circuits={SAMPLE_CIRCUITS}
                diferencials={SAMPLE_DIFS}
                iga={SAMPLE_IGA}
              />
            </div>

            {/* Layer 2: interactive transparent SVG overlay */}
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              width={displayW}
              height={displayH}
              className="absolute inset-0 cursor-crosshair"
              style={{ background: 'transparent' }}
              onMouseMove={e => setHover(svgCoords(e))}
              onMouseLeave={() => setHover(null)}
              onClick={e => { setPending(svgCoords(e)); setPendingName('') }}
            >
              {/* Light grid every 10 SVG units */}
              {Array.from({ length: Math.ceil(VB_W / 10) }, (_, i) => i * 10).map(x => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={VB_H}
                  stroke="#6366f1" strokeWidth={0.2} strokeOpacity={0.3} />
              ))}
              {Array.from({ length: Math.ceil(VB_H / 10) }, (_, i) => i * 10).map(y => (
                <line key={`h${y}`} x1={0} y1={y} x2={VB_W} y2={y}
                  stroke="#6366f1" strokeWidth={0.2} strokeOpacity={0.3} />
              ))}

              {/* Hover crosshair */}
              {hover && !pending && (
                <>
                  <line x1={hover.x} y1={0} x2={hover.x} y2={VB_H}
                    stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2 2" strokeOpacity={0.8} />
                  <line x1={0} y1={hover.y} x2={VB_W} y2={hover.y}
                    stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="2 2" strokeOpacity={0.8} />
                </>
              )}

              {/* Pending point */}
              {pending && (
                <circle cx={pending.x} cy={pending.y} r={4}
                  fill="#f59e0b" stroke="#fff" strokeWidth={1} opacity={0.9} />
              )}

              {/* Confirmed markers */}
              {markers.map(m => (
                <g key={m.id}>
                  <circle cx={m.x} cy={m.y} r={3}
                    fill="#10b981" stroke="#fff" strokeWidth={0.8} />
                  <rect x={m.x + 5} y={m.y - 5} width={1} height={1} fill="none" />
                  <text x={m.x + 5} y={m.y + 2}
                    fontSize={6} fill="#10b981" fontWeight="bold"
                    style={{ userSelect: 'none' } as React.CSSProperties}>
                    {m.name} ({m.x},{m.y})
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-80 border-l border-[#1e2d47] flex flex-col bg-[#0f1729] flex-shrink-0">
          {pending ? (
            <div className="p-4 border-b border-[#1e2d47] bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-mono">
                  x={pending.x.toFixed(2)} · y={pending.y.toFixed(2)}
                </span>
                <button onClick={() => { setPending(null); setPendingName('') }}
                  className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
              </div>
              <input
                autoFocus
                value={pendingName}
                onChange={e => setPendingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmMarker()
                  if (e.key === 'Escape') { setPending(null); setPendingName('') }
                }}
                placeholder="nom del punt…"
                className="input-box w-full text-xs font-mono"
              />
              <button onClick={confirmMarker} disabled={!pendingName.trim()}
                className="btn-primary w-full text-sm disabled:opacity-30">
                Afegir (Enter)
              </button>
              <p className="text-[10px] text-slate-500">Esc = cancel·la</p>
            </div>
          ) : (
            <div className="p-4 border-b border-[#1e2d47]">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-amber-400 font-semibold">Com usar-ho:</span><br />
                1. Mou el ratolí → veus coordenades<br />
                2. Fes clic → marca un punt<br />
                3. Nom + Enter → confirma<br />
                4. 📋 Copia tots els valors
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mb-2">
              Marques ({markers.length})
            </p>
            {markers.map(m => (
              <div key={m.id} className="flex items-start gap-2 text-[11px] group py-1 border-b border-[#1e2d47]/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-mono min-w-0">
                  <div className="text-emerald-400 truncate font-semibold">{m.name}</div>
                  <div className="text-slate-400 text-[10px]">x={m.x} · y={m.y}</div>
                </div>
                <button onClick={() => setMarkers(ms => ms.filter(x => x.id !== m.id))}
                  className="opacity-0 group-hover:opacity-100 text-red-400 text-xs flex-shrink-0">✕</button>
              </div>
            ))}
            {markers.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-6">Cap marca encara</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
