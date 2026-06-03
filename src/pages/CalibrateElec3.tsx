import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
// Vite: import worker URL directly so it gets bundled correctly
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorker

interface Marker {
  id: string
  name: string
  x: number   // PDF points, origin bottom-left
  y: number
  page: number
  screenX: number  // for display
  screenY: number
}

const FIELD_SUGGESTIONS = [
  'titular_nom', 'us_installacio', 'emplacament', 'emplacament_num', 'emplacament_pis', 'emplacament_porta',
  'localitat', 'cp', 'nova', 'ampliacio', 'reforma',
  'empresa_distribuidora',
  'dif1_circuit', 'dif1_nombre', 'dif1_in', 'dif1_sensibilitat',
  'dif2_circuit', 'dif2_nombre', 'dif2_in', 'dif2_sensibilitat',
  'dif3_circuit', 'dif3_nombre', 'dif3_in', 'dif3_sensibilitat',
  'seccio_di', 'resist_terra',
  'superficie', 'potencia_max', 'tensio', 'potencia_instal', 'iga',
  'data_signatura',
]

export function CalibrateElec3() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [pendingClick, setPendingClick] = useState<{ screenX: number; screenY: number; pdfX: number; pdfY: number; page: number } | null>(null)
  const [fieldName, setFieldName] = useState('')
  const [scale, setScale] = useState(1.5)
  const [pageHeight, setPageHeight] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const pdfRef = useRef<unknown>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const pdf = await pdfjsLib.getDocument({ url: '/templates/elec3-blank.pdf' }).promise
      if (cancelled) return
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      renderPage(pdf, currentPage)
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function renderPage(pdf: unknown, pageNum: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (pdf as any).getPage(pageNum)
    const viewport = page.getViewport({ scale })
    setPageHeight(viewport.height)

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
  }

  useEffect(() => {
    if (pdfRef.current) renderPage(pdfRef.current, currentPage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, scale])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    // Convert to PDF points (origin bottom-left)
    const pdfX = Math.round((screenX / scale) * 10) / 10
    const pdfY = Math.round(((pageHeight / scale) - (screenY / scale)) * 10) / 10
    setPendingClick({ screenX, screenY, pdfX, pdfY, page: currentPage })
    setFieldName('')
  }

  function confirmMarker() {
    if (!pendingClick || !fieldName.trim()) return
    const marker: Marker = {
      id: crypto.randomUUID(),
      name: fieldName.trim(),
      x: pendingClick.pdfX,
      y: pendingClick.pdfY,
      page: pendingClick.page,
      screenX: pendingClick.screenX,
      screenY: pendingClick.screenY,
    }
    setMarkers(m => [...m, marker])
    setPendingClick(null)
    setFieldName('')
  }

  function exportJSON() {
    const data = markers.map(({ name, x, y, page }) => ({ name, x, y, page }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'elec3-coordinates.json'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentPageMarkers = markers.filter(m => m.page === currentPage)

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 border-b border-[#1e2d47] px-6 py-3 flex items-center gap-4">
        <span className="font-display font-bold text-sm tracking-widest uppercase text-amber-500">
          Eina de calibració · ELEC-3
        </span>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">← Pàg {currentPage - 1}</button>
          <span className="text-xs text-slate-400 font-mono">Pàg {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            className="btn-ghost text-xs px-2 py-1 disabled:opacity-30">Pàg {currentPage + 1} →</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Zoom</span>
          {[1, 1.5, 2].map(s => (
            <button key={s} onClick={() => setScale(s)}
              className={`text-xs px-2 py-1 rounded ${scale === s ? 'bg-amber-500 text-black' : 'btn-ghost'}`}>
              {s}×
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">{markers.length} camps marcats</span>
          <button onClick={exportJSON} disabled={markers.length === 0}
            className="btn-primary text-sm disabled:opacity-30">
            ⬇ Exportar JSON
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 relative">
          <div className="relative inline-block cursor-crosshair">
            <canvas ref={canvasRef} onClick={handleCanvasClick} />

            {/* Render markers for current page */}
            {currentPageMarkers.map(m => (
              <div key={m.id} className="absolute pointer-events-none"
                style={{ left: m.screenX - 6, top: m.screenY - 6 }}>
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                <div className="absolute left-4 top-0 bg-red-600 text-white text-[9px] px-1 rounded whitespace-nowrap font-mono">
                  {m.name}
                </div>
              </div>
            ))}

            {/* Pending click indicator */}
            {pendingClick && (
              <div className="absolute pointer-events-none"
                style={{ left: pendingClick.screenX - 6, top: pendingClick.screenY - 6 }}>
                <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 border-l border-[#1e2d47] flex flex-col bg-[#0f1729]">
          {/* Field name input */}
          {pendingClick && (
            <div className="p-4 border-b border-[#1e2d47] bg-amber-500/10">
              <p className="text-xs text-amber-400 font-mono mb-2">
                Click en x={pendingClick.pdfX} y={pendingClick.pdfY}
              </p>
              <p className="text-xs text-slate-400 mb-2">Nom del camp:</p>
              <input
                autoFocus
                className="input-box w-full text-sm mb-2"
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmMarker()}
                placeholder="ex: titular_nom"
                list="field-suggestions"
              />
              <datalist id="field-suggestions">
                {FIELD_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
              <div className="flex gap-2">
                <button onClick={confirmMarker} disabled={!fieldName.trim()}
                  className="btn-primary text-xs flex-1 disabled:opacity-30">✓ Afegir</button>
                <button onClick={() => setPendingClick(null)} className="btn-ghost text-xs">✕</button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!pendingClick && (
            <div className="p-4 border-b border-[#1e2d47]">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-amber-400 font-semibold">Com usar-ho:</span><br />
                1. Fes clic sobre el document on vols que aparegui cada dada<br />
                2. Escriu el nom del camp<br />
                3. Prem Enter o ✓<br />
                4. Exporta el JSON quan acabis
              </p>
            </div>
          )}

          {/* Markers list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] text-slate-500 font-display tracking-widest uppercase mb-2">Camps marcats</p>
            {markers.length === 0 && (
              <p className="text-xs text-slate-600">Cap camp marcat</p>
            )}
            {markers.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs group">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className={`flex-1 font-mono truncate ${m.page === currentPage ? 'text-slate-200' : 'text-slate-500'}`}>
                  {m.name}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">{m.x},{m.y}</span>
                <button onClick={() => setMarkers(ms => ms.filter(x => x.id !== m.id))}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
