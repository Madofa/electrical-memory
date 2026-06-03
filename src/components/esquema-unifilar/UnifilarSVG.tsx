import type { Circuit, Diferencial } from '../../types/esquemaUnifilar'

// Matches the official ELEC-2 form layout:
// 12 fixed column slots (C-D … Y-Z), outer panel rectangle,
// dashed differential groups, dashed trunk lines, IGA symbol, ICP box, kWh rectangle, terra.

interface Props {
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga: number
}

const NUM_COLS   = 12
const COL_W      = 46
const LEFT_M     = 130   // row-label band width
const RIGHT_M    = 40
const SVG_W      = LEFT_M + NUM_COLS * COL_W + RIGHT_M  // 730
const SVG_H      = 690

// Column slot X-center (0-indexed)
const cx = (i: number) => LEFT_M + COL_W * i + COL_W / 2
const CENTER_X   = SVG_W / 2

// Row Y positions (top-down; origin top-left in SVG)
const Y = {
  colTop:    18,   // top of dashed column lines + top labels
  colBot:    235,  // bottom of column lines + bottom labels
  potencia:  28,
  receptor:  80,
  seccio:    200,
  // outer panel rectangle
  panelTop:  242,
  panelBot:  340,
  // differential boxes (inside panel, dashed border)
  difTop:    248,
  difBot:    332,
  // trunk below panel
  trunk1:    340,
  trunk2:    378,
  // IGA
  igaTop:    378,
  igaBot:    420,
  // ICP
  icpTop:    432,
  icpBot:    454,
  // kWh
  kwhTop:    468,
  kwhBot:    520,
  // terra
  terraBase: 545,
}

const BOT_LABELS = ['C','E','G','I','K','M','O','Q','S','U','W','Y']
const TOP_LABELS = ['D','F','H','J','L','N','P','R','T','V','X','Z']

const LAYER_LABELS = [
  { y: (Y.colTop + Y.colBot) / 2 - 80, label: 'POTÈNCIA kW' },
  { y: (Y.colTop + Y.colBot) / 2 - 20, label: 'RECEPTORS' },
  { y: Y.seccio + 8,                   label: 'SECCIONS mm²' },
  { y: (Y.panelTop + Y.panelBot) / 2,  label: 'PIA / DIFERENCIALS' },
  { y: (Y.igaTop + Y.igaBot) / 2,      label: 'INT. GENERAL' },
  { y: (Y.icpTop + Y.icpBot) / 2,      label: 'CAIXA ICP' },
  { y: (Y.kwhTop + Y.kwhBot) / 2,      label: 'COMPTADORS' },
]

