import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { Elec3Doc } from '../../lib/supabase-elec3'
import type { Instalador } from '../../types'
import type { TramCalculat } from '../../lib/elec3-calculs'
import { calculaTrams } from '../../lib/elec3-calculs'
import { formatDate } from '../../lib/supabase'

const B = '#000'
const s = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8, color: B },
  title: { fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase' },
  subtitle: { fontSize: 8, textAlign: 'center', color: '#555', marginBottom: 10 },
  tableHead: { flexDirection: 'row', backgroundColor: '#d8d8d8', borderWidth: 1, borderColor: B, borderStyle: 'solid' },
  tableRow: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: B, borderStyle: 'solid' },
  tableRowErr: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: B, borderStyle: 'solid', backgroundColor: '#fee2e2' },
  th: { padding: '2 3', fontFamily: 'Helvetica-Bold', fontSize: 7, textAlign: 'center' },
  td: { padding: '2 3', fontSize: 8, textAlign: 'right' },
  tdLeft: { padding: '2 3', fontSize: 8, textAlign: 'left' },
  tdBold: { padding: '2 3', fontSize: 8, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  cellBorder: { borderRightWidth: 1, borderColor: B, borderStyle: 'solid' },
  note: { fontSize: 7, color: '#555', marginTop: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderColor: '#ccc', borderStyle: 'solid', paddingTop: 4 },
})

const COLS = [
  { key: 'nom', label: 'TRAM', flex: 3, right: false },
  { key: 'carrega_pct', label: 'C.\n%', flex: 0.6 },
  { key: 'potencia_demanada_kw', label: 'Pot.\nkW', flex: 0.8 },
  { key: 'cos_fi', label: 'cos\nφ', flex: 0.6 },
  { key: 'intensitat_a', label: 'Int.\nA', flex: 0.8 },
  { key: 'seccio_mm2', label: 'Secc.\nmm²', flex: 0.8 },
  { key: 'longitud_m', label: 'Long.\nm', flex: 0.8 },
  { key: 'moment_kwm', label: 'Moment\nkW·m', flex: 1 },
  { key: 'caiguda_parcial_pct', label: 'Caig.\nparcial %', flex: 1 },
  { key: 'caiguda_total_pct', label: 'Caig.\ntotal %', flex: 1 },
]

interface Props { doc: Elec3Doc; instalador: Instalador }

export function Elec3PDF({ doc, instalador }: Props) {
  const trams: TramCalculat[] = calculaTrams(doc.trams)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>Memòria Tècnica — Caiguda de tensió (ELEC-3)</Text>
        <Text style={s.subtitle}>{doc.nom} · {instalador.nombre_completo} · {formatDate(new Date().toISOString())}</Text>

        {/* Capçalera taula */}
        <View style={s.tableHead}>
          {COLS.map((c) => (
            <Text key={c.key} style={[s.th, s.cellBorder, { flex: c.flex }]}>{c.label}</Text>
          ))}
        </View>

        {/* Files */}
        {trams.map((t) => (
          <View key={t.id} style={t.ok ? s.tableRow : s.tableRowErr}>
            <Text style={[s.tdLeft, s.cellBorder, { flex: 3 }]}>{t.nom}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.6 }]}>{t.carrega_pct}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.8 }]}>{t.potencia_demanada_kw}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.6 }]}>{t.cos_fi}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.8 }]}>{t.intensitat_a}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.8 }]}>{t.seccio_mm2}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 0.8 }]}>{t.longitud_m}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 1 }]}>{t.moment_kwm}</Text>
            <Text style={[s.td, s.cellBorder, { flex: 1 }]}>{t.caiguda_parcial_pct.toFixed(2)}</Text>
            <Text style={[t.ok ? s.td : s.tdBold, { flex: 1 }]}>{t.caiguda_total_pct.toFixed(2)}</Text>
          </View>
        ))}

        <Text style={s.note}>
          Conductor de coure γ=56 m/(Ω·mm²), alumini γ=35. Fórmula monofàsica: ΔU%=200000×P×L/(γ×S×U²). Trifàsica: ΔU%=100000×P×L/(γ×S×U²).
          Límit caiguda total: ≤3% il·luminació, ≤5% altres usos (ITC-BT-19). Files en vermell superen el límit del 5%.
        </Text>

        <View style={s.footer}>
          <Text style={{ fontSize: 8 }}>{instalador.nombre_completo} · RASIC {instalador.numero_carnet}</Text>
          <Text style={{ fontSize: 8 }}>REBT RD 842/2002 · ITC-BT-19</Text>
        </View>
      </Page>
    </Document>
  )
}
