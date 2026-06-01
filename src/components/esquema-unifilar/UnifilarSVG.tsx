import type { Circuit, Diferencial, DadesCapcalera } from '../../types/esquemaUnifilar'

interface Props {
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga: number
  capcalera: DadesCapcalera
  // Modo de renderizado: 'preview' (interactivo en pantalla, dark bg) o
  // 'pdf' (blanco, sin estilos hover).
  variant?: 'preview' | 'pdf'
}

// Distribución horizontal: cada circuito ocupa una columna.
const COL_WIDTH = 100
const LEFT_MARGIN = 140
const RIGHT_MARGIN = 30

// Posiciones Y de cada capa
const Y_POT = 50
const Y_REC = 80
const Y_SEC = 200
const Y_PIA = 230
const Y_PIA_BOTTOM = 290
const Y_DIF_TOP = 310
const Y_DIF_BOTTOM = 360
const Y_BUS = 400
const Y_IGA_TOP = 440
const Y_IGA_BOTTOM = 490
const Y_ICP_TOP = 510
const Y_ICP_BOTTOM = 560
const Y_COMP_TOP = 580
const Y_COMP_BOTTOM = 630
const Y_TERRA = 670
const HEIGHT = 700

const LAYER_LABELS = [
  { y: Y_POT, label: 'POTÈNCIA kW' },
  { y: (Y_REC + Y_SEC) / 2 - 30, label: 'RECEPTORS' },
  { y: Y_SEC, label: 'SECCIONS mm²' },
  { y: (Y_PIA + Y_PIA_BOTTOM) / 2, label: 'PIA A' },
  { y: (Y_DIF_TOP + Y_DIF_BOTTOM) / 2, label: 'DIFERENCIALS A/mA' },
  { y: (Y_IGA_TOP + Y_IGA_BOTTOM) / 2, label: 'INT. GENERAL AUTOMÀTIC A' },
  { y: (Y_ICP_TOP + Y_ICP_BOTTOM) / 2, label: 'CAIXA PER A ICP' },
  { y: (Y_COMP_TOP + Y_COMP_BOTTOM) / 2, label: 'COMPTADORS' },
]

