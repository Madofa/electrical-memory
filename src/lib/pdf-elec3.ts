import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFForm } from 'pdf-lib'
import type { Elec3Doc } from './supabase-elec3'
import type { Instalador } from '../types'
import type { Projecte } from './supabase-projectes'
import { calculaTrams } from './elec3-calculs'

// Page 1: calculation table — A4 landscape (842×595pt)
// Rows: derivació individual at top, then C-D through Y-Z
// These Y coordinates are approximate and may need calibration after first test
const P1_FIRST_ROW_Y = 490   // y of first data row (derivació individual)
const P1_ROW_H = 28           // vertical spacing between rows
const P1_FS = 6.5             // font size

// Column X positions (left edge of each cell, landscape A4)
const P1_COLS = {
  carrega:     190,
  potencia:    212,
  cosfi:       238,
  intensitat:  258,
  seccio:      280,
  longitud:    306,
  moment:      328,
  caiguda_p:   360,
  caiguda_t:   390,
  tipus:       420,
  tensio_ail:  448,
  tub_enc:     490,
  tub_senc:    516,
  enterrat:    540,
  aillament:   562,
  neutre:      588,
  protec:      612,
}

// Page 2: summary — A4 portrait (595×842pt)
// These coordinates are approximate, calibrate after first test
const P2 = {
  titular:         { x: 90,  y: 756 },
  us_installacio:  { x: 295, y: 756 },
  emplacament:     { x: 90,  y: 720 },
  localitat:       { x: 90,  y: 690 },
  cp:              { x: 200, y: 690 },
  empresa_dist:    { x: 90,  y: 655 },
  seccio_di:       { x: 500, y: 620 },
  resist_terra:    { x: 500, y: 576 },
  superficie:      { x: 395, y: 532 },
  potencia_max:    { x: 290, y: 498 },
  tensio:          { x: 500, y: 498 },
  potencia_inst:   { x: 290, y: 464 },
  iga:             { x: 500, y: 464 },
  fs: 7.5,
}

export async function generateElec3PDF(
  doc: Elec3Doc,
  instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  // Check if template exists; if not, generate a minimal placeholder PDF
  let templateBytes: Uint8Array | null = null
  try {
    const response = await fetch('/templates/elec3-blank.pdf')
    if (response.ok) {
      templateBytes = new Uint8Array(await response.arrayBuffer())
    }
  } catch {
    // template not available yet
  }

  if (!templateBytes) {
    // Template not available — generate text-only fallback PDF
    return generateElec3Fallback(doc, instalador, projecte)
  }

  // Try AcroForm fill first
  try {
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
    const form = pdfDoc.getForm()
    if (form.getFields().length > 0) {
      return fillElec3AcroForm(pdfDoc, form, doc, instalador, projecte)
    }
  } catch {
    // fall through to coordinate approach
  }

  return fillElec3Coordinates(templateBytes, doc, instalador, projecte)
}

