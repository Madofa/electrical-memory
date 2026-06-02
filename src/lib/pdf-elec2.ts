import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Circuit, Diferencial, DadesCapcalera } from '../types/esquemaUnifilar'

const FOOTER = {
  empresaDist:    { x: 12,  y: 135, maxW: 140 },
  seccioConnexio: { x: 175, y: 135, maxW: 115 },
  tensio:         { x: 315, y: 135, maxW: 75  },
  emplacament:    { x: 12,  y: 108, maxW: 370 },
  installador:    { x: 12,  y: 80,  maxW: 370 },
  titular:        { x: 12,  y: 52,  maxW: 370 },
  dataSignatura:  { x: 418, y: 20,  maxW: 160 },
}

const DIAGRAM = {
  xLeft:      88,
  xRight:     585,
  yBottom:    162,
  yPotencia:  780,
  yReceptor:  740,
  ySeccio:    635,
  yPiaTop:    610,
  yPiaBot:    570,
  yDifTop:    545,
  yDifBot:    505,
  yBus:       480,
  yIgaTop:    455,
  yIgaBot:    415,
  yIcpTop:    395,
  yIcpBot:    360,
  yCompTop:   340,
  yCompBot:   300,
  yTerraTop:  285,
  yTerraBot:  262,
}

function colX(count: number, index: number): number {
  const n = Math.max(count, 1)
  const colW = (DIAGRAM.xRight - DIAGRAM.xLeft) / n
  return DIAGRAM.xLeft + colW * index + colW / 2
}