export function UnifilarSVG({ circuits, diferencials, iga, capcalera, variant = 'preview' }: Props) {
  const totalWidth = Math.max(
    600,
    LEFT_MARGIN + Math.max(circuits.length, 3) * COL_WIDTH + RIGHT_MARGIN,
  )

  const xOf = (i: number) => LEFT_MARGIN + COL_WIDTH / 2 + i * COL_WIDTH
  const cx = totalWidth / 2

  // Color palette según variante
  const fg = variant === 'preview' ? '#e2e8f0' : '#000'      // texto principal
  const muted = variant === 'preview' ? '#94a3b8' : '#333'   // textos secundarios
  const stroke = variant === 'preview' ? '#cbd5e1' : '#000'  // líneas
  const bg = variant === 'preview' ? '#0f1729' : '#fff'

  // Agrupar circuitos por diferencial
  type Grupo = { id: string; dif: Diferencial; circuitIdxs: number[] }
  const grupos: Grupo[] = diferencials
    .map((d) => ({
      id: d.id,
      dif: d,
      circuitIdxs: circuits
        .map((c, i) => (c.diferencial_grup === d.id ? i : -1))
        .filter((i) => i >= 0),
    }))
    .filter((g) => g.circuitIdxs.length > 0)

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${HEIGHT}`}
      width="100%"
      style={{ background: bg, display: 'block' }}
      fontFamily="Arial, sans-serif"
      fontSize="11"
    >
      {/* Etiquetes de capa (banda lateral esquerra) */}
      {LAYER_LABELS.map(({ y, label }) => (
        <text
          key={label}
          x={LEFT_MARGIN - 12}
          y={y}
          textAnchor="end"
          fill={muted}
          fontSize="9"
          fontWeight="bold"
        >
          {label}
        </text>
      ))}

      {/* Per cada circuit */}
      {circuits.map((c, i) => {
        const x = xOf(i)
        return (
          <g key={c.id}>
            {/* Potència */}
            <text x={x} y={Y_POT} textAnchor="middle" fill={fg} fontSize="11">
              {c.potencia_kw > 0 ? c.potencia_kw.toFixed(2).replace('.', ',') : '—'}
            </text>

            {/* Receptor (diagonal -60°) */}
            <text
              x={x}
              y={Y_REC + 40}
              textAnchor="start"
              fill={fg}
              fontSize="11"
              transform={`rotate(-60 ${x} ${Y_REC + 40})`}
            >
              {c.nom}
            </text>

            {/* Secció */}
            <text x={x} y={Y_SEC} textAnchor="middle" fill={muted} fontSize="10">
              {c.seccio}
            </text>

            {/* PIA — símbol senzill */}
            <line x1={x} y1={Y_PIA} x2={x} y2={Y_PIA_BOTTOM} stroke={stroke} strokeWidth="1.2" />
            <rect
              x={x - 8}
              y={Y_PIA + 8}
              width={16}
              height={18}
              fill={bg}
              stroke={stroke}
              strokeWidth="1.2"
            />
            <line
              x1={x - 5}
              y1={Y_PIA + 20}
              x2={x + 5}
              y2={Y_PIA + 12}
              stroke={stroke}
              strokeWidth="1.2"
            />
            <text x={x + 14} y={Y_PIA + 22} fill={fg} fontSize="10">
              {c.pia_amperatge}
            </text>

            {/* Connexió PIA → diferencial */}
            <line
              x1={x}
              y1={Y_PIA_BOTTOM}
              x2={x}
              y2={Y_DIF_TOP}
              stroke={stroke}
              strokeWidth="1.2"
            />
          </g>
        )
      })}

      {/* Per cada grup de diferencial */}
      {grupos.map((g) => {
        const xs = g.circuitIdxs.map(xOf)
        const xMin = Math.min(...xs) - 20
        const xMax = Math.max(...xs) + 20
        const xCenter = (xMin + xMax) / 2
        return (
          <g key={g.id}>
            {/* Rectangle del diferencial */}
            <rect
              x={xMin}
              y={Y_DIF_TOP}
              width={xMax - xMin}
              height={Y_DIF_BOTTOM - Y_DIF_TOP}
              fill={bg}
              stroke={stroke}
              strokeWidth="1.4"
            />
            <text
              x={xCenter}
              y={(Y_DIF_TOP + Y_DIF_BOTTOM) / 2 + 4}
              textAnchor="middle"
              fill={fg}
              fontSize="11"
              fontWeight="bold"
            >
              {g.dif.amperatge}A · {g.dif.sensibilitat_ma}mA
            </text>

            {/* Connexió diferencial → bus */}
            <line
              x1={xCenter}
              y1={Y_DIF_BOTTOM}
              x2={xCenter}
              y2={Y_BUS}
              stroke={stroke}
              strokeWidth="1.4"
            />
          </g>
        )
      })}

      {/* Bus horitzontal */}
      {grupos.length > 0 && (() => {
        const xs = grupos.map((g) => {
          const cxs = g.circuitIdxs.map(xOf)
          return (Math.min(...cxs) + Math.max(...cxs)) / 2
        })
        const xMin = Math.min(...xs, cx)
        const xMax = Math.max(...xs, cx)
        return (
          <line
            x1={xMin}
            y1={Y_BUS}
            x2={xMax}
            y2={Y_BUS}
            stroke={stroke}
            strokeWidth="1.6"
          />
        )
      })()}

      {/* IGA central */}
      <line x1={cx} y1={Y_BUS} x2={cx} y2={Y_IGA_TOP} stroke={stroke} strokeWidth="1.6" />
      <rect
        x={cx - 14}
        y={Y_IGA_TOP}
        width={28}
        height={Y_IGA_BOTTOM - Y_IGA_TOP}
        fill={bg}
        stroke={stroke}
        strokeWidth="1.6"
      />
      <line
        x1={cx - 8}
        y1={Y_IGA_TOP + 8}
        x2={cx + 8}
        y2={Y_IGA_TOP + 20}
        stroke={stroke}
        strokeWidth="1.4"
      />
      <text x={cx + 18} y={(Y_IGA_TOP + Y_IGA_BOTTOM) / 2 + 4} fill={fg} fontSize="11" fontWeight="bold">
        IGA {iga}A
      </text>

      {/* Connexió IGA → ICP */}
      <line x1={cx} y1={Y_IGA_BOTTOM} x2={cx} y2={Y_ICP_TOP} stroke={stroke} strokeWidth="1.6" />

      {/* Caixa ICP (buida) */}
      <rect
        x={cx - 28}
        y={Y_ICP_TOP}
        width={56}
        height={Y_ICP_BOTTOM - Y_ICP_TOP}
        fill={bg}
        stroke={stroke}
        strokeWidth="1.4"
        strokeDasharray="3,2"
      />
      <text x={cx + 34} y={(Y_ICP_TOP + Y_ICP_BOTTOM) / 2 + 4} fill={muted} fontSize="9">
        ICP
      </text>

      {/* Connexió ICP → Comptador */}
      <line x1={cx} y1={Y_ICP_BOTTOM} x2={cx} y2={Y_COMP_TOP} stroke={stroke} strokeWidth="1.6" />

      {/* Comptador kWh */}
      <circle cx={cx} cy={(Y_COMP_TOP + Y_COMP_BOTTOM) / 2} r={22} fill={bg} stroke={stroke} strokeWidth="1.4" />
      <text x={cx} y={(Y_COMP_TOP + Y_COMP_BOTTOM) / 2 + 4} textAnchor="middle" fill={fg} fontSize="10" fontWeight="bold">
        kWh
      </text>

      {/* Presa de terra (decoració del comptador) */}
      <line x1={cx} y1={Y_COMP_BOTTOM} x2={cx} y2={Y_TERRA - 12} stroke={stroke} strokeWidth="1.4" />
      <line x1={cx - 14} y1={Y_TERRA - 12} x2={cx + 14} y2={Y_TERRA - 12} stroke={stroke} strokeWidth="1.6" />
      <line x1={cx - 9} y1={Y_TERRA - 6} x2={cx + 9} y2={Y_TERRA - 6} stroke={stroke} strokeWidth="1.4" />
      <line x1={cx - 4} y1={Y_TERRA} x2={cx + 4} y2={Y_TERRA} stroke={stroke} strokeWidth="1.4" />
    </svg>
  )
}
