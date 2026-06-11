import type { Circuit, Diferencial } from '../../types/esquemaUnifilar'

interface Props { circuits: Circuit[]; diferencials: Diferencial[]; iga: number }

// ── SVG dimensions ─────────────────────────────────────────────────────────────
// VB_W crops the right side of esquema-elec3.svg (x>620 is empty in that file) and
// leaves room for the longest circuit name + kW label (~x=580). Keeping VB_W ≥ 582
// (areaH*VB_H/areaW in pdf-elec2.ts) preserves the diagram's vertical PDF position
// while maximizing how much of the page width is used.
const VB_W = 620
const VB_H = 511.99
const BASE_W = 686.97   // Width of esquema-elec3.svg
const CUADRO_Y = 8.49, CUADRO_H = 491.82
const MM = VB_H / 297   // SVG units per mm (≈ 1.72)

// ── Calibrated positions ───────────────────────────────────────────────────────
// esquema-elec3.svg = esquema-elec2.svg shifted by (+1.51, +5.29) on a wider canvas.
// All old calibrated points below are shifted by that same offset.
// +2mm right from calibrated point so it doesn't look too tight against the bus
const DIF_X = 208.27 + 2 * MM  // ≈ 211.72

// ── Diferencial symbol (viewBox 20.42 × 30.93) ────────────────────────────────
const DIF_VB_W = 20.42, DIF_VB_H = 30.93
const DIF_W = 20, DIF_H = DIF_VB_H * (DIF_W / DIF_VB_W)
const DIF_SYMBOL_X = DIF_X + 5 * MM + 2      // symbol offset right so pre-symbol line has space
const DIF_END_X = DIF_SYMBOL_X + DIF_W       // right edge of differential symbol
const DIF_INPUT_Y_FRAC = 9.24 / DIF_VB_H    // circuit entry height on left side of symbol
// Punt de connexió de sortida: vora dreta del símbol a l'alçada del punt de contacte
// (calibrat via /dev/calibrar-elec2 — elec2-coords (2).json: x≈19.88, y≈29.67)
const DIF_CONN_X = DIF_SYMBOL_X + DIF_W * (19.88 / DIF_VB_W)
const DIF_CONN_Y_FRAC = 29.67 / DIF_VB_H

// ── Thermic symbol (viewBox 33.68 × 16.63) ────────────────────────────────────
const TERM_VB_W = 33.68, TERM_VB_H = 16.63
const TERM_W = 28, TERM_H = TERM_VB_H * (TERM_W / TERM_VB_W)
const TERM_CIRC_Y_FRAC = 15.33 / TERM_VB_H  // circuit Y inside thermic symbol

// Thermic line: 15mm gap after DIF_END_X (enough room so differential label doesn't overlap)
const TERM_LINE_START = DIF_END_X + 15 * MM
const TERM_X = 279.51                         // thermic symbol start (close to cuadro right)
const TERM_LINE_END = TERM_X - 2 * MM + 2    // line ends 2mm before symbol, +2pt closer

// IGA potencia text position (calibrated)
const IGA_TEXT_X = 141.52
const IGA_TEXT_Y = 250.29

// External circuit line: starts OUTSIDE the cuadro (calibrated)
const EXT_LINE_START = 322.43 + 20 * MM  // +2cm a la dreta
const EXT_LINE_LEN   = 70             // long enough for cable info text
const EXT_LINE_END   = EXT_LINE_START + EXT_LINE_LEN

// Earth protection line: reaches the vertical earth line (calibrated via /dev/calibrar-elec2 — x≈313.09)
const EARTH_START_X = 314.60
const EARTH_END_X   = EXT_LINE_END

// Column letter pairs
const BOT_LABELS = ['C','E','G','I','K','M','O','Q','S','U','W','Y']
const TOP_LABELS = ['D','F','H','J','L','N','P','R','T','V','X','Z']

