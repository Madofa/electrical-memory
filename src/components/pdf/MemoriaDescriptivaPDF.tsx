import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { MemoriaDescriptiva } from '../../lib/supabase-memoria-descriptiva'
import type { Instalador } from '../../types'
import type { Projecte } from '../../lib/supabase-projectes'
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
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 8, color: '#777', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 1 },
  infoVal: { fontSize: 10 },
})

interface Props { doc: MemoriaDescriptiva; instalador: Instalador; projecte?: Projecte | null }

const SECCIONS = [
  { key: 'seccio_immoble' as const, title: "Descripció de l'immoble" },
  { key: 'seccio_escomesa' as const, title: "Escomesa i derivació individual" },
  { key: 'seccio_quadre' as const, title: "Quadre de distribució" },
  { key: 'seccio_treballs' as const, title: "Treballs realitzats" },
  { key: 'seccio_justificacio' as const, title: "Justificació tècnica" },
]

function instAdresa(p: Projecte): string {
  const parts = [
    [p.inst_tipus_via, p.inst_nom_via, p.inst_numero].filter(Boolean).join(' '),
    [p.inst_bloc && `Bl. ${p.inst_bloc}`, p.inst_escala && `Esc. ${p.inst_escala}`, p.inst_pis, p.inst_porta].filter(Boolean).join(' '),
    [p.inst_cp, p.inst_poblacio].filter(Boolean).join(' '),
  ].filter(Boolean)
  return parts.join(', ')
}

export function MemoriaDescriptivaPDF({ doc, instalador, projecte }: Props) {
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

        {/* Dades del titular i de la instal·lació (del projecte) */}
        {projecte && (projecte.titular_nom || projecte.titular_nif || projecte.titular_correu || projecte.inst_nom_via) && (
          <View style={{ marginBottom: 6 }}>
            <Text style={s.sectionTitle}>Dades de la instal·lació</Text>
            <View style={s.infoGrid}>
              {projecte.titular_nom ? (
                <View style={s.infoCol}>
                  <Text style={s.infoLabel}>Titular</Text>
                  <Text style={s.infoVal}>{projecte.titular_nom}</Text>
                </View>
              ) : null}
              {projecte.titular_nif ? (
                <View style={s.infoCol}>
                  <Text style={s.infoLabel}>NIF / DNI</Text>
                  <Text style={s.infoVal}>{projecte.titular_nif}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.infoGrid}>
              {projecte.titular_telefon ? (
                <View style={s.infoCol}>
                  <Text style={s.infoLabel}>Telèfon</Text>
                  <Text style={s.infoVal}>{projecte.titular_telefon}</Text>
                </View>
              ) : null}
              {projecte.titular_correu ? (
                <View style={s.infoCol}>
                  <Text style={s.infoLabel}>Correu electrònic</Text>
                  <Text style={s.infoVal}>{projecte.titular_correu}</Text>
                </View>
              ) : null}
            </View>
            {instAdresa(projecte) ? (
              <View style={{ marginTop: 2 }}>
                <Text style={s.infoLabel}>Adreça de la instal·lació</Text>
                <Text style={s.infoVal}>{instAdresa(projecte)}</Text>
              </View>
            ) : null}
            {projecte.cups ? (
              <View style={{ marginTop: 4 }}>
                <Text style={s.infoLabel}>CUPS</Text>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica' }}>{projecte.cups}</Text>
              </View>
            ) : null}
          </View>
        )}

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
              <Text style={s.label}>Instal·lador</Text>
              <Text style={{ fontSize: 11 }}>{instalador.nombre_completo}</Text>
              {instalador.empresa_nombre && <Text style={{ fontSize: 10, color: '#555' }}>{instalador.empresa_nombre}</Text>}
              <Text style={{ fontSize: 10, color: '#555' }}>
                {LABELS_TIPO_INSTALADOR[instalador.tipo]} · Núm. {instalador.numero_carnet}
              </Text>
              {instalador.numero_colegiado && <Text style={{ fontSize: 10, color: '#555' }}>Núm. col·legiat: {instalador.numero_colegiado}</Text>}
              {instalador.empresa_cif && <Text style={{ fontSize: 10, color: '#555' }}>CIF: {instalador.empresa_cif}</Text>}
              {instalador.empresa_direccion && <Text style={{ fontSize: 10, color: '#555' }}>{instalador.empresa_direccion}</Text>}
              {(instalador.empresa_telefono || instalador.empresa_email) && (
                <Text style={{ fontSize: 10, color: '#555' }}>
                  {[instalador.empresa_telefono, instalador.empresa_email].filter(Boolean).join(' · ')}
                </Text>
              )}
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