export function UnifilarSVG({ circuits, diferencials, iga }: Props) {
  const fg     = '#e2e8f0'
  const muted  = '#94a3b8'
  const stroke = '#cbd5e1'
  const dash   = '#60a5fa'   // blue for dashed lines (preview only)
  const bg     = '#0f1729'

  const slotCount = Math.min(circuits.length, NUM_COLS)

  type Grupo = { dif: Diferencial; idxs: number[] }
  const grupos: Grupo[] = diferencials
    .map((d) => ({
      dif: d,
      idxs: circuits.map((c, i) => c.diferencial_grup === d.id ? i : -1).filter((i) => i >= 0),
    }))
    .filter((g) => g.idxs.length > 0)

  const igaH  = Y.igaBot - Y.igaTop
  const igaCy = Y.igaTop + igaH / 2

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      style={{ background: bg, display: 'block', borderRadius: '6px' }}
      fontFamily="Arial, sans-serif"
      fontSize="10"
    >
      {/* Row labels */}
      {LAYER_LABELS.map(({ y, label }) => (
        <text key={label} x={LEFT_M - 6} y={y} textAnchor="end" fill={muted} fontSize="8" fontWeight="bold">
          {label}
        </text>
      ))}

      {/* ── 1. Dashed vertical column lines + labels — only active circuits ── */}
      {Array.from({ length: slotCount }, (_, i) => {
        const x = cx(i)
        return (
          <g key={`col-${i}`}>
            {/* Two segments — gap at D label (Y.seccio) and at C label (Y.panelTop) */}
            <line x1={x} y1={Y.colTop + 2} x2={x} y2={Y.seccio - 7}
              stroke={dash} strokeWidth="0.7" strokeDasharray="4 3" />
            <line x1={x} y1={Y.seccio + 12} x2={x} y2={Y.panelTop - 10}
              stroke={dash} strokeWidth="0.7" strokeDasharray="4 3" />
            {/* C, E, G... — bottom of SECCIONS zone (= panel top level) */}
            <text x={x} y={Y.panelTop - 2} textAnchor="middle" fill={fg} fontSize="8" fontWeight="bold">
              {BOT_LABELS[i]}
            </text>
            {/* D, F, H... — top of SECCIONS zone (= seccio level) */}
            <text x={x} y={Y.seccio - 2} textAnchor="middle" fill={fg} fontSize="8" fontWeight="bold">
              {TOP_LABELS[i]}
            </text>
          </g>
        )
      })}

      {/* ── 2. Data in active columns (Can Manel layout) ── */}
      {/* Potència: top zone | Receptor: RECEPTORS zone (above D labels) | Seccio: SECCIONS zone (D-C band) */}
      {circuits.slice(0, slotCount).map((c, i) => {
        const x = cx(i)
        return (
          <g key={c.id}>
            {/* POTÈNCIA — toFixed(2) per alineació uniforme, baixat 5px */}
            {c.potencia_kw > 0 && (
              <text
                x={x - 4} y={Y.potencia + 19}
                textAnchor="start" fill={fg} fontSize="10"
                transform={`rotate(-90 ${x - 4} ${Y.potencia + 19})`}
              >
                {c.potencia_kw.toFixed(2).replace('.', ',')} kW
              </text>
            )}
            {/* RECEPTOR NAME — propera a la línia */}
            <text
              x={x - 4} y={Y.seccio - 2}
              textAnchor="start" fill={fg} fontSize="10"
              transform={`rotate(-90 ${x - 4} ${Y.seccio - 2})`}
            >
              {c.nom}
            </text>
            {/* SECCIÓ — mateixa alineació que nom i potència */}
            <text
              x={x - 4} y={Y.panelTop - 12}
              textAnchor="start" fill={muted} fontSize="10"
              transform={`rotate(-90 ${x - 4} ${Y.panelTop - 12})`}
            >
              {c.seccio}
            </text>
            {/* PIA symbol + amperaje between column bottom and panel */}
            {(() => {
              const piaYBot = Y.panelTop + 22   // below C/E/G labels
              const piaYTop = piaYBot + 18
              const r = 3
              return (
                <g key={`pia-sym-${c.id}`}>
                  {/* Line from column to PIA top */}
                  <line x1={x} y1={Y.colBot} x2={x} y2={piaYTop} stroke={stroke} strokeWidth="1" />
                  {/* Top terminal circle */}
                  <circle cx={x} cy={piaYTop} r={r} fill={bg} stroke={stroke} strokeWidth="0.9" />
                  {/* Diagonal blade */}
                  <line x1={x-4} y1={piaYBot+5} x2={x+4} y2={piaYTop-5} stroke={fg} strokeWidth="1.2" />
                  {/* Bottom terminal circle */}
                  <circle cx={x} cy={piaYBot} r={r} fill={bg} stroke={stroke} strokeWidth="0.9" />
                  {/* Amperaje */}
                  {c.pia_amperatge > 0 && (
                    <text x={x+5} y={piaYBot+8} fill={fg} fontSize="8" fontWeight="bold">
                      {c.pia_amperatge}A
                    </text>
                  )}
                  {/* Line from PIA into panel */}
                  <line x1={x} y1={piaYBot} x2={x} y2={Y.panelTop} stroke={stroke} strokeWidth="1" />
                </g>
              )
            })()}
          </g>
        )
      })}

      {/* ── 3. Outer panel rectangle ── */}
      <rect x={LEFT_M} y={Y.panelTop} width={NUM_COLS * COL_W} height={Y.panelBot - Y.panelTop}
        fill="none" stroke={stroke} strokeWidth="1.4" />

      {/* ── 5. Differential groups — dashed boxes inside panel ── */}
      {grupos.map((g, gi) => {
        const xs    = g.idxs.map(cx)
        const xMin  = Math.min(...xs) - COL_W / 2
        const xMax  = Math.max(...xs) + COL_W / 2
        const xCtr  = (xMin + xMax) / 2
        return (
          <g key={g.dif.id || gi}>
            <rect x={xMin + 2} y={Y.difTop} width={xMax - xMin - 4} height={Y.difBot - Y.difTop}
              fill="none" stroke={dash} strokeWidth="0.9" strokeDasharray="4 3" />
            <text x={xCtr} y={(Y.difTop + Y.difBot) / 2 + 4}
              textAnchor="middle" fill={fg} fontSize="9" fontWeight="bold">
              {g.dif.amperatge}A/{g.dif.sensibilitat_ma}mA
            </text>
            {/* Line from dif center to panel bottom */}
            <line x1={xCtr} y1={Y.difBot} x2={xCtr} y2={Y.panelBot}
              stroke={stroke} strokeWidth="1.2" />
          </g>
        )
      })}

      {/* Bus inside panel bottom */}
      {grupos.length > 0 && (() => {
        const centers = grupos.map((g) => {
          const xs = g.idxs.map(cx)
          return (Math.min(...xs) + Math.max(...xs)) / 2
        })
        return (
          <line x1={Math.min(...centers, CENTER_X)} y1={Y.panelBot}
            x2={Math.max(...centers, CENTER_X)} y2={Y.panelBot}
            stroke={stroke} strokeWidth="1.4" />
        )
      })()}

      {/* ── 6. Dashed trunk: panel → IGA ── */}
      <line x1={CENTER_X} y1={Y.trunk1} x2={CENTER_X} y2={Y.trunk2}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />

      {/* ── 7. IGA box with switch symbol ── */}
      <rect x={CENTER_X - 13} y={Y.igaTop} width={26} height={igaH}
        fill={bg} stroke={stroke} strokeWidth="1.4" />
      {/* Top terminal circle */}
      <circle cx={CENTER_X} cy={Y.igaTop + 5} r="2.5" fill={bg} stroke={stroke} strokeWidth="1.1" />
      {/* Diagonal switch blade */}
      <line x1={CENTER_X - 4} y1={igaCy + 3} x2={CENTER_X + 3} y2={Y.igaTop + 8}
        stroke={fg} strokeWidth="1.3" />
      {/* Bottom terminal circle */}
      <circle cx={CENTER_X} cy={Y.igaBot - 5} r="2.5" fill={bg} stroke={stroke} strokeWidth="1.1" />
      <text x={CENTER_X + 17} y={igaCy + 4} fill={fg} fontSize="9" fontWeight="bold">
        {iga}A
      </text>

      {/* ── 8. Dashed trunk: IGA → ICP ── */}
      <line x1={CENTER_X} y1={Y.igaBot} x2={CENTER_X} y2={Y.icpTop}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />

      {/* ── 9. ICP — small solid box ── */}
      <rect x={CENTER_X - 9} y={Y.icpTop} width={18} height={Y.icpBot - Y.icpTop}
        fill={bg} stroke={stroke} strokeWidth="1.2" />

      {/* ── 10. Dashed trunk: ICP → kWh ── */}
      <line x1={CENTER_X} y1={Y.icpBot} x2={CENTER_X} y2={Y.kwhTop}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />

      {/* ── 11. kWh meter — large rectangle ── */}
      <rect x={CENTER_X - 23} y={Y.kwhTop} width={46} height={Y.kwhBot - Y.kwhTop}
        fill={bg} stroke={stroke} strokeWidth="1.2" />
      <text x={CENTER_X} y={(Y.kwhTop + Y.kwhBot) / 2 + 4}
        textAnchor="middle" fill={fg} fontSize="11" fontWeight="bold">
        kWh
      </text>

      {/* ── 12. Terra symbol (bottom-right) ── */}
      {/* Dashed line from kWh to terra */}
      <line x1={CENTER_X} y1={Y.kwhBot} x2={CENTER_X} y2={Y.terraBase - 8}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />
      <line x1={CENTER_X} y1={Y.terraBase - 8} x2={SVG_W - RIGHT_M - 10} y2={Y.terraBase - 8}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />
      <line x1={SVG_W - RIGHT_M - 10} y1={Y.terraBase - 8} x2={SVG_W - RIGHT_M - 10} y2={Y.terraBase}
        stroke={dash} strokeWidth="1.4" strokeDasharray="5 3" />
      {/* Three terra lines */}
      {[0, 5, 10].map((offset, j) => (
        <line key={j}
          x1={SVG_W - RIGHT_M - 10 - (12 - j * 4)}
          y1={Y.terraBase + offset}
          x2={SVG_W - RIGHT_M - 10 + (12 - j * 4)}
          y2={Y.terraBase + offset}
          stroke={stroke} strokeWidth={1.6 - j * 0.3} />
      ))}
    </svg>
  )
}