export function UnifilarSVG({ circuits, diferencials, iga }: Props) {
  const N = diferencials.filter(d => circuits.some(c => c.diferencial_grup === d.id)).length || 1
  const activeDifs = diferencials.filter(d => circuits.some(c => c.diferencial_grup === d.id))
  const spacing = CUADRO_H / N

  const groups = activeDifs.map((dif, gi) => {
    const allocStart = CUADRO_Y + gi * spacing
    const difY = allocStart + spacing / 2
    const difInputY = (difY - DIF_H / 2) + DIF_H * DIF_INPUT_Y_FRAC
    const difConnY  = (difY - DIF_H / 2) + DIF_H * DIF_CONN_Y_FRAC
    const difCircuits = circuits.filter(c => c.diferencial_grup === dif.id)
    const Nc = difCircuits.length || 1
    const cSpacing = spacing / Nc
    return {
      dif, difY, difInputY, difConnY,
      circuitRows: difCircuits.map((circ, ci) => ({
        circ,
        // Single circuit: align to difConnY so the line from differential goes straight
        circY: Nc === 1 ? difConnY : allocStart + (ci + 0.5) * cSpacing,
        globalIdx: circuits.indexOf(circ),
      })),
    }
  })

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%"
      style={{ display: 'block', background: '#fff' }}
      fontFamily="Verdana, Arial, sans-serif">

      {/* Base schematic (occupies left BASE_W units) */}
      <image href="/svg/esquema-elec3.svg" x={0} y={-5} width={BASE_W} height={VB_H} />

      {/* Short horizontal connector: main bus → spine (shows the split) */}
      <line x1={208.27} y1={241.29} x2={DIF_X} y2={241.29}
        stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />

      {/* IGA potencia label */}
      {iga > 0 && (
        <text x={IGA_TEXT_X} y={IGA_TEXT_Y}
          textAnchor="middle" fontSize="6" fontWeight="bold" fill="#000">
          {iga}A
        </text>
      )}

      {/* Differential vertical spine — spans from first to last group's input connection */}
      {groups.length > 0 && (
        <line x1={DIF_X} y1={groups[0].difInputY} x2={DIF_X} y2={groups[groups.length - 1].difInputY}
          stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />
      )}


      <circle cx={DIF_X} cy={241.29} r={1.8} fill="#000" />

      {groups.map(({ dif, difY, difInputY, difConnY, circuitRows }) => (
        <g key={dif.id}>
          <circle cx={DIF_X} cy={difInputY} r={1.5} fill="#000" />
          {/* Pre-symbol horizontal line: spine junction → left of differential symbol */}
          <line x1={DIF_X} y1={difInputY} x2={DIF_SYMBOL_X - 2} y2={difInputY}
            stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />
          {/* Differential symbol at DIF_SYMBOL_X */}
          <image href="/svg/simbolo-diferencial.svg"
            x={DIF_SYMBOL_X} y={difY - DIF_H / 2} width={DIF_W} height={DIF_H} />
          <text x={DIF_SYMBOL_X + DIF_W / 2 + 5} y={difY + DIF_H / 2 + 9}
            textAnchor="middle" fontSize="5" fontWeight="bold" fill="#000">
            {dif.amperatge}A / {dif.sensibilitat_ma} mA
          </text>

          {/* Vertical thermic bus — only when multiple circuits */}
          {circuitRows.length > 1 && (() => {
            const ys = [difConnY, ...circuitRows.map(r => r.circY)]
            return <line x1={TERM_LINE_START} y1={Math.min(...ys)} x2={TERM_LINE_START} y2={Math.max(...ys)}
              stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />
          })()}
          {/* Differential → thermic bus horizontal connector */}
          <line x1={DIF_CONN_X} y1={difConnY} x2={TERM_LINE_START} y2={difConnY}
            stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />
          {/* Junction circle only needed when multiple circuits branch off */}
          {circuitRows.length > 1 && (
            <circle cx={TERM_LINE_START} cy={difConnY} r={1.2} fill="#000" />
          )}

          {/* Per-circuit thermic elements */}
          {circuitRows.map(({ circ, circY, globalIdx }) => {
            // Align thermic symbol so its internal circuit Y aligns with circY
            const termSymY = circY - TERM_H * TERM_CIRC_Y_FRAC
            const labelBot = BOT_LABELS[globalIdx] ?? `${globalIdx + 1}`
            const labelTop = TOP_LABELS[globalIdx] ?? `${globalIdx + 1}`

            return (
              <g key={circ.id}>
                <circle cx={TERM_LINE_START} cy={circY} r={1.2} fill="#000" />

                {/* Horizontal branch: 5mm gap then line to symbol */}
                <line x1={TERM_LINE_START} y1={circY} x2={TERM_LINE_END} y2={circY}
                  stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />

                {/* Thermic symbol — 2mm after line */}
                <image href="/svg/simbolo-termico.svg"
                  x={TERM_X} y={termSymY} width={TERM_W} height={TERM_H} />

                {/* Amperage below thermic */}
                {circ.pia_amperatge > 0 && (
                  <text x={TERM_X + TERM_W / 2} y={termSymY + TERM_H + 2}
                    textAnchor="middle" fontSize="5" fontWeight="bold" fill="#000">
                    {circ.pia_amperatge}A
                  </text>
                )}

                {/* Internal circuit line: from thermic symbol's edge (crosses the cuadro border) → EXT_LINE_START */}
                <line x1={TERM_X + TERM_W - 2} y1={circY} x2={EXT_LINE_START} y2={circY}
                  stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />

                {/* External circuit line: EXT_LINE_START → EXT_LINE_END (outside cuadro) */}
                <line x1={EXT_LINE_START} y1={circY} x2={EXT_LINE_END} y2={circY}
                  stroke="#000" strokeWidth="0.9" strokeDasharray="3 3" />

                {/* Earth protection line — reaches the vertical earth line */}
                <line x1={EARTH_START_X} y1={circY + 4} x2={EARTH_END_X} y2={circY + 4}
                  stroke="#000" strokeWidth="0.7" strokeDasharray="1 1" />

                {/* Letter at START of external line — white halo so the dashed line doesn't cross through it */}
                <text x={EXT_LINE_START - 1} y={circY + 2} textAnchor="end" fontSize="5" fontWeight="bold"
                  stroke="#fff" strokeWidth="2.5" paintOrder="stroke" fill="#000">{labelBot}</text>

                {/* Letter at END of external line — white halo, same reason */}
                <text x={EXT_LINE_END + 1} y={circY + 2} textAnchor="start" fontSize="5" fontWeight="bold"
                  stroke="#fff" strokeWidth="2.5" paintOrder="stroke" fill="#000">{labelTop}</text>

                {/* Cable section above the external line */}
                {circ.seccio && (
                  <text x={EXT_LINE_START + 5} y={circY - 3} fontSize="5.5" fill="#000">{circ.seccio}</text>
                )}

                {/* Circuit name: after end letter, followed by power 1.5cm later, bigger & bold */}
                <text x={EXT_LINE_END + 14} y={circY + 2}
                  fontSize="5.5" fontWeight="bold" fill="#000">
                  {circ.nom}
                  {circ.potencia_kw > 0 && (
                    <tspan dx={10 * MM - 2} fontSize="6">{circ.potencia_kw.toFixed(2).replace('.', ',')} kW</tspan>
                  )}
                </text>
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
