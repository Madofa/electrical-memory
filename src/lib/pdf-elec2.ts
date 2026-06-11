import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import type { Circuit, Diferencial, DadesCapcalera } from '../types/esquemaUnifilar'
import type { Instalador } from '../types'

// ── Same constants as UnifilarSVG.tsx ────────────────────────────────────────
// VB_W=620 crops the empty right side of esquema-elec3.svg and keeps the diagram's
// vertical position fixed (VB_W ≥ areaH*VB_H/areaW ≈ 581.9) while filling more page width.
const VB_W = 620, VB_H = 511.99
const BASE_W = 686.97
const CUADRO_Y = 8.49, CUADRO_H = 491.82
const MM = VB_H / 297
// esquema-elec3.svg = esquema-elec2.svg shifted by (+1.51, +5.29) on a wider canvas.
const DIF_X = 208.27 + 2 * MM  // +2mm right from calibrated point
const DIF_VB_W = 20.42, DIF_VB_H = 30.93
const DIF_W = 20, DIF_H = DIF_VB_H * (DIF_W / DIF_VB_W)
const DIF_SYMBOL_X = DIF_X + 5 * MM + 2      // +2pt right so pre-symbol line is more visible
const DIF_END_X = DIF_SYMBOL_X + DIF_W
const DIF_INPUT_Y_FRAC = 9.24 / DIF_VB_H
// Punt de connexió de sortida: vora dreta del símbol a l'alçada del punt de contacte
// (calibrat via /dev/calibrar-elec2 — elec2-coords (2).json: x≈19.88, y≈29.67)
const DIF_CONN_X = DIF_SYMBOL_X + DIF_W * (19.88 / DIF_VB_W)
const DIF_CONN_Y_FRAC = 29.67 / DIF_VB_H
const TERM_VB_W = 33.68, TERM_VB_H = 16.63
const TERM_W = 28, TERM_H = TERM_VB_H * (TERM_W / TERM_VB_W)
const TERM_CIRC_Y_FRAC = 15.33 / TERM_VB_H
const TERM_LINE_START = DIF_END_X + 15 * MM
const TERM_X = 279.51
const TERM_LINE_END = TERM_X - 2 * MM + 2    // +2pt closer to symbol

const EXT_LINE_START = 322.43 + 20 * MM  // +2cm a la dreta
const EXT_LINE_LEN   = 70
const EXT_LINE_END   = EXT_LINE_START + EXT_LINE_LEN
const IGA_TEXT_X = 141.52, IGA_TEXT_Y = 250.29

// Earth protection line: reaches the vertical earth line (calibrated via /dev/calibrar-elec2 — x≈313.09)
const EARTH_START_X = 314.60
const EARTH_END_X   = EXT_LINE_END
const BOT_LABELS = ['C','E','G','I','K','M','O','Q','S','U','W','Y']
const TOP_LABELS = ['D','F','H','J','L','N','P','R','T','V','X','Z']

