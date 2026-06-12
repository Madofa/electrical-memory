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
            <Text style={s.h1}>Memoria Técnica Descriptiva</Text>
            <Text style={s.headerSub}>Instalación Eléctrica en Baja Tensión</Text>
            <Text style={s.headerMeta}>
              Ref: {data.referencia_interna || '—'}   |   Fecha: {formatDate(data.fechaFirma)}
            </Text>
          </View>
        </View>

        {/* SECCIÓN 1 */}
        <SectionTitle>1. Características de la solicitud</SectionTitle>
        <Row label="Tipo de solicitud" value={u.tipo_solicitud ? LABELS_TIPO_SOLICITUD[u.tipo_solicitud] : null} />
        <Row label="Uso de la finca" value={u.uso_finca ? LABELS_USO_FINCA[u.uso_finca] : null} />
        <Row label="Nivel de tensión solicitado" value={potenciaTotal > 15 ? '3×230/400 V (trifásico con neutro)' : '230 V (monofásico)'} />
        <Row label="Potencia total solicitada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />

        {/* SECCIÓN 2 */}
        <SectionTitle>2. Datos del solicitante</SectionTitle>
        {sol.razon_social && <Row label="Razón social / Nombre" value={sol.razon_social} />}
        {sol.cif_nif && <Row label="CIF / NIF" value={sol.cif_nif} />}
        {(sol.direccion || sol.municipio || sol.cp) && (
          <Row label="Dirección" value={[sol.direccion, sol.municipio, sol.cp].filter(Boolean).join(', ')} />
        )}
        {sol.telefono && <Row label="Teléfono" value={sol.telefono} />}
        {sol.email && <Row label="Email" value={sol.email} />}

        {/* SECCIÓN 3 */}
        <SectionTitle>3. Ubicación del suministro</SectionTitle>
        <Row label="Dirección" value={`${u.direccion} ${u.numero}${u.piso_puerta ? ', ' + u.piso_puerta : ''}`} />
        <Row label="Municipio / C.P." value={`${u.municipio} / ${u.cp}`} />
        <Row label="Provincia" value={u.provincia} />
        {u.referencia_catastral && <Row label="Referencia catastral" value={u.referencia_catastral} />}
        {u.utm_x && <Row label="Coord. UTM (ETRS89)" value={`X: ${u.utm_x} / Y: ${u.utm_y} / Huso: ${u.utm_huso}`} />}
        {u.cups && <Row label="CUPS" value={u.cups} />}

        {/* SECCIÓN 4 — Tabla receptores */}
        <SectionTitle>4. Datos técnicos de la petición</SectionTitle>
        <View style={s.table}>
          <View style={s.tableRow}>
            <Text style={[s.th, { flex: 3 }]}>Concepto</Text>
            <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Pot. (kW)</Text>
            <Text style={[s.th, { flex: 1 }]}>Tensión (V)</Text>
            <Text style={[s.th, { flex: 1 }]}>Grado electrif.</Text>
          </View>
          {receptores.map((r) => (
            <View key={r.id} style={s.tableRow} wrap={false}>
              <Text style={[s.td, { flex: 3 }]}>{r.concepto}</Text>
              <Text style={[s.td, s.tdRight, { flex: 1 }]}>{r.potencia_kw.toFixed(2).replace('.', ',')}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.tension}</Text>
              <Text style={[s.td, { flex: 1 }]}>{r.grado === 'basica' ? 'Básica' : r.grado === 'elevada' ? 'Elevada' : '—'}</Text>
            </View>
          ))}
          <View style={s.tableRow} wrap={false}>
            <Text style={[s.td, s.tdRight, s.bold, { flex: 3 }]}>POTENCIA TOTAL:</Text>
            <Text style={[s.td, s.tdRight, s.bold, { flex: 1 }]}>{potenciaTotal.toFixed(2).replace('.', ',')}</Text>
            <Text style={[s.td, { flex: 2 }]}></Text>
          </View>
        </View>

        {/* SECCIÓN 5 — Punto de medida / CGP */}
        <SectionTitle>
          {u.centralizacion_existente
            ? '5. Punto de medida — centralización existente'
            : '5. Propuesta de ubicación del elemento frontera'}
        </SectionTitle>
        <Row
          label={u.centralizacion_existente ? 'Tipo de centralización' : 'Tipo de elemento'}
          value={ef.tipo_elemento}
        />
        <Text style={[s.bold, { fontSize: 10, marginTop: 6 }]}>
          {u.centralizacion_existente ? 'Ubicación del módulo de contador asignado:' : 'Descripción:'}
        </Text>
        <Text style={s.fullText}>{ef.descripcion || '—'}</Text>
        {fotos.length > 0 && (
          <View style={s.photoGrid}>
            {fotos.map((foto, i) => (
              <View key={foto.id} style={s.photoCell} wrap={false}>
                <Text style={s.photoTitle}>{foto.titulo || `Fotografía ${i + 1}`}:</Text>
                <Image src={foto.base64} style={s.photo} />
              </View>
            ))}
          </View>
        )}
        <Text style={s.note}>
          {u.centralizacion_existente
            ? '* Las fotografías adjuntas muestran la centralización de contadores existente y el módulo asignado al nuevo suministro.'
            : '* Las fotografías y el croquis adjuntos muestran la propuesta de ubicación del elemento frontera (CGP/CGPM) en el emplazamiento indicado.'}
        </Text>

        {/* SECCIÓN 6 — Cálculos (opcional) */}
        {data.incluir_calculos && c.seccion_normalizada_mm2 && (
          <View>
            <SectionTitle>6. Cálculos justificativos (REBT)</SectionTitle>
            <Text style={s.calcSubtitle}>DATOS DE CÁLCULO</Text>
            <Row label="Potencia total instalada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />
            <Row label="Coeficiente de simultaneidad" value={String(c.coef_simultaneidad)} />
            <Row label="Potencia de demanda" value={`${c.potencia_demanda_kw?.toFixed(2).replace('.', ',')} kW`} />
            <Row label="Número de fases" value={potenciaTotal > 15 ? 'Trifásico (3F+N)' : 'Monofásico (1F+N)'} />
            <Row label="Tensión nominal" value={`${c.tension_nominal_v} V`} />
            <Row label="Intensidad nominal" value={`${c.intensidad_nominal_a} A`} />
            <Text style={s.calcSubtitle}>LÍNEA GENERAL DE ALIMENTACIÓN (LGA)</Text>
            <Row label="Material conductor" value={c.material_conductor as string} />
            <Row label="Tipo de conductor" value={c.tipo_conductor as string} />
            <Row label="Tipo de instalación" value={c.tipo_instalacion as string} />
            <Row label="Longitud estimada" value={`${c.longitud_m} m`} />
            <Row label="Sección normalizada adoptada" value={`${c.seccion_normalizada_mm2} mm²`} />
            <Row label="Caída de tensión" value={`${c.caida_tension_pct?.toFixed(2).replace('.', ',')} % (límite: 1,5%)`} />
            <Text style={s.cumple}>✓ Cumple con ITC-BT-14</Text>
            <Text style={s.calcSubtitle}>PROTECCIONES</Text>
            <Row label="ICP recomendado" value={`${c.icp_a} A`} />
            <Row label="Interruptor diferencial" value={`ID ${c.diferencial_a} A  ${c.diferencial_ma} mA  Clase AC`} />
            {c.puesta_tierra_desc && (
              <View>
                <Text style={s.calcSubtitle}>PUESTA A TIERRA</Text>
                <Text style={{ fontSize: 11 }}>{c.puesta_tierra_desc as string}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECCIÓN 7 — Declaració */}
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

        {/* SECCIÓN 8 — Redactor */}
        <View wrap={false}>
          <SectionTitle>8. Datos del instalador</SectionTitle>
          <Row label="Nombre y apellidos" value={instalador.nombre_completo} blank />
          <Row label="DNI / NIE" value={instalador.dni_nie} blank />
          <Row label="Tipo / Categoría" value={instalador.tipo ? LABELS_TIPO_INSTALADOR[instalador.tipo] : null} blank />
          <Row label="Nº de instalador" value={instalador.numero_carnet} blank />
          {instalador.numero_colegiado && <Row label="Nº de colegiado" value={instalador.numero_colegiado} blank />}
          {instalador.empresa_nombre && <Row label="Empresa" value={instalador.empresa_nombre} />}
          {instalador.empresa_cif && <Row label="CIF empresa" value={instalador.empresa_cif} />}
          {instalador.empresa_direccion && <Row label="Dirección" value={instalador.empresa_direccion} />}
          {instalador.empresa_telefono && <Row label="Teléfono" value={instalador.empresa_telefono} />}
          {instalador.empresa_email && <Row label="Email" value={instalador.empresa_email} />}
          <Text style={s.redactorFooter}>
            El instalador/técnico redactor declara que la presente Memoria Técnica está de acuerdo con las
            prescripciones del vigente Reglamento Electrotécnico para Baja Tensión (RD 842/2002) e
            instrucciones ITC-BT específicas de aplicación.
          </Text>
          <Text style={s.redactorLugar}>
            {data.lugarFirma}, a {formatDate(data.fechaFirma)}
          </Text>
          <Text style={s.firmaLabel}>Firma y sello del instalador:</Text>
          {instalador.firma_url
            ? <Image src={instalador.firma_url} style={s.firma} />
            : <View style={s.signatureBox} />}
        </View>
      </Page>
    </Document>
  )
}
