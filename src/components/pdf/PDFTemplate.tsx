import type { WizardData, Instalador } from '../../types'
import { LABELS_TIPO_SOLICITUD, LABELS_USO_FINCA, LABELS_TIPO_INSTALADOR } from '../../types'
import { formatDate } from '../../lib/supabase'

interface Props {
  data: WizardData
  instalador: Instalador
}

const S = {
  page: { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', lineHeight: '1.4', padding: '0' } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '16px' } as React.CSSProperties,
  h1: { fontSize: '14px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' } as React.CSSProperties,
  sectionTitle: { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '8px', marginTop: '16px' } as React.CSSProperties,
  row: { display: 'flex', borderBottom: '1px solid #e0e0e0', paddingBottom: '3px', marginBottom: '3px' } as React.CSSProperties,
  label: { width: '220px', fontWeight: 'bold', flexShrink: 0, fontSize: '10px' } as React.CSSProperties,
  value: { flex: 1, fontSize: '11px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '10px' } as React.CSSProperties,
  th: { border: '1px solid #000', padding: '4px 6px', backgroundColor: '#f0f0f0', fontWeight: 'bold', textAlign: 'left' } as React.CSSProperties,
  td: { border: '1px solid #000', padding: '4px 6px' } as React.CSSProperties,
  tdTotal: { border: '1px solid #000', padding: '4px 6px', fontWeight: 'bold', textAlign: 'right' } as React.CSSProperties,
  note: { fontSize: '9px', fontStyle: 'italic', color: '#555', marginTop: '4px' } as React.CSSProperties,
  signatureBox: { border: '1px solid #000', height: '60px', width: '220px', marginTop: '6px' } as React.CSSProperties,
  photo: { maxWidth: '100%', maxHeight: '320px', height: 'auto', width: 'auto', border: '1px solid #ccc', display: 'block' } as React.CSSProperties,
  photoGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' } as React.CSSProperties,
  photoCell: { width: 'calc(50% - 6px)', boxSizing: 'border-box', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' } as React.CSSProperties,
}

function Row({ label, value, blank }: { label: string; value?: string | null; blank?: boolean }) {
  return (
    <div style={S.row}>
      <div style={S.label}>{label}:</div>
      <div style={S.value}>{value || (blank ? '____________________________________________' : '—')}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={S.sectionTitle}>{children}</div>
}

export function PDFTemplate({ data, instalador }: Props) {
  const { solicitante: s, ubicacion: u, receptores, elementoFrontera: ef, calculos: c } = data
  const potenciaTotal = receptores.reduce((sum, r) => sum + (r.potencia_kw || 0), 0)

  return (
    <div id="pdf-content" style={S.page}>
      {/* CABECERA */}
      <div style={S.header}>
        <div>
          {instalador.empresa_logo_url && (
            <img src={instalador.empresa_logo_url} alt="Logo" style={{ maxHeight: '50px', maxWidth: '150px' }} />
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={S.h1}>Memoria Técnica Descriptiva</div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>Instalación Eléctrica en Baja Tensión</div>
          <div style={{ fontSize: '10px', marginTop: '4px', color: '#555' }}>
            Ref: {data.referencia_interna || '—'}&nbsp;&nbsp;|&nbsp;&nbsp;
            Fecha: {formatDate(data.fechaFirma)}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1 */}
      <SectionTitle>1. Características de la solicitud</SectionTitle>
      <Row label="Tipo de solicitud" value={u.tipo_solicitud ? LABELS_TIPO_SOLICITUD[u.tipo_solicitud] : null} />
      <Row label="Uso de la finca" value={u.uso_finca ? LABELS_USO_FINCA[u.uso_finca] : null} />
      <Row label="Nivel de tensión solicitado" value={potenciaTotal > 15 ? '3×230/400 V (trifásico con neutro)' : '230 V (monofásico)'} />
      <Row label="Potencia total solicitada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />

      {/* SECCIÓN 2 */}
      <SectionTitle>2. Datos del solicitante</SectionTitle>
      {s.razon_social && <Row label="Razón social / Nombre" value={s.razon_social} />}
      {s.cif_nif && <Row label="CIF / NIF" value={s.cif_nif} />}
      {(s.direccion || s.municipio || s.cp) && (
        <Row label="Dirección" value={[s.direccion, s.municipio, s.cp].filter(Boolean).join(', ')} />
      )}
      {s.telefono && <Row label="Teléfono" value={s.telefono} />}
      {s.email && <Row label="Email" value={s.email} />}

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
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Concepto</th>
            <th style={S.th}>Pot. (kW)</th>
            <th style={S.th}>Tensión (V)</th>
            <th style={S.th}>Grado electrif.</th>
          </tr>
        </thead>
        <tbody>
          {receptores.map((r) => (
            <tr key={r.id}>
              <td style={S.td}>{r.concepto}</td>
              <td style={{ ...S.td, textAlign: 'right' }}>{r.potencia_kw.toFixed(2).replace('.', ',')}</td>
              <td style={S.td}>{r.tension}</td>
              <td style={S.td}>{r.grado === 'basica' ? 'Básica' : r.grado === 'elevada' ? 'Elevada' : '—'}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...S.td, fontWeight: 'bold', textAlign: 'right' }}>POTENCIA TOTAL:</td>
            <td style={{ ...S.td, fontWeight: 'bold', textAlign: 'right' }}>{potenciaTotal.toFixed(2).replace('.', ',')}</td>
            <td colSpan={2} style={S.td}></td>
          </tr>
        </tbody>
      </table>

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
      <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>
        {u.centralizacion_existente
          ? 'Ubicación del módulo de contador asignado:'
          : 'Descripción:'}
      </div>
      <div style={{ fontSize: '11px', marginTop: '2px', marginBottom: '8px' }}>
        {ef.descripcion || '—'}
      </div>
      {(() => {
        const fotos = ef.fotos?.filter((f) => f.base64) ?? []
        if (fotos.length === 0) return null
        return (
          <div style={S.photoGrid}>
            {fotos.map((foto, i) => (
              <div key={foto.id} style={S.photoCell}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px', textAlign: 'left' }}>
                  {foto.titulo || `Fotografía ${i + 1}`}:
                </div>
                <img src={foto.base64} style={S.photo} />
              </div>
            ))}
          </div>
        )
      })()}
      <div style={S.note}>
        {u.centralizacion_existente
          ? '* Las fotografías adjuntas muestran la centralización de contadores existente y el módulo asignado al nuevo suministro.'
          : '* Las fotografías y el croquis adjuntos muestran la propuesta de ubicación del elemento frontera (CGP/CGPM) en el emplazamiento indicado.'}
      </div>

      {/* SECCIÓN 6 — Cálculos (opcional) */}
      {data.incluir_calculos && c.seccion_normalizada_mm2 && (
        <>
          <SectionTitle>6. Cálculos justificativos (REBT)</SectionTitle>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>DATOS DE CÁLCULO</div>
          <Row label="Potencia total instalada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />
          <Row label="Coeficiente de simultaneidad" value={String(c.coef_simultaneidad)} />
          <Row label="Potencia de demanda" value={`${c.potencia_demanda_kw?.toFixed(2).replace('.', ',')} kW`} />
          <Row label="Número de fases" value={potenciaTotal > 15 ? 'Trifásico (3F+N)' : 'Monofásico (1F+N)'} />
          <Row label="Tensión nominal" value={`${c.tension_nominal_v} V`} />
          <Row label="Intensidad nominal" value={`${c.intensidad_nominal_a} A`} />
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '8px', marginBottom: '4px' }}>LÍNEA GENERAL DE ALIMENTACIÓN (LGA)</div>
          <Row label="Material conductor" value={c.material_conductor as string} />
          <Row label="Tipo de conductor" value={c.tipo_conductor as string} />
          <Row label="Tipo de instalación" value={c.tipo_instalacion as string} />
          <Row label="Longitud estimada" value={`${c.longitud_m} m`} />
          <Row label="Sección normalizada adoptada" value={`${c.seccion_normalizada_mm2} mm²`} />
          <Row label="Caída de tensión" value={`${c.caida_tension_pct?.toFixed(2).replace('.', ',')} % (límite: 1,5%)`} />
          <div style={{ fontSize: '10px', color: '#1a7a1a', marginTop: '4px' }}>✔ Cumple con ITC-BT-14</div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '8px', marginBottom: '4px' }}>PROTECCIONES</div>
          <Row label="ICP recomendado" value={`${c.icp_a} A`} />
          <Row label="Interruptor diferencial" value={`ID ${c.diferencial_a} A  ${c.diferencial_ma} mA  Clase AC`} />
          {c.puesta_tierra_desc && (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '8px', marginBottom: '4px' }}>PUESTA A TIERRA</div>
              <div style={{ fontSize: '11px' }}>{c.puesta_tierra_desc as string}</div>
            </>
          )}
        </>
      )}

      {/* SECCIÓN 7 — Declaración */}
      <SectionTitle>7. Declaración responsable de calidad de onda</SectionTitle>
      <p style={{ fontSize: '11px', textAlign: 'justify', margin: '0 0 12px' }}>
        En calidad de solicitante del suministro descrito en la presente memoria, declaro bajo mi responsabilidad
        que la instalación eléctrica objeto de la solicitud de acceso y conexión cumplirá con la normativa de
        calidad de la onda vigente y huecos de tensión exigible por la empresa distribuidora.
      </p>
      <div style={{ fontSize: '10px', marginTop: '6px' }}>Firma del solicitante:</div>
      <div style={S.signatureBox} />

      {/* SECCIÓN 8 — Redactor */}
      <SectionTitle>8. Datos del redactor</SectionTitle>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Row label="Nombre y apellidos" value={instalador.nombre_completo} blank />
          <Row label="DNI / NIE" value={instalador.dni_nie} blank />
          <Row label="Tipo / Categoría" value={instalador.tipo ? LABELS_TIPO_INSTALADOR[instalador.tipo] : null} blank />
          <Row label="Nº de instalador" value={instalador.numero_carnet} blank />
          {instalador.numero_colegiado && <Row label="Nº de colegiado" value={instalador.numero_colegiado} blank />}
          <Row label="Empresa" value={instalador.empresa_nombre} blank />
          {instalador.empresa_cif && <Row label="CIF empresa" value={instalador.empresa_cif} />}
          {instalador.empresa_direccion && <Row label="Dirección" value={instalador.empresa_direccion} />}
          {instalador.empresa_telefono && <Row label="Teléfono" value={instalador.empresa_telefono} />}
          {instalador.empresa_email && <Row label="Email" value={instalador.empresa_email} />}
          <div style={{ fontSize: '10px', textAlign: 'justify', marginTop: '10px', lineHeight: '1.5' }}>
            El instalador/técnico redactor declara que la presente Memoria Técnica está de acuerdo con las
            prescripciones del vigente Reglamento Electrotécnico para Baja Tensión (RD 842/2002) e
            instrucciones ITC-BT específicas de aplicación.
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px' }}>
            {data.lugarFirma}, a {formatDate(data.fechaFirma)}
          </div>
          <div style={{ marginTop: '6px', fontSize: '10px' }}>Firma y sello del instalador:</div>
          {instalador.firma_url ? (
            <img src={instalador.firma_url} style={{ height: '60px', marginTop: '4px' }} />
          ) : (
            <div style={S.signatureBox} />
          )}
        </div>
      </div>
    </div>
  )
}
