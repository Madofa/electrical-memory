import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { CertificatElec1 } from '../../lib/supabase-elec1'
import type { Instalador } from '../../types'
import { formatDate } from '../../lib/supabase'

// Replica the visual layout of the official ELEC-1 form (Generalitat de Catalunya, Abril 2024)

const BORDER = '#000'
const BG_HEADER = '#d8d8d8'

const s = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8.5, color: '#000', lineHeight: 1.3 },
  title: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 6, textTransform: 'uppercase' },
  sectionHeader: { backgroundColor: BG_HEADER, borderWidth: 1, borderColor: BORDER, borderStyle: 'solid', padding: '3 5', fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  row: { flexDirection: 'row', borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: BORDER, borderStyle: 'solid' },
  cell: { padding: '2 4', flex: 1 },
  cellLabel: { fontSize: 7, color: '#444' },
  cellValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  cellBorder: { borderRightWidth: 1, borderColor: BORDER, borderStyle: 'solid' },
  block: { marginTop: 5 },
  certText: { fontSize: 8, textAlign: 'justify', marginTop: 4, lineHeight: 1.5 },
  signArea: { flexDirection: 'row', marginTop: 6, gap: 10 },
  signBox: { flex: 1, borderWidth: 1, borderColor: BORDER, borderStyle: 'solid', height: 70, alignItems: 'center', justifyContent: 'center' },
  signImg: { height: 60, objectFit: 'contain' },
  logo: { maxHeight: 30, maxWidth: 80, objectFit: 'contain' },
  footnote: { fontSize: 7, color: '#555', marginTop: 4 },
})

function Cell({ label, value, flex = 1, borderRight = true }: { label: string; value?: string | number; flex?: number; borderRight?: boolean }) {
  return (
    <View style={[s.cell, borderRight ? s.cellBorder : {}, { flex }]}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value || ' '}</Text>
    </View>
  )
}

const TIPUS_ACTUACIO = { nova: 'Nova', ampliacio: 'Ampliació', modificacio: 'Modificació o reforma' }
const CLASSIFICACIO = { p1: 'Classe P1', p2: 'Classe P2', mtd: 'Memòria tècnica de disseny' }

interface Props { cert: CertificatElec1; instalador: Instalador }