// ── Build full diagram SVG string (base + all overlays) ───────────────────────
async function buildDiagramSVG(circuits: Circuit[], diferencials: Diferencial[], iga: number): Promise<string> {
  const [baseTxt, difTxt, termTxt] = await Promise.all([
    fetch('/svg/esquema-elec3.svg').then(r => r.text()),
    fetch('/svg/simbolo-diferencial.svg').then(r => r.text()),
    fetch('/svg/simbolo-termico.svg').then(r => r.text()),
  ])
  const enc = (t: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}`
  const baseUrl = enc(baseTxt), difUrl = enc(difTxt), termUrl = enc(termTxt)

  const activeDifs = diferencials.filter(d => circuits.some(c => c.diferencial_grup === d.id))
  const N = activeDifs.length || 1
  const spacing = CUADRO_H / N

  const groups = activeDifs.map((dif, gi) => {
    const allocStart = CUADRO_Y + gi * spacing
    const difY = allocStart + spacing / 2
    const difInputY = (difY - DIF_H / 2) + DIF_H * DIF_INPUT_Y_FRAC
    const difConnY  = (difY - DIF_H / 2) + DIF_H * DIF_CONN_Y_FRAC
    const difCircuits = circuits.filter(c => c.diferencial_grup === dif.id)
    const Nc = difCircuits.length || 1
    const cSpacing = spacing / Nc
    const circuitRows = difCircuits.map((circ, ci) => ({
      circ, globalIdx: circuits.indexOf(circ),
      // Single circuit: align to difConnY so the line from differential goes straight
      circY: Nc === 1 ? difConnY : allocStart + (ci + 0.5) * cSpacing,
    }))
    return { dif, difY, difInputY, difConnY, circuitRows }
  })

  let els = `<image href="${baseUrl}" x="0" y="-5" width="${BASE_W}" height="${VB_H}"/>
  ${iga > 0 ? `<text x="${IGA_TEXT_X}" y="${IGA_TEXT_Y}" text-anchor="middle" font-size="6" font-weight="bold" fill="#000">${iga}A</text>` : ''}`

  // Differential spine
  if (groups.length > 0) {
    const y1 = groups[0].difInputY, y2 = groups[groups.length - 1].difInputY
    els += `<line x1="${DIF_X}" y1="${y1}" x2="${DIF_X}" y2="${y2}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
  }
  els += `<circle cx="${DIF_X}" cy="241.29" r="1.8" fill="#000"/>`

  for (const { dif, difY, difInputY, difConnY, circuitRows } of groups) {
    els += `<circle cx="${DIF_X}" cy="${difInputY}" r="1.5" fill="#000"/>`
    els += `<line x1="${DIF_X}" y1="${difInputY}" x2="${DIF_SYMBOL_X - 2}" y2="${difInputY}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
    els += `<image href="${difUrl}" x="${DIF_SYMBOL_X}" y="${difY - DIF_H / 2}" width="${DIF_W}" height="${DIF_H}"/>`
    els += `<text x="${DIF_SYMBOL_X + DIF_W / 2 + 5}" y="${difY + DIF_H / 2 + 9}" text-anchor="middle" font-size="5" font-weight="bold" fill="#000">${dif.amperatge}A / ${dif.sensibilitat_ma} mA</text>`

    // Vertical thermic bus only when multiple circuits branch off
    if (circuitRows.length > 1) {
      const ys = [difConnY, ...circuitRows.map(r => r.circY)]
      els += `<line x1="${TERM_LINE_START}" y1="${Math.min(...ys)}" x2="${TERM_LINE_START}" y2="${Math.max(...ys)}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
    }
    els += `<line x1="${DIF_CONN_X}" y1="${difConnY}" x2="${TERM_LINE_START}" y2="${difConnY}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
    // Junction circle only when multiple circuits
    if (circuitRows.length > 1) els += `<circle cx="${TERM_LINE_START}" cy="${difConnY}" r="1.2" fill="#000"/>`

    for (const { circ, circY, globalIdx } of circuitRows) {
      const termSymY = circY - TERM_H * TERM_CIRC_Y_FRAC
      const labelA = BOT_LABELS[globalIdx] ?? String(globalIdx + 1)
      const labelB = TOP_LABELS[globalIdx] ?? String(globalIdx + 1)

      els += `<circle cx="${TERM_LINE_START}" cy="${circY}" r="1.2" fill="#000"/>`
      // Thermic line with 5mm gap, symbol 2mm after line
      els += `<line x1="${TERM_LINE_START}" y1="${circY}" x2="${TERM_LINE_END}" y2="${circY}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
      els += `<image href="${termUrl}" x="${TERM_X}" y="${termSymY}" width="${TERM_W}" height="${TERM_H}"/>`
      if (circ.pia_amperatge) els += `<text x="${TERM_X + TERM_W / 2}" y="${termSymY + TERM_H + 2}" text-anchor="middle" font-size="5" font-weight="bold" fill="#000">${circ.pia_amperatge}A</text>`
      // Internal line: from thermic symbol's edge (crosses the cuadro border) → EXT_LINE_START
      els += `<line x1="${TERM_X + TERM_W - 2}" y1="${circY}" x2="${EXT_LINE_START}" y2="${circY}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
      // External line: EXT_LINE_START → EXT_LINE_END (outside cuadro)
      els += `<line x1="${EXT_LINE_START}" y1="${circY}" x2="${EXT_LINE_END}" y2="${circY}" stroke="#000" stroke-width="0.9" stroke-dasharray="3 3"/>`
      // Earth protection: reaches the vertical earth line
      els += `<line x1="${EARTH_START_X}" y1="${circY + 4}" x2="${EARTH_END_X}" y2="${circY + 4}" stroke="#000" stroke-width="0.7" stroke-dasharray="1 1"/>`
      // Letter at START of external line — white halo so the dashed line doesn't cross through it
      els += `<text x="${EXT_LINE_START - 1}" y="${circY + 2}" text-anchor="end" font-size="5" font-weight="bold" stroke="#fff" stroke-width="2.5" paint-order="stroke" fill="#000">${labelA}</text>`
      // Letter at END of external line — white halo, same reason
      els += `<text x="${EXT_LINE_END + 1}" y="${circY + 2}" font-size="5" font-weight="bold" stroke="#fff" stroke-width="2.5" paint-order="stroke" fill="#000">${labelB}</text>`
      // Cable section above external line
      if (circ.seccio) {
        els += `<text x="${EXT_LINE_START + 5}" y="${circY - 3}" font-size="5.5" fill="#000">${circ.seccio}</text>`
      }
      // Circuit name after end letter, followed by power 1.5cm later, bigger & bold
      const kw = circ.potencia_kw > 0 ? `${circ.potencia_kw.toFixed(2).replace('.', ',')} kW` : ''
      els += `<text x="${EXT_LINE_END + 14}" y="${circY + 2}" font-size="5.5" font-weight="bold" fill="#000">${circ.nom}${kw ? `<tspan dx="${10 * MM - 2}" font-size="6">${kw}</tspan>` : ''}</text>`
    }
  }

  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" font-family="Verdana,Arial,sans-serif">${els}</svg>`
}