async function fillElec3AcroForm(
  pdfDoc: PDFDocument,
  form: PDFForm,
  doc: Elec3Doc,
  _instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  const trams = calculaTrams(doc.trams)
  const ROWS = ['Derivaci_individual','C_D','E_F','G_H','I_J','K_L','M_N','O_P','Q_R','S_T','U_V','W_X','Y_Z']

  const trySet = (name: string, value: string) => {
    try { form.getTextField(name).setText(value) } catch { /* field not found */ }
  }

  trams.forEach((t, i) => {
    const p = ROWS[i] || `row${i}`
    trySet(`${p}_carrega`, t.carrega_pct ? String(t.carrega_pct) : '')
    trySet(`${p}_potencia`, t.potencia_kw ? String(t.potencia_kw) : '')
    trySet(`${p}_cosfi`, String(t.cos_fi))
    trySet(`${p}_intensitat`, t.intensitat_a ? String(t.intensitat_a) : '')
    trySet(`${p}_seccio`, String(t.seccio_mm2))
    trySet(`${p}_longitud`, t.longitud_m ? String(t.longitud_m) : '')
    trySet(`${p}_moment`, t.moment_kwm ? String(t.moment_kwm) : '')
    trySet(`${p}_caiguda_p`, t.caiguda_parcial_pct ? t.caiguda_parcial_pct.toFixed(2) : '')
    trySet(`${p}_caiguda_t`, t.caiguda_total_pct ? t.caiguda_total_pct.toFixed(2) : '')
    trySet(`${p}_tipus`, t.tipus_conductor)
    trySet(`${p}_tensio_ail`, t.tensio_nominal_aillament)
    trySet(`${p}_tub_enc`, t.canal_tub_encastat_mm ? String(t.canal_tub_encastat_mm) : '')
    trySet(`${p}_tub_senc`, t.canal_tub_sense_encas_mm ? String(t.canal_tub_sense_encas_mm) : '')
    trySet(`${p}_enterrat`, t.canal_enterrat_prof_m ? String(t.canal_enterrat_prof_m) : '')
    trySet(`${p}_aillament`, t.aillament_instal_kohm ? String(t.aillament_instal_kohm) : '')
    trySet(`${p}_neutre`, t.conduc_neutre_mm2 ? String(t.conduc_neutre_mm2) : '')
    trySet(`${p}_protec`, t.conduc_protec_mm2 ? String(t.conduc_protec_mm2) : '')
  })

  trySet('TITULAR', projecte?.titular_nom || '')
  trySet('US_INSTALLACIO', doc.us_installacio)
  trySet('EMPLACAMENT', projecte ? `${projecte.inst_nom_via} ${projecte.inst_numero}`.trim() : '')
  trySet('LOCALITAT', projecte?.inst_poblacio || '')
  trySet('NCP', projecte?.inst_cp || '')
  trySet('EMPRESA_DISTRIBUIDORA', doc.empresa_distribuidora)
  trySet('RESIST_TERRA', doc.resist_terra_ohm ? String(doc.resist_terra_ohm) : '')
  trySet('POTENCIA_MAX', trams[0]?.potencia_kw ? String(trams[0].potencia_kw) : '')
  trySet('POTENCIA_INST', doc.potencia_instal_kw ? String(doc.potencia_instal_kw) : '')
  trySet('TENSIO', trams[0]?.tensio_v ? String(trams[0].tensio_v) : '230')
  trySet('IGA', doc.intensitat_iga_a ? String(doc.intensitat_iga_a) : '')
  trySet('SECCIO_DI', String(trams[0]?.seccio_mm2 ?? ''))

  form.flatten()
  return pdfDoc.save()
}

