import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Elec3Doc } from './supabase-elec3'
import type { Instalador } from '../types'
import type { Projecte } from './supabase-projectes'
import type { Diferencial, Circuit } from '../types/esquemaUnifilar'
import { calculaTrams } from './elec3-calculs'

const COL_X = [133,170.8,202.1,227.3,269,302.7,337.1,382.4,424.5,
               464.9,500.2,552.8,590,620.6,661.6,733.6,770.7,805.7]
const ROW_Y = [431.3,406.2,381.1,356,330.9,305.8,280.7,255.5,230.4,205.3,180.2,155.1,130]

const P2 = {
  titular_nom:              { x: 59.3,  y: 488   },
  us_installacio:           { x: 430.7, y: 494   },
  emplacament:              { x: 58,    y: 446   },
  emplacament_num:          { x: 278,   y: 446   },
  localitat:                { x: 111.3, y: 416   },
  cp:                       { x: 296,   y: 419   },
  nova:                     { x: 391.3, y: 428   },
  ampliacio:                { x: 462,   y: 428   },
  reforma:                  { x: 527.3, y: 428   },
  empresa_distribuidora:    { x: 133.3, y: 373   },
  dif1_circuit:             { x: 396,   y: 382   },
  dif1_nombre:              { x: 430,   y: 382   },
  dif1_in:                  { x: 456,   y: 382   },
  dif1_sensibilitat:        { x: 494,   y: 382   },
  dif2_circuit:             { x: 396,   y: 361   },
  dif2_nombre:              { x: 430,   y: 361   },
  dif2_in:                  { x: 456,   y: 361   },
  dif2_sensibilitat:        { x: 494,   y: 361   },
  dif3_circuit:             { x: 396,   y: 338   },
  dif3_nombre:              { x: 430,   y: 338   },
  dif3_in:                  { x: 456,   y: 338   },
  dif3_sensibilitat:        { x: 494,   y: 338   },
  resist_terra:             { x: 640.7, y: 338   },
  seccio_di:                { x: 636.7, y: 387   },
  tensio:                   { x: 665.3, y: 316   },
  iga:                      { x: 666.7, y: 284   },
  potencia_max:             { x: 504.7, y: 316   },
  superficie:               { x: 304,   y: 287   },
  potencia_instal:          { x: 504,   y: 284   },
  data_signatura:           { x: 702.7, y: 215.3 },
  caracteristiques_edifici: { x: 62.7,  y: 284.7 },
}

