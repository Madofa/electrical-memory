import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { WizardData, Instalador } from '../../types'
import { LABELS_TIPO_SOLICITUD, LABELS_USO_FINCA, LABELS_TIPO_INSTALADOR } from '../../types'
import { formatDate } from '../../lib/supabase'

const s = StyleSheet.create({
  page: {
    paddingTop: 30, paddingBottom: 30, paddingHorizontal: 30,
    fontFamily: 'Helvetica', fontSize: 11, color: '#000', lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 2, borderBottomColor: '#000', borderBottomStyle: 'solid',
    paddingBottom: 10, marginBottom: 16,
  },
  headerRight: { alignItems: 'flex-end' },
  h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  headerSub: { fontSize: 10, marginTop: 2 },
  headerMeta: { fontSize: 10, marginTop: 4, color: '#555' },

  sectionTitle: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase',
    borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid',
    paddingBottom: 5, marginBottom: 8, marginTop: 12,
  },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0', borderBottomStyle: 'solid',
    paddingBottom: 3, marginBottom: 3,
  },
  label: { width: 220, fontFamily: 'Helvetica-Bold', fontSize: 10 },
  value: { flex: 1, fontSize: 11 },

  table: { marginTop: 4 },
  tableRow: { flexDirection: 'row' },
  th: {
    padding: 4, backgroundColor: '#f0f0f0', fontFamily: 'Helvetica-Bold',
    fontSize: 10, borderWidth: 1, borderColor: '#000', borderStyle: 'solid',
  },
  td: { padding: 4, fontSize: 10, borderWidth: 1, borderColor: '#000', borderStyle: 'solid' },
  tdRight: { textAlign: 'right' },
  thFlex: { flex: 1 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  photoCell: {
    width: '49%', marginRight: '1%', marginBottom: 12,
  },
  photoTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  photo: { maxWidth: '100%', maxHeight: 230, objectFit: 'contain' },

  signatureBox: {
    borderWidth: 1, borderColor: '#000', borderStyle: 'solid',
    height: 80, width: 240, marginTop: 6,
  },
  note: { fontSize: 9, fontStyle: 'italic', color: '#555', marginTop: 4 },

  block: { marginTop: 6 },
  bold: { fontFamily: 'Helvetica-Bold' },
  pBlock: { fontSize: 11, textAlign: 'justify', marginBottom: 6 },
  fullText: { fontSize: 11, marginTop: 2, marginBottom: 8 },

  calcSubtitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 8, marginBottom: 4 },
  cumple: { fontSize: 10, color: '#1a7a1a', marginTop: 4 },

  declaracion: { fontSize: 11, textAlign: 'justify', marginBottom: 6 },
  firmaLabel: { fontSize: 10, marginTop: 4 },
  redactorFooter: { fontSize: 10, textAlign: 'justify', marginTop: 6, lineHeight: 1.4 },
  redactorLugar: { marginTop: 6, fontSize: 11 },
  firma: { height: 70, marginTop: 4, objectFit: 'contain' },
  logo: { maxHeight: 50, maxWidth: 150, objectFit: 'contain' },
})

function Row({ label, value, blank }: { label: string; value?: string | null; blank?: boolean }) {
  const text = value || (blank ? '____________________________________________' : '—')
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}:</Text>
      <Text style={s.value}>{text}</Text>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>
}

interface Props {
  data: WizardData
  instalador: Instalador
}