export function CertificatElec1PDF({ cert, instalador }: Props) {
  const rasic = instalador.numero_carnet || ''
  const nomEmpresa = instalador.empresa_nombre || instalador.nombre_completo
  const cifEmpresa = instalador.empresa_cif || instalador.dni_nie
  const adrEmpresa = instalador.empresa_direccion || ''

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Certificat d'instal·lació elèctrica de baixa tensió (model ELEC-1)</Text>

        {/* Titular */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Titular de la instal·lació</Text>
          <View style={s.row}>
            <Cell label="Raó social de l'empresa o nom i cognoms" value={cert.titular_nom} flex={3} />
            <Cell label="NIF/DNI" value={cert.titular_nif} flex={1} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Tipus de via" value={cert.titular_tipus_via} flex={1} />
            <Cell label="Nom de la via" value={cert.titular_nom_via} flex={3} />
            <Cell label="Núm." value={cert.titular_numero} />
            <Cell label="Bloc" value={cert.titular_bloc} />
            <Cell label="Escala" value={cert.titular_escala} />
            <Cell label="Pis" value={cert.titular_pis} />
            <Cell label="Porta" value={cert.titular_porta} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Codi postal" value={cert.titular_cp} />
            <Cell label="Població" value={cert.titular_poblacio} flex={2} />
            <Cell label="Telèfon" value={cert.titular_telefon} flex={1.5} />
            <Cell label="Correu electrònic" value={cert.titular_correu} flex={2} borderRight={false} />
          </View>
        </View>

        {/* Empresa instal·ladora */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Empresa instal·ladora</Text>
          <View style={s.row}>
            <Cell label="Raó social / nom i cognoms (persones autònomes)" value={nomEmpresa} flex={3} />
            <Cell label="Núm. de registre (RASIC)" value={rasic} flex={1.5} />
            <Cell label="NIF/DNI" value={cifEmpresa} flex={1} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Nom i cognoms de la persona instal·ladora" value={instalador.nombre_completo} flex={3} />
            <Cell label="Categoria" value={instalador.tipo === 'IBTE' ? 'Bàsica' : instalador.tipo === 'IBTM' ? 'Mitja' : instalador.tipo} />
            <Cell label="DNI/NIE" value={instalador.dni_nie} flex={1} borderRight={false} />
          </View>
          {adrEmpresa ? (
            <View style={s.row}>
              <Cell label="Adreça de l'empresa" value={adrEmpresa} flex={3} />
              <Cell label="Telèfon" value={instalador.empresa_telefono || ''} />
              <Cell label="Correu" value={instalador.empresa_email || ''} flex={2} borderRight={false} />
            </View>
          ) : null}
        </View>

        {/* Instal·lació */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Instal·lació</Text>
          <View style={s.row}>
            <Cell label="Tipus de via" value={cert.inst_tipus_via} />
            <Cell label="Nom de la via" value={cert.inst_nom_via} flex={3} />
            <Cell label="Núm." value={cert.inst_numero} />
            <Cell label="Bloc" value={cert.inst_bloc} />
            <Cell label="Escala" value={cert.inst_escala} />
            <Cell label="Pis" value={cert.inst_pis} />
            <Cell label="Porta" value={cert.inst_porta} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Codi postal" value={cert.inst_cp} />
            <Cell label="Població" value={cert.inst_poblacio} flex={3} borderRight={false} />
          </View>
        </View>

        {/* Característiques */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Característiques de la instal·lació</Text>
          <View style={s.row}>
            <Cell label="Tipus d'actuació" value={TIPUS_ACTUACIO[cert.tipus_actuacio]} flex={2} />
            <Cell label="CUPS" value={cert.cups} flex={2} />
            <Cell label="Classificació" value={CLASSIFICACIO[cert.classificacio]} flex={2} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Ús de la instal·lació" value={cert.us_installacio} flex={1} borderRight={false} />
          </View>
        </View>

        {/* Dades tècniques */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Dades tècniques</Text>
          <View style={s.row}>
            <Cell label="Potència màxima admissible" value={cert.potencia_kw ? `${cert.potencia_kw} kW` : ''} />
            <Cell label="Tensió" value={cert.tensio_v ? `${cert.tensio_v} V` : ''} />
            <Cell label="Secció LGA" value={cert.seccio_lga_mm2 ? `${cert.seccio_lga_mm2} mm²` : ''} />
            <Cell label="Nombre de circuits" value={cert.num_circuits || ''} />
            <Cell label="Calibre fusibles CGP" value={cert.calibre_fusibles_cgp_a ? `${cert.calibre_fusibles_cgp_a} A` : ''} />
            <Cell label="Material conductor" value={cert.material_conductor} borderRight={false} />
          </View>
          <View style={s.row}>
            <Cell label="Resist. d'aïllament amb terra (MΩ)" value={cert.resist_aillament_mt || ''} />
            <Cell label="Resist. entre conductors (MΩ)" value={cert.resist_aillament_mt || ''} />
            <Cell label="Resistència a terra (Ω)" value={cert.resist_terra_ohm || ''} />
            <Cell label="Intensitat IGA (A)" value={cert.intensitat_iga_a || ''} borderRight={false} />
          </View>
        </View>

        {/* Certificació */}
        <View style={s.block}>
          <Text style={s.sectionHeader}>Certificació</Text>
          <Text style={s.certText}>
            En/na {instalador.nombre_completo} CERTIFICA que la instal·lació descrita ha estat realitzada d'acord
            amb les prescripcions del Reglament Electrotècnic per a baixa tensió i les seves ITC, aprovat pel
            Reial Decret 842/2002, de 2 d'agost, així com amb la seva documentació tècnica abans esmentada.
          </Text>
          {cert.observacions ? (
            <View style={[s.block, { borderWidth: 1, borderColor: BORDER, borderStyle: 'solid', padding: 4 }]}>
              <Text style={s.cellLabel}>Observacions</Text>
              <Text style={{ fontSize: 8.5 }}>{cert.observacions}</Text>
            </View>
          ) : null}
          <View style={s.signArea}>
            <View style={{ flex: 1, paddingTop: 4 }}>
              <Text style={{ fontSize: 8 }}>Data: {formatDate(cert.data_signatura)}</Text>
            </View>
            <View style={s.signBox}>
              {instalador.firma_url
                ? <Image src={instalador.firma_url} style={s.signImg} />
                : <Text style={{ fontSize: 8, color: '#888' }}>Signatura instal·lador</Text>}
            </View>
          </View>
        </View>

        {/* Peu */}
        <Text style={s.footnote}>
          1. Aquest certificat empara únicament l'actuació efectuada i documentada amb la documentació tècnica que l'acompanya.{'\n'}
          2. No es pot emetre un certificat d'instal·lació si en aquesta hi ha signes evidents de manca de seguretat.{'\n'}
          3. G{rasic} Certificat d'instal·lació elèctrica de baixa tensió (model ELEC-1) Abril 2024
        </Text>
      </Page>
    </Document>
  )
}