// ── Rasterize SVG string → PNG ────────────────────────────────────────────────
async function svgToPng(svgStr: string, w: number, h: number): Promise<Uint8Array> {
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = Math.round(w * 2); c.height = Math.round(h * 2)
      const ctx = c.getContext('2d')!
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      c.toBlob(b => b!.arrayBuffer().then(buf => resolve(new Uint8Array(buf))), 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

// ── PDF generation — official elec2-blank.pdf template ───────────────────────
export async function generateElec2PDF(
  circuits: Circuit[],
  diferencials: Diferencial[],
  _iga: number,
  capcalera: DadesCapcalera,
  instalador?: Instalador | null,
): Promise<Uint8Array> {
  // 1. Official blank form as background
  const templateResp = await fetch('/templates/elec2-blank.pdf')
  if (!templateResp.ok) throw new Error("No s'ha pogut carregar la plantilla ELEC-2")
  const templateBytes = new Uint8Array(await templateResp.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const [embPage] = await pdfDoc.embedPdf(templateBytes, [0])
  const font  = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)

  // Template is 586×836 (portrait A4)
  const page = pdfDoc.addPage([586, 836])
  page.drawPage(embPage, { x: 0, y: 0, width: 586, height: 836 })

  // 2. Build and rasterize the complete diagram
  const svgStr = await buildDiagramSVG(circuits, diferencials, _iga)

  // Diagram area: x=20..566 (546pt wide), y=196..816 (620pt tall)
  // Diagram is HORIZONTAL → rotate 90° CCW to fit in portrait form
  // After 90° CCW: rotated width = diagH, rotated height = diagW
  const areaW = 546, areaH = 620
  // Scale so that: diagH ≤ areaW AND diagW ≤ areaH, +5% +2% extra (per user feedback)
  const scale = Math.min(areaW / VB_H, areaH / VB_W) * 0.92 * 1.05 * 1.02
  const diagW = VB_W * scale   // becomes rotated HEIGHT
  const diagH = VB_H * scale   // becomes rotated WIDTH

  // Center rotated image; +6.35 = raised another 10pt vs previous (-3.65)
  const leftX   = 20 + (areaW - diagH) / 2 + 34   // +10pt right vs previous (+24)
  const bottomY = 196 + (areaH - diagW) / 2 + 6.35

  // Anchor for 90° CCW: anchorX = leftX + diagH, anchorY = bottomY
  const anchorX = leftX + diagH
  const anchorY = bottomY

  const diagPng = await svgToPng(svgStr, diagW * 2, diagH * 2)  // 2× quality
  const diagImg = await pdfDoc.embedPng(diagPng)
  page.drawImage(diagImg, {
    x: anchorX, y: anchorY,
    width: diagW, height: diagH,
    rotate: degrees(90),
  })

  // 3. Data fields at official calibrated positions
  const tf = (text: string, x: number, y: number, bold = false) => {
    if (!text) return
    page.drawText(text.slice(0, 60), { x, y, size: 7.5, font: bold ? fontB : font, color: BLACK })
  }
  tf(capcalera.seccio_connexio,       204,  181)
  tf(capcalera.tensio,               339,  181)
  tf(capcalera.empresa_distribuidora, 54,  181)
  tf(capcalera.emplacament,           170, 154)
  tf(capcalera.titular,               170, 93, true)
  if (instalador) {
    const nom = `${instalador.nombre_completo || ''}${instalador.numero_carnet ? ` (RASIC ${instalador.numero_carnet})` : ''}`
    page.drawText(nom.slice(0, 60), { x: 170, y: 122, size: 8.5, font: fontB, color: BLACK })
  }

  return pdfDoc.save()
}