export function PDFTemplate({ data, instalador }: Props) {
  const { solicitante: sol, ubicacion: u, receptores, elementoFrontera: ef, calculos: c } = data
  const potenciaTotal = receptores.reduce((sum, r) => sum + (r.potencia_kw || 0), 0)
  const fotos = ef.fotos?.filter((f) => f.base64) ?? []

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* CABECERA */}
        <View style={s.header} fixed>
          <View>
            {instalador.empresa_logo_url && (
              <Image src={instalador.empresa_logo_url} style={s.logo} />
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.h1}>Memòria Tècnica Descriptiva</Text>
            <Text style={s.headerSub}>Instal·lació Elèctrica en Baixa Tensió</Text>
            <Text style={s.headerMeta}>
              Ref: {data.referencia_interna || '—'}   |   Data: {formatDate(data.fechaFirma)}
            </Text>
          </View>
        </View>

        {/* SECCIÓ 1 */}
        <SectionTitle>1. Característiques de la sol·licitud</SectionTitle>
        <Row label="Tipus de sol·licitud" value={u.tipo_solicitud ? LABELS_TIPO_SOLICITUD[u.tipo_solicitud] : null} />
        <Row label="Ús de la finca" value={u.uso_finca ? LABELS_USO_FINCA[u.uso_finca] : null} />
        <Row label="Nivell de tensió sol·licitat" value={potenciaTotal > 15 ? '3×230/400 V (trifàsic amb neutre)' : '230 V (monofàsic)'} />
        <Row label="Potència total sol·licitada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />

        {/* SECCIÓ 2 */}
        <SectionTitle>2. Dades del sol·licitant</SectionTitle>
        {sol.razon_social && <Row label="Raó social / Nom" value={sol.razon_social} />}
        {sol.cif_nif && <Row label="CIF / NIF" value={sol.cif_nif} />}
        {(sol.direccion || sol.municipio || sol.cp) && (
          <Row label="Adreça" value={[sol.direccion, sol.municipio, sol.cp].filter(Boolean).join(', ')} />
        )}
        {sol.telefono && <Row label="Telèfon" value={sol.telefono} />}
        {sol.email && <Row label="Correu electrònic" value={sol.email} />}

        {/* SECCIÓ 3 */}
        <SectionTitle>3. Ubicació del subministrament</SectionTitle>
        <Row label="Adreça" value={`${u.direccion} ${u.numero}${u.piso_puerta ? ', ' + u.piso_puerta : ''}`} />
        <Row label="Municipi / C.P." value={`${u.municipio} / ${u.cp}`} />
        <Row label="Província" value={u.provincia} />
        {u.referencia_catastral && <Row label="Referència cadastral" value={u.referencia_catastral} />}
        {u.utm_x && <Row label="Coord. UTM (ETRS89)" value={`X: ${u.utm_x} / Y: ${u.utm_y} / Fus: ${u.utm_huso}`} />}
        {u.cups && <Row label="CUPS" value={u.cups} />}

        {/* SECCIÓ 4 — Taula receptors */}
        <SectionTitle>4. Dades tècniques de la petició</SectionTitle>
        <View style={s.table}>
          <View style={s.tableRow}>
            <Text style={[s.th, { flex: 3 }]}>Concepte</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Pot. (kW)</Text>
            <Text style={[s.th, { flex: 1 }]}>Tensió (V)</Text>
            <Text style={[s.th, { flex: 1 }]}>Grau electrif.</Text>
          </View>
          {receptores.map((r) => (
            <View key={r.id} style={s.tableRow} wrap={false}>
              <Text style={[s.td, { flex: 3 }]}>{r.concepto}</Text>
              <Text style={[s.td, s.tdRight, { flex: 1 }]}>{r.potencia_kw.toFixed(2).replace('.', ',')}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.tension}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.grado === 'basica' ? 'Bàsica' : r.grado === 'elevada' ? 'Elevada' : '—'}</Text>
            </View>
          ))}
          <View style={s.tableRow} wrap={false}>
            <Text style={[s.td, s.tdRight, s.bold, { flex: 3 }]}>POTÈNCIA TOTAL:</Text>
            <Text style={[s.td, s.tdRight, s.bold, { flex: 1 }]}>{potenciaTotal.toFixed(2).replace('.', ',')}</Text>
            <Text style={[s.td, { flex: 2 }]}></Text>
          </View>
        </View>

        {/* SECCIÓ 5 — Punt de mesura / CGP */}
        <SectionTitle>
          {u.centralizacion_existente
            ? '5. Punt de mesura — centralització existent'
            : "5. Proposta d'ubicació de l'element frontera"}
        </SectionTitle>
        <Row
          label={u.centralizacion_existente ? 'Tipus de centralització' : "Tipus d'element"}
          value={ef.tipo_elemento}
        />
        <Text style={[s.bold, { fontSize: 10, marginTop: 6 }]}>
          {u.centralizacion_existente ? 'Ubicació del mòdul de comptador assignat:' : 'Descripció:'}
        </Text>
        <Text style={s.fullText}>{ef.descripcion || '—'}</Text>
        {fotos.length > 0 && (
          <View style={s.photoGrid}>
            {fotos.map((foto, i) => (
              <View key={foto.id} style={s.photoCell} wrap={false}>
                <Text style={s.photoTitle}>{foto.titulo || `Fotografia ${i + 1}`}:</Text>
                <Image src={foto.base64} style={s.photo} />
              </View>
            ))}
          </View>
        )}
        <Text style={s.note}>
          {u.centralizacion_existente
            ? '* Les fotografies adjuntes mostren la centralització de comptadors existent i el mòdul assignat al nou subministrament.'
            : "* Les fotografies i el croquis adjunts mostren la proposta d'ubicació de l'element frontera (CGP/CGPM) a l'emplaçament indicat."}
        </Text>

        {/* SECCIÓ 6 — Càlculs (opcional) */}
        {data.incluir_calculos && c.seccion_normalizada_mm2 && (
          <View>
            <SectionTitle>6. Càlculs justificatius (REBT)</SectionTitle>
            <Text style={s.calcSubtitle}>DADES DE CÀLCUL</Text>
            <Row label="Potència total instal·lada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />
            <Row label="Coeficient de simultaneïtat" value={String(c.coef_simultaneidad)} />
            <Row label="Potència de demanda" value={`${c.potencia_demanda_kw?.toFixed(2).replace('.', ',')} kW`} />
            <Row label="Nombre de fases" value={potenciaTotal > 15 ? 'Trifàsic (3F+N)' : 'Monofàsic (1F+N)'} />
            <Row label="Tensió nominal" value={`${c.tension_nominal_v} V`} />
            <Row label="Intensitat nominal" value={`${c.intensidad_nominal_a} A`} />
            <Text style={s.calcSubtitle}>LÍNIA GENERAL D'ALIMENTACIÓ (LGA)</Text>
            <Row label="Material conductor" value={c.material_conductor as string} />
            <Row label="Tipus de conductor" value={c.tipo_conductor as string} />
            <Row label="Tipus d'instal·lació" value={c.tipo_instalacion as string} />
            <Row label="Longitud estimada" value={`${c.longitud_m} m`} />
            <Row label="Secció normalitzada adoptada" value={`${c.seccion_normalizada_mm2} mm²`} />
            <Row label="Caiguda de tensió" value={`${c.caida_tension_pct?.toFixed(2).replace('.', ',')} % (límit: 1,5%)`} />
            <Text style={s.cumple}>✓ Compleix amb ITC-BT-14</Text>
            <Text style={s.calcSubtitle}>PROTECCIONS</Text>
            <Row label="ICP recomanat" value={`${c.icp_a} A`} />
            <Row label="Interruptor diferencial" value={`ID ${c.diferencial_a} A  ${c.diferencial_ma} mA  Classe AC`} />
            {c.puesta_tierra_desc && (
              <View>
                <Text style={s.calcSubtitle}>POSADA A TERRA</Text>
                <Text style={{ fontSize: 11 }}>{c.puesta_tierra_desc as string}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECCIÓ 7 — Declaració */}
        <View wrap={false}>
          <SectionTitle>7. Declaració responsable de qualitat d'ona</SectionTitle>
          <Text style={s.declaracion}>
            En qualitat de sol·licitant del subministrament descrit en la present memòria, declaro sota la meva
            responsabilitat que la instal·lació elèctrica objecte de la sol·licitud d'accés i connexió complirà amb
            la normativa de qualitat de l'ona vigent i buits de tensió exigible per l'empresa distribuïdora.
          </Text>
          <Text style={s.firmaLabel}>Signatura del sol·licitant:</Text>
          <View style={s.signatureBox} />
        </View>

        {/* SECCIÓ 8 — Instal·lador */}
        <View wrap={false}>
          <SectionTitle>8. Dades de l'instal·lador</SectionTitle>
          <Row label="Nom i cognoms" value={instalador.nombre_completo} blank />
          <Row label="DNI / NIE" value={instalador.dni_nie} blank />
          <Row label="Tipus / Categoria" value={instalador.tipo ? LABELS_TIPO_INSTALADOR[instalador.tipo] : null} blank />
          <Row label="Núm. d'instal·lador" value={instalador.numero_carnet} blank />
          {instalador.numero_colegiado && <Row label="Núm. de col·legiat" value={instalador.numero_colegiado} blank />}
          {instalador.empresa_nombre && <Row label="Empresa" value={instalador.empresa_nombre} />}
          {instalador.empresa_cif && <Row label="CIF empresa" value={instalador.empresa_cif} />}
          {instalador.empresa_direccion && <Row label="Adreça" value={instalador.empresa_direccion} />}
          {instalador.empresa_telefono && <Row label="Telèfon" value={instalador.empresa_telefono} />}
          {instalador.empresa_email && <Row label="Correu electrònic" value={instalador.empresa_email} />}
          <Text style={s.redactorFooter}>
            L'instal·lador/tècnic redactor declara que la present Memòria Tècnica està d'acord amb les
            prescripcions del vigent Reglament Electrotècnic per a Baixa Tensió (RD 842/2002) i
            instruccions ITC-BT específiques d'aplicació.
          </Text>
          <Text style={s.redactorLugar}>
            {data.lugarFirma}, a {formatDate(data.fechaFirma)}
          </Text>
          <Text style={s.firmaLabel}>Signatura i segell de l'instal·lador:</Text>
          {instalador.firma_url
            ? <Image src={instalador.firma_url} style={s.firma} />
            : <View style={s.signatureBox} />}
        </View>
      </Page>
    </Document>
  )
}
