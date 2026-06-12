import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { MemoriaDescriptiva } from '../../lib/supabase-memoria-descriptiva'
import type { Instalador } from '../../types'
import { LABELS_TIPO_INSTALADOR } from '../../types'
import { formatDate } from '../../lib/supabase'

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 30, paddingHorizontal: 35, fontFamily: 'Helvetica', fontSize: 11, color: '#000', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 10, marginBottom: 18 },
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  subtitle: { fontSize: 10, color: '#444', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 4, marginBottom: 8, marginTop: 14 },
  body: { fontSize: 11, textAlign: 'justify', lineHeight: 1.6 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#ccc', borderTopStyle: 'solid', paddingTop: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerLeft: { flex: 1 },
  footerRight: { width: 180 },
  label: { fontSize: 9, color: '#555', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 },
  signBox: { borderWidth: 1, borderColor: '#000', borderStyle: 'solid', height: 70, width: 160, marginTop: 4 },
  sigImg: { height: 60, objectFit: 'contain', marginTop: 4 },
  logo: { maxHeight: 45, maxWidth: 130, objectFit: 'contain' },
})

interface Props { doc: MemoriaDescriptiva; instalador: Instalador }

const SECCIONS = [
  { key: 'seccio_immoble' as const, title: "Descripció de l'immoble" },
  { key: 'seccio_escomesa' as const, title: "Escomesa i derivació individual" },
  { key: 'seccio_quadre' as const, title: "Quadre de distribució" },
  { key: 'seccio_treballs' as const, title: "Treballs realitzats" },
  { key: 'seccio_justificacio' as const, title: "Justificació tècnica" },
]

export function MemoriaDescriptivaPDF({ doc, instalador }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            {instalador.empresa_logo_url && (
              <Image src={instalador.empresa_logo_url} style={s.logo} />
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.title}>Memòria Descriptiva</Text>
            <Text style={s.subtitle}>Instal·lació elèctrica · {doc.nom || '—'}</Text>
            <Text style={s.subtitle}>{formatDate(doc.data_signatura)}</Text>
          </View>
        </View>

        {SECCIONS.map(({ key, title }, i) => (
          doc[key] ? (
            <View key={key}>
              <Text style={s.sectionTitle} minPresenceAhead={60}>{i + 1}. {title}</Text>
              <Text style={s.body}>{doc[key]}</Text>
            </View>
          ) : null
        ))}

        <View style={s.footer} wrap={false}>
          <View style={s.footerRow}>
            <View style={s.footerLeft}>
              <Text style={s.label}>Redactor</Text>
              <Text style={{ fontSize: 11 }}>{instalador.nombre_completo}</Text>
              {instalador.empresa_nombre && <Text style={{ fontSize: 10, color: '#555' }}>{instalador.empresa_nombre}</Text>}
              <Text style={{ fontSize: 10, color: '#555' }}>
                {LABELS_TIPO_INSTALADOR[instalador.tipo]} · Núm. {instalador.numero_carnet}
              </Text>
              <Text style={{ fontSize: 10, marginTop: 6 }}>
                {doc.lloc_signatura}, a {formatDate(doc.data_signatura)}
              </Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.label}>Signatura</Text>
              {instalador.firma_url
                ? <Image src={instalador.firma_url} style={s.sigImg} />
                : <View style={s.signBox} />}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