async function fillElec3Coordinates(
  templateBytes: Uint8Array,
  doc: Elec3Doc,
  _instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  const trams = calculaTrams(doc.trams)
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const BLACK = rgb(0, 0, 0)

  // Load template pages safely — template may have 1 or 2 pages
  const templateDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
  const templatePageCount = templateDoc.getPageCount()

  const pageIndices: number[] = [0]
  if (templatePageCount >= 2) pageIndices.push(1)

  const embeddedPages = await pdfDoc.embedPdf(templateBytes, pageIndices)
  const embP1 = embeddedPages[0]
  const embP2 = embeddedPages.length >= 2 ? embeddedPages[1] : null

  // Page 1: landscape
  const page1 = pdfDoc.addPage([842, 595])
  page1.drawPage(embP1, { x: 0, y: 0, width: 842, height: 595 })

  trams.forEach((t, i) => {
    const y = P1_FIRST_ROW_Y - i * P1_ROW_H
    if (y < 40) return
    const d = (text: string, x: number) => {
      if (text) page1.drawText(text, { x, y, size: P1_FS, font, color: BLACK })
    }
    d(t.carrega_pct ? String(t.carrega_pct) : '', P1_COLS.carrega)
    d(t.potencia_kw ? String(t.potencia_kw) : '', P1_COLS.potencia)
    d(String(t.cos_fi), P1_COLS.cosfi)
    d(t.intensitat_a ? String(t.intensitat_a) : '', P1_COLS.intensitat)
    d(String(t.seccio_mm2), P1_COLS.seccio)
    d(t.longitud_m ? String(t.longitud_m) : '', P1_COLS.longitud)
    d(t.moment_kwm ? String(t.moment_kwm) : '', P1_COLS.moment)
    d(t.caiguda_parcial_pct ? t.caiguda_parcial_pct.toFixed(2) : '', P1_COLS.caiguda_p)
    d(t.caiguda_total_pct ? t.caiguda_total_pct.toFixed(2) : '', P1_COLS.caiguda_t)
    d(t.tipus_conductor, P1_COLS.tipus)
    d(t.tensio_nominal_aillament, P1_COLS.tensio_ail)
    d(t.canal_tub_encastat_mm ? String(t.canal_tub_encastat_mm) : '', P1_COLS.tub_enc)
    d(t.canal_tub_sense_encas_mm ? String(t.canal_tub_sense_encas_mm) : '', P1_COLS.tub_senc)
    d(t.canal_enterrat_prof_m ? String(t.canal_enterrat_prof_m) : '', P1_COLS.enterrat)
    d(t.aillament_instal_kohm ? String(t.aillament_instal_kohm) : '', P1_COLS.aillament)
    d(t.conduc_neutre_mm2 ? String(t.conduc_neutre_mm2) : '', P1_COLS.neutre)
    d(t.conduc_protec_mm2 ? String(t.conduc_protec_mm2) : '', P1_COLS.protec)
  })

  // Page 2: portrait (only if template has a second page)
  const page2 = pdfDoc.addPage([595, 842])
  if (embP2) {
    page2.drawPage(embP2, { x: 0, y: 0, width: 595, height: 842 })
  }

  const d2 = (text: string, x: number, y: number) => {
    if (text) page2.drawText(text, { x, y, size: P2.fs, font, color: BLACK })
  }
  d2(projecte?.titular_nom || '', P2.titular.x, P2.titular.y)
  d2(doc.us_installacio, P2.us_installacio.x, P2.us_installacio.y)
  d2(projecte ? `${projecte.inst_nom_via} ${projecte.inst_numero}`.trim() : '', P2.emplacament.x, P2.emplacament.y)
  d2(projecte?.inst_poblacio || '', P2.localitat.x, P2.localitat.y)
  d2(projecte?.inst_cp || '', P2.cp.x, P2.cp.y)
  d2(doc.empresa_distribuidora, P2.empresa_dist.x, P2.empresa_dist.y)
  d2(doc.resist_terra_ohm ? String(doc.resist_terra_ohm) : '', P2.resist_terra.x, P2.resist_terra.y)
  d2(trams[0]?.potencia_kw ? String(trams[0].potencia_kw) : '', P2.potencia_max.x, P2.potencia_max.y)
  d2(trams[0]?.tensio_v ? String(trams[0].tensio_v) : '230', P2.tensio.x, P2.tensio.y)
  d2(doc.potencia_instal_kw ? String(doc.potencia_instal_kw) : '', P2.potencia_inst.x, P2.potencia_inst.y)
  d2(doc.intensitat_iga_a ? String(doc.intensitat_iga_a) : '', P2.iga.x, P2.iga.y)
  d2(String(trams[0]?.seccio_mm2 ?? ''), P2.seccio_di.x, P2.seccio_di.y)

  return pdfDoc.save()
}

async function generateElec3Fallback(
  doc: Elec3Doc,
  instalador: Instalador,
  _projecte?: Projecte,
): Promise<Uint8Array> {
  const trams = calculaTrams(doc.trams)
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)
  const page = pdfDoc.addPage([842, 595])

  page.drawText('MEMORIA TECNICA - Caiguda de tensio (ELEC-3)', {
    x: 200, y: 555, size: 11, font: fontBold, color: BLACK,
  })
  page.drawText(`${doc.nom} - ${instalador.nombre_completo}`, {
    x: 200, y: 540, size: 8, font, color: BLACK,
  })
  page.drawText('NOTA: plantilla elec3-blank.pdf no disponible. Converteix MemoriaTecnicaELEC3.doc a PDF i desa-la a public/templates/elec3-blank.pdf', {
    x: 50, y: 520, size: 7, font, color: rgb(0.8, 0, 0),
  })

  let y = 490
  trams.forEach((t) => {
    if (y < 50) return
    const estat = t.ok ? 'OK' : 'ATENCIO'
    page.drawText(`${t.nom}: ${t.potencia_kw}kW, ${t.seccio_mm2}mm2, ${t.longitud_m}m -> dU=${t.caiguda_total_pct.toFixed(2)}% [${estat}]`, {
      x: 50, y, size: 7, font, color: BLACK,
    })
    y -= 20
  })

  return pdfDoc.save()
}
