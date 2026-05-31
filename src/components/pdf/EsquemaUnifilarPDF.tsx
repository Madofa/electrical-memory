import { Document, Page, View, Text, Svg, Line, Rect, Circle, G, StyleSheet } from '@react-pdf/renderer'
import type { Circuit, Diferencial, DadesCapcalera } from '../../types/esquemaUnifilar'

// El SVG en el PDF necesita usar los primitivos de @react-pdf, no DOM SVG.
// Por eso replicamos el dibujo aquí con dimensiones adaptadas a A4 horizontal.

const PAGE_W = 842   // A4 landscape pt
const PAD = 30

const s = StyleSheet.create({
  page: { padding: PAD, fontFamily: 'Helvetica', fontSize: 9, color: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 4 },
  title: { fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  meta: { fontSize: 9, color: '#333' },
})

interface Props {
  nom: string
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga: number
  capcalera: DadesCapcalera
}

// Layout constants (en unidades del SVG, mismas que el preview)
const COL_WIDTH = 100
const LEFT_MARGIN = 140
const RIGHT_MARGIN = 30
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
const SVG_HEIGHT = 700

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

export function EsquemaUnifilarPDF({ nom, circuits, diferencials, iga, capcalera }: Props) {
  const totalWidth = Math.max(
    600,
    LEFT_MARGIN + Math.max(circuits.length, 3) * COL_WIDTH + RIGHT_MARGIN,
  )
  const xOf = (i: number) => LEFT_MARGIN + COL_WIDTH / 2 + i * COL_WIDTH
  const cx = totalWidth / 2

  // viewBox del SVG en el espacio del PDF
  const svgViewWidth = PAGE_W - PAD * 2
  const svgViewHeight = (svgViewWidth * SVG_HEIGHT) / totalWidth

  const grupos = diferencials
    .map((d) => ({
      id: d.id,
      dif: d,
      circuitIdxs: circuits
        .map((c, i) => (c.diferencial_grup === d.id ? i : -1))
        .filter((i) => i >= 0),
    }))
    .filter((g) => g.circuitIdxs.length > 0)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Esquema Unifilar — {nom}</Text>
            <Text style={s.meta}>Model ELEC 2 · {capcalera.emplacament}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.meta}>{capcalera.empresa_distribuidora}</Text>
            <Text style={s.meta}>{capcalera.seccio_connexio} · {capcalera.tensio}</Text>
            <Text style={s.meta}>{capcalera.titular}</Text>
          </View>
        </View>

        <Svg width={svgViewWidth} height={svgViewHeight} viewBox={`0 0 ${totalWidth} ${SVG_HEIGHT}`}>
          {/* Etiquetes de capa */}
          {LAYER_LABELS.map(({ y, label }) => (
            <Text
              key={label}
              x={LEFT_MARGIN - 12}
              y={y}
              fill="#333"
              style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}
            >
              {label}
            </Text>
          ))}

          {circuits.map((c, i) => {
            const x = xOf(i)
            return (
              <G key={c.id}>
                <Text x={x - 12} y={Y_POT} fill="#000" style={{ fontSize: 11 }}>
                  {c.potencia_kw > 0 ? c.potencia_kw.toFixed(2).replace('.', ',') : '—'}
                </Text>

                {/* Receptor nombre (sin rotación porque @react-pdf Svg no soporta transform en Text)
                    Lo ponemos vertical apilado con caracteres */}
                <Text x={x - 4} y={Y_REC + 10} fill="#000" style={{ fontSize: 9 }}>
                  {c.nom.slice(0, 16)}
                </Text>

                <Text x={x - 16} y={Y_SEC} fill="#333" style={{ fontSize: 9 }}>
                  {c.seccio}
                </Text>

                {/* PIA */}
                <Line x1={x} y1={Y_PIA} x2={x} y2={Y_PIA_BOTTOM} stroke="#000" strokeWidth={1.2} />
                <Rect x={x - 8} y={Y_PIA + 8} width={16} height={18} fill="#fff" stroke="#000" strokeWidth={1.2} />
                <Line x1={x - 5} y1={Y_PIA + 20} x2={x + 5} y2={Y_PIA + 12} stroke="#000" strokeWidth={1.2} />
                <Text x={x + 12} y={Y_PIA + 22} fill="#000" style={{ fontSize: 9 }}>
                  {c.pia_amperatge}
                </Text>

                {/* Conexión hacia el diferencial */}
                <Line x1={x} y1={Y_PIA_BOTTOM} x2={x} y2={Y_DIF_TOP} stroke="#000" strokeWidth={1.2} />
              </G>
            )
          })}

          {grupos.map((g) => {
            const xs = g.circuitIdxs.map(xOf)
            const xMin = Math.min(...xs) - 20
            const xMax = Math.max(...xs) + 20
            const xCenter = (xMin + xMax) / 2
            return (
              <G key={g.id}>
                <Rect
                  x={xMin}
                  y={Y_DIF_TOP}
                  width={xMax - xMin}
                  height={Y_DIF_BOTTOM - Y_DIF_TOP}
                  fill="#fff"
                  stroke="#000"
                  strokeWidth={1.4}
                />
                <Text
                  x={xCenter - 22}
                  y={(Y_DIF_TOP + Y_DIF_BOTTOM) / 2 + 4}
                  fill="#000"
                  style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}
                >
                  {g.dif.amperatge}A·{g.dif.sensibilitat_ma}mA
                </Text>
                <Line x1={xCenter} y1={Y_DIF_BOTTOM} x2={xCenter} y2={Y_BUS} stroke="#000" strokeWidth={1.4} />
              </G>
            )
          })}

          {/* Bus horizontal */}
          {grupos.length > 0 && (() => {
            const xs = grupos.map((g) => {
              const cxs = g.circuitIdxs.map(xOf)
              return (Math.min(...cxs) + Math.max(...cxs)) / 2
            })
            const xMin = Math.min(...xs, cx)
            const xMax = Math.max(...xs, cx)
            return (
              <Line x1={xMin} y1={Y_BUS} x2={xMax} y2={Y_BUS} stroke="#000" strokeWidth={1.6} />
            )
          })()}

          {/* IGA */}
          <Line x1={cx} y1={Y_BUS} x2={cx} y2={Y_IGA_TOP} stroke="#000" strokeWidth={1.6} />
          <Rect x={cx - 14} y={Y_IGA_TOP} width={28} height={Y_IGA_BOTTOM - Y_IGA_TOP} fill="#fff" stroke="#000" strokeWidth={1.6} />
          <Line x1={cx - 8} y1={Y_IGA_TOP + 8} x2={cx + 8} y2={Y_IGA_TOP + 20} stroke="#000" strokeWidth={1.4} />
          <Text x={cx + 18} y={(Y_IGA_TOP + Y_IGA_BOTTOM) / 2 + 4} fill="#000" style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>
            IGA {iga}A
          </Text>

          <Line x1={cx} y1={Y_IGA_BOTTOM} x2={cx} y2={Y_ICP_TOP} stroke="#000" strokeWidth={1.6} />

          {/* ICP */}
          <Rect x={cx - 28} y={Y_ICP_TOP} width={56} height={Y_ICP_BOTTOM - Y_ICP_TOP} fill="#fff" stroke="#000" strokeWidth={1.4} strokeDasharray="3,2" />
          <Text x={cx + 34} y={(Y_ICP_TOP + Y_ICP_BOTTOM) / 2 + 4} fill="#333" style={{ fontSize: 9 }}>
            ICP
          </Text>

          <Line x1={cx} y1={Y_ICP_BOTTOM} x2={cx} y2={Y_COMP_TOP} stroke="#000" strokeWidth={1.6} />

          {/* Comptador */}
          <Circle cx={cx} cy={(Y_COMP_TOP + Y_COMP_BOTTOM) / 2} r={22} fill="#fff" stroke="#000" strokeWidth={1.4} />
          <Text x={cx - 9} y={(Y_COMP_TOP + Y_COMP_BOTTOM) / 2 + 4} fill="#000" style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
            kWh
          </Text>

          {/* Terra */}
          <Line x1={cx} y1={Y_COMP_BOTTOM} x2={cx} y2={Y_TERRA - 12} stroke="#000" strokeWidth={1.4} />
          <Line x1={cx - 14} y1={Y_TERRA - 12} x2={cx + 14} y2={Y_TERRA - 12} stroke="#000" strokeWidth={1.6} />
          <Line x1={cx - 9} y1={Y_TERRA - 6} x2={cx + 9} y2={Y_TERRA - 6} stroke="#000" strokeWidth={1.4} />
          <Line x1={cx - 4} y1={Y_TERRA} x2={cx + 4} y2={Y_TERRA} stroke="#000" strokeWidth={1.4} />
        </Svg>
      </Page>
    </Document>
  )
}