export async function generateElec2PDF(
  circuits: Circuit[],
  diferencials: Diferencial[],
  iga: number,
  capcalera: DadesCapcalera,
): Promise<Uint8Array> {
  const response = await fetch('/templates/elec2-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-2')
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const [embeddedPage] = await pdfDoc.embedPdf(templateBytes, [0])
  const page = pdfDoc.addPage([595, 842])
  page.drawPage(embeddedPage, { x: 0, y: 0, width: 595, height: 842 })

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)
  const FS = 7.5

  const drawField = (text: string, x: number, y: number, maxW: number, bold = false) => {
    if (!text) return
    page.drawText(text.slice(0, 60), { x, y, size: FS, font: bold ? fontBold : font, color: BLACK, maxWidth: maxW })
  }

  drawField(capcalera.empresa_distribuidora, FOOTER.empresaDist.x, FOOTER.empresaDist.y, FOOTER.empresaDist.maxW)
  drawField(capcalera.seccio_connexio, FOOTER.seccioConnexio.x, FOOTER.seccioConnexio.y, FOOTER.seccioConnexio.maxW)
  drawField(capcalera.tensio, FOOTER.tensio.x, FOOTER.tensio.y, FOOTER.tensio.maxW)
  drawField(capcalera.emplacament, FOOTER.emplacament.x, FOOTER.emplacament.y, FOOTER.emplacament.maxW)
  drawField(capcalera.titular, FOOTER.titular.x, FOOTER.titular.y, FOOTER.titular.maxW)

  const slotCount = Math.min(circuits.length, 12)
  const cx = (DIAGRAM.xLeft + DIAGRAM.xRight) / 2

  for (let i = 0; i < slotCount; i++) {
    const c = circuits[i]
    const x = colX(slotCount, i)

    if (c.potencia_kw > 0) {
      page.drawText(String(c.potencia_kw), { x: x - 8, y: DIAGRAM.yPotencia, size: 7, font, color: BLACK })
    }
    page.drawText(c.nom.slice(0, 10), { x: x - 12, y: DIAGRAM.yReceptor, size: 6, font, color: BLACK })
    page.drawText(c.seccio, { x: x - 10, y: DIAGRAM.ySeccio, size: 6.5, font, color: BLACK })
    page.drawLine({ start: { x, y: DIAGRAM.ySeccio - 5 }, end: { x, y: DIAGRAM.yPiaTop }, thickness: 1, color: BLACK })
    page.drawRectangle({ x: x - 6, y: DIAGRAM.yPiaBot, width: 12, height: DIAGRAM.yPiaTop - DIAGRAM.yPiaBot, borderColor: BLACK, borderWidth: 1, color: rgb(1, 1, 1) })
    page.drawLine({ start: { x: x - 4, y: DIAGRAM.yPiaBot + 4 }, end: { x: x + 4, y: DIAGRAM.yPiaTop - 4 }, thickness: 1, color: BLACK })
    page.drawText(String(c.pia_amperatge), { x: x + 8, y: DIAGRAM.yPiaBot + 8, size: 6.5, font, color: BLACK })
    page.drawLine({ start: { x, y: DIAGRAM.yPiaBot }, end: { x, y: DIAGRAM.yDifTop }, thickness: 1, color: BLACK })
  }

  type GrupDif = { dif: Diferencial; idxs: number[] }
  const grups: GrupDif[] = diferencials
    .map((d) => ({ dif: d, idxs: circuits.map((c, i) => c.diferencial_grup === d.id ? i : -1).filter((i) => i >= 0) }))
    .filter((g) => g.idxs.length > 0)

  for (const g of grups) {
    const xs = g.idxs.map((i) => colX(slotCount, i))
    const xMin = Math.min(...xs) - 10
    const xMax = Math.max(...xs) + 10
    const xCtr = (xMin + xMax) / 2
    page.drawRectangle({ x: xMin, y: DIAGRAM.yDifBot, width: xMax - xMin, height: DIAGRAM.yDifTop - DIAGRAM.yDifBot, borderColor: BLACK, borderWidth: 1.2, color: rgb(1, 1, 1) })
    page.drawText(`${g.dif.amperatge}A/${g.dif.sensibilitat_ma}mA`, { x: xCtr - 16, y: (DIAGRAM.yDifTop + DIAGRAM.yDifBot) / 2 - 3, size: 6.5, font: fontBold, color: BLACK })
    page.drawLine({ start: { x: xCtr, y: DIAGRAM.yDifBot }, end: { x: xCtr, y: DIAGRAM.yBus }, thickness: 1.2, color: BLACK })
  }

  if (grups.length > 0) {
    const centers = grups.map((g) => { const xs = g.idxs.map((i) => colX(slotCount, i)); return (Math.min(...xs) + Math.max(...xs)) / 2 })
    page.drawLine({ start: { x: Math.min(...centers, cx), y: DIAGRAM.yBus }, end: { x: Math.max(...centers, cx), y: DIAGRAM.yBus }, thickness: 1.6, color: BLACK })
  }

  page.drawLine({ start: { x: cx, y: DIAGRAM.yBus }, end: { x: cx, y: DIAGRAM.yIgaTop }, thickness: 1.6, color: BLACK })
  page.drawRectangle({ x: cx - 10, y: DIAGRAM.yIgaBot, width: 20, height: DIAGRAM.yIgaTop - DIAGRAM.yIgaBot, borderColor: BLACK, borderWidth: 1.6, color: rgb(1, 1, 1) })
  page.drawLine({ start: { x: cx - 6, y: DIAGRAM.yIgaBot + 6 }, end: { x: cx + 6, y: DIAGRAM.yIgaTop - 6 }, thickness: 1.4, color: BLACK })
  page.drawText(`${iga}A`, { x: cx + 13, y: (DIAGRAM.yIgaTop + DIAGRAM.yIgaBot) / 2 - 3, size: 7, font: fontBold, color: BLACK })

  page.drawLine({ start: { x: cx, y: DIAGRAM.yIgaBot }, end: { x: cx, y: DIAGRAM.yIcpTop }, thickness: 1.6, color: BLACK })
  page.drawRectangle({ x: cx - 20, y: DIAGRAM.yIcpBot, width: 40, height: DIAGRAM.yIcpTop - DIAGRAM.yIcpBot, borderColor: BLACK, borderWidth: 1.2, color: rgb(1, 1, 1) })

  page.drawLine({ start: { x: cx, y: DIAGRAM.yIcpBot }, end: { x: cx, y: DIAGRAM.yCompTop }, thickness: 1.6, color: BLACK })
  const compCy = (DIAGRAM.yCompTop + DIAGRAM.yCompBot) / 2
  const compR = (DIAGRAM.yCompTop - DIAGRAM.yCompBot) / 2
  page.drawCircle({ x: cx, y: compCy, size: compR, borderColor: BLACK, borderWidth: 1.4, color: rgb(1, 1, 1) })
  page.drawText('kWh', { x: cx - 8, y: compCy - 3, size: 6.5, font: fontBold, color: BLACK })

  page.drawLine({ start: { x: cx, y: DIAGRAM.yCompBot }, end: { x: cx, y: DIAGRAM.yTerraTop }, thickness: 1.4, color: BLACK })
  page.drawLine({ start: { x: cx - 10, y: DIAGRAM.yTerraTop }, end: { x: cx + 10, y: DIAGRAM.yTerraTop }, thickness: 1.6, color: BLACK })
  page.drawLine({ start: { x: cx - 6, y: DIAGRAM.yTerraTop - 5 }, end: { x: cx + 6, y: DIAGRAM.yTerraTop - 5 }, thickness: 1.4, color: BLACK })
  page.drawLine({ start: { x: cx - 2, y: DIAGRAM.yTerraBot }, end: { x: cx + 2, y: DIAGRAM.yTerraBot }, thickness: 1.2, color: BLACK })

  return pdfDoc.save()
}