export async function generateElec3PDF(
  doc: Elec3Doc,
  _instalador: Instalador,
  projecte?: Projecte,
  diferencials?: Diferencial[],
  _circuits?: Circuit[],
  numDiferencialsOverride?: number | null,
  esquemaIga?: number | null,
): Promise<Uint8Array> {
  const response = await fetch('/templates/elec3-blank.pdf')
  if (!response.ok) throw new Error("No s'ha pogut carregar la plantilla ELEC-3")
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const BLACK = rgb(0, 0, 0)
  const [embP1, embP2] = await pdfDoc.embedPdf(templateBytes, [0, 1])

  // PAGE 1
  const page1 = pdfDoc.addPage([842, 595])
  page1.drawPage(embP1, { x: 0, y: 0, width: 842, height: 595 })
  const trams = calculaTrams(doc.trams)
  trams.forEach((t, rowIdx) => {
    if (rowIdx >= ROW_Y.length) return
    // Skip completely empty rows (no power and no length entered)
    const isEmpty = !t.potencia_kw && !t.longitud_m && rowIdx > 0
    if (isEmpty) return
    const y = ROW_Y[rowIdx]
    const draw = (colIdx: number, val: string | number | null | undefined) => {
      if (val === null || val === undefined || val === '' || val === 0) return
      const text = String(val)
      const textWidth = font.widthOfTextAtSize(text, 6.5)
      // Center text on the calibrated column X coordinate
      page1.drawText(text, { x: COL_X[colIdx] - textWidth / 2, y, size: 6.5, font, color: BLACK })
    }
    draw(0,t.carrega_pct||''); draw(1,t.potencia_kw||''); draw(2,t.cos_fi)
    draw(3,t.intensitat_a||''); draw(4,t.seccio_mm2); draw(5,t.longitud_m||'')
    draw(6,t.moment_kwm||'')
    draw(7,t.caiguda_parcial_pct?t.caiguda_parcial_pct.toFixed(2):'')
    draw(8,t.caiguda_total_pct?t.caiguda_total_pct.toFixed(2):'')
    // Always draw TIPUS and tensió nominal (standard values)
    draw(9,  t.tipus_conductor || 'Cu')
    draw(10, t.tensio_nominal_aillament || '0,45/0,75')
    draw(11, t.canal_sense_tub || '')
    draw(12, t.canal_tub_encastat_mm ?? '')
    draw(13, t.canal_tub_sense_encas_mm ?? '')
    draw(14, t.canal_enterrat_prof_m ?? '')
    // Aïllament instal·lació: si no s'ha mesurat, mínim REBT ITC-BT-19 = 500 kΩ (0.5 MΩ)
    draw(15, t.aillament_instal_kohm ?? 500)
    // Default neutre/protec = seccio_mm2 if not set (use || to also catch 0)
    draw(16, t.conduc_neutre_mm2 || t.seccio_mm2)
    draw(17, t.conduc_protec_mm2 || t.seccio_mm2)
  })

  // PAGE 2
  const page2 = pdfDoc.addPage([842, 595])
  page2.drawPage(embP2, { x: 0, y: 0, width: 842, height: 595 })
  const p = projecte
  const ncp = doc.nova_ampliacio_reforma||p?.nova_ampliacio_reforma||'nova'
  const d2 = (coord:{x:number;y:number}, text:string) => {
    if (!text||text==='0') return
    page2.drawText(text, { x:coord.x, y:coord.y, size:7.5, font, color:BLACK })
  }
  d2(P2.titular_nom, p?.titular_nom||'')
  // Migra format antic del dropdown ("b) Instal·lacions...") → elimina el prefix "x) "
  const usRaw = p?.us_installacio || doc.us_installacio || ''
  const usToShow = usRaw.replace(/^[a-h]\)\s*/i, '')
  d2(P2.us_installacio, usToShow)
  d2(P2.caracteristiques_edifici, doc.caracteristiques_edifici || p?.caracteristiques_edifici || '')
  d2(P2.emplacament,     p?.inst_nom_via  || '')
  d2(P2.emplacament_num, p?.inst_numero   || '')
  d2(P2.localitat, p?.inst_poblacio||'')
  d2(P2.cp, p?.inst_cp||'')
  d2(P2.nova, ncp==='nova'?'X':'')
  d2(P2.ampliacio, ncp==='ampliacio'?'X':'')
  d2(P2.reforma, ncp==='reforma'?'X':'')
  // Doc values always take priority; project fills blanks
  d2(P2.empresa_distribuidora, doc.empresa_distribuidora || p?.empresa_distribuidora || '')
  d2(P2.resist_terra,          doc.resist_terra_ohm  ? String(doc.resist_terra_ohm)  : p?.resist_terra_ohm  ? String(p.resist_terra_ohm)  : '')
  d2(P2.seccio_di,             trams[0] ? String(trams[0].seccio_mm2) : '')
  d2(P2.tensio,                p?.tensio_v || trams[0]?.tensio_v?.toString() || '230')
  const igaA = doc.intensitat_iga_a ?? esquemaIga ?? p?.iga_amperatge ?? null
  d2(P2.iga,                   igaA ? String(igaA) : '')
  const tensioV = p?.tensio_v ? parseFloat(p.tensio_v) : 230
  d2(P2.potencia_max,          igaA ? String(parseFloat((igaA * tensioV / 1000).toFixed(2))) : p?.potencia_kw ? String(p.potencia_kw) : '')
  d2(P2.potencia_instal,       doc.potencia_instal_kw ? String(doc.potencia_instal_kw) : p?.potencia_kw ? String(p.potencia_kw) : '')
  d2(P2.superficie,            doc.superficie_local_m2 ? String(doc.superficie_local_m2) : p?.superficie_local_m2 ? String(p.superficie_local_m2) : '')
  // caracteristiques_edifici already written above (with old-dropdown migration logic)
  // Diferencials from ELEC-2 esquema
  if (diferencials && diferencials.length > 0) {
    const limit = numDiferencialsOverride ?? diferencials.length
    const difsToShow = diferencials.slice(0, Math.min(limit, 3))
    const difCoords = [
      { circuit: P2.dif1_circuit, nombre: P2.dif1_nombre, in_a: P2.dif1_in, sens: P2.dif1_sensibilitat },
      { circuit: P2.dif2_circuit, nombre: P2.dif2_nombre, in_a: P2.dif2_in, sens: P2.dif2_sensibilitat },
      { circuit: P2.dif3_circuit, nombre: P2.dif3_nombre, in_a: P2.dif3_in, sens: P2.dif3_sensibilitat },
    ]
    difsToShow.slice(0, 3).forEach((dif, i) => {
      const cc = difCoords[i]
      d2(cc.circuit, String(i + 1))
      d2(cc.nombre,  '1')
      d2(cc.in_a,    String(dif.amperatge))
      d2(cc.sens,    String(dif.sensibilitat_ma))
    })
  }

  d2(P2.data_signatura, new Date().toLocaleDateString('ca-ES'))

  return pdfDoc.save()
}
