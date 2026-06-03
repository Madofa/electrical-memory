import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import type { Circuit, Diferencial, DadesCapcalera } from '../types/esquemaUnifilar'
import type { Instalador } from '../types'

// ── Footer field positions (A4 portrait 595×842pt, origin bottom-left) ──────
// Each footer row is ~25pt tall. From bottom up:
//   NOTES: 18-42 | ESQUEMA UNIFILAR: 42-68 | TITULAR: 68-93
//   INSTAL·LADOR: 93-118 | EMPLAÇAMENT: 118-143 | EMPRESA/SECCIO/TENSIÓ: 143-190
const FOOTER = {
  empresaDist:    { x: 54,  y: 181, maxW: 140 },
  seccioConnexio: { x: 217, y: 181, maxW: 100 },
  tensio:         { x: 354, y: 181, maxW: 55  },
  emplacament:    { x: 170, y: 154, maxW: 260 },
  installador:    { x: 170, y: 122, maxW: 260 },
  titular:        { x: 170, y: 93,  maxW: 260 },
}

// ── Column grid ──────────────────────────────────────────────────────────────
const NUM_COLS  = 12
const XCOL_LEFT  = 83    // left edge of drawing area (after row labels)
const XCOL_RIGHT = 573   // right edge of drawing area
const COL_W      = (XCOL_RIGHT - XCOL_LEFT) / NUM_COLS  // ≈ 40.8pt

const BOT_LABELS = ['C','E','G','I','K','M','O','Q','S','U','W','Y']
const TOP_LABELS = ['D','F','H','J','L','N','P','R','T','V','X','Z']

function cx(i: number) { return XCOL_LEFT + COL_W * i + COL_W / 2 }

// ── Row heights (pt from bottom of page) ────────────────────────────────────
const R = {
  colTop:    805,   // top of dashed column lines = POTÈNCIA row top
  colBot:    548,   // bottom of column lines = where letters C,E,G... sit
  potencia:  793,   // y of POTÈNCIA values
  receptor:  700,   // y of RECEPTOR names
  seccio:    620,   // y of SECCIONS values
  // Large outer panel rectangle (quadre)
  panelTop:  545,   // = colBot − 3
  panelBot:  440,
  // Differential group boxes inside the panel (dashed)
  difTop:    535,
  difBot:    450,
  // Trunk below panel
  trunkExit: 440,   // exits bottom of panel
  // IGA
  igaTop:    415,
  igaBot:    375,
  // ICP
  icpTop:    352,
  icpBot:    328,
  // kWh meter
  kwhTop:    302,
  kwhBot:    250,
  // Terra
  terraBase: 238,
}

const CENTER_X = (XCOL_LEFT + XCOL_RIGHT) / 2

export async function generateElec2PDF(
  circuits: Circuit[],
  diferencials: Diferencial[],
  iga: number,
  capcalera: DadesCapcalera,
  instalador?: Instalador | null,
): Promise<Uint8Array> {
  const response = await fetch('/templates/elec2-blank.pdf')
  if (!response.ok) throw new Error("No s'ha pogut carregar la plantilla ELEC-2")
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const [embeddedPage] = await pdfDoc.embedPdf(templateBytes, [0])
  const page = pdfDoc.addPage([595, 842])
  page.drawPage(embeddedPage, { x: 0, y: 0, width: 595, height: 842 })

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)
  const DGRAY = rgb(0.35, 0.35, 0.35)

  // ── Footer ───────────────────────────────────────────────────────────────
  const tf = (text: string, x: number, y: number, maxW: number, bold = false) => {
    if (!text) return
    page.drawText(text.slice(0, 60), { x, y, size: 7.5, font: bold ? fontBold : font, color: BLACK, maxWidth: maxW })
  }
  tf(capcalera.empresa_distribuidora, FOOTER.empresaDist.x, FOOTER.empresaDist.y, FOOTER.empresaDist.maxW)
  tf(capcalera.seccio_connexio,       FOOTER.seccioConnexio.x, FOOTER.seccioConnexio.y, FOOTER.seccioConnexio.maxW)
  tf(capcalera.tensio,                FOOTER.tensio.x,    FOOTER.tensio.y,    FOOTER.tensio.maxW)
  tf(capcalera.emplacament,           FOOTER.emplacament.x, FOOTER.emplacament.y, FOOTER.emplacament.maxW)
  // Instal·lador autoritzat: from instalador profile
  if (instalador) {
    const nomInstalador = instalador.nombre_completo || ''
    const rasic = instalador.numero_carnet ? ` (RASIC ${instalador.numero_carnet})` : ''
    page.drawText((nomInstalador + rasic).slice(0, 60), {
      x: FOOTER.installador.x, y: FOOTER.installador.y,
      size: 8.5, font: fontBold, color: BLACK, maxWidth: FOOTER.installador.maxW,
    })
  }
  tf(capcalera.titular,               FOOTER.titular.x,   FOOTER.titular.y,   FOOTER.titular.maxW)

  // Layout follows Can Manel example exactly:
  //   colTop(805) ← POTÈNCIA values (top)
  //   RECEPTORS zone: R.seccio+15(635) → R.colTop → receptor names rotated, left of line
  //   TOP labels (D,F,H...): at R.seccio+3 = 623   ← top of SECCIONS band
  //   SECCIONS zone: R.panelTop+5(550) → R.seccio → seccio values rotated, left of line
  //   BOT labels (C,E,G...): at R.panelTop+3 = 548 ← bottom of SECCIONS band / panel top

  // ── 1. Dashed vertical column lines + labels — only for active circuits ──────
  const slotCount = Math.min(circuits.length, NUM_COLS)
  for (let i = 0; i < slotCount; i++) {
    const x = cx(i)
    // Two segments with gaps at letter positions (no line over the letters)
    // Segment 1: SECCIONS zone (between C and D labels)
    page.drawLine({
      start: { x, y: R.panelTop + 12 },
      end:   { x, y: R.seccio - 7 },
      thickness: 0.7, color: DGRAY, dashArray: [4, 3],
    })
    // Segment 2: RECEPTORS + POTÈNCIA zone (above D labels)
    page.drawLine({
      start: { x, y: R.seccio + 12 },
      end:   { x, y: R.colTop },
      thickness: 0.7, color: DGRAY, dashArray: [4, 3],
    })
    // C, E, G... — bottom of SECCIONS band (panel top level)
    page.drawText(BOT_LABELS[i], { x: x - 3, y: R.panelTop + 3, size: 7, font: fontBold, color: BLACK })
    // D, F, H... — top of SECCIONS band (seccio level)
    page.drawText(TOP_LABELS[i], { x: x - 3, y: R.seccio + 3,  size: 7, font: fontBold, color: BLACK })
  }

  // ── 2. Circuit data: potència (top), receptor name (receptors zone), seccio (seccions zone) ──
  for (let i = 0; i < slotCount; i++) {
    const c = circuits[i]
    const x = cx(i)

    // POTÈNCIA — rotated, toFixed(2) per alineació uniforme, baixat 15pt
    if (c.potencia_kw > 0) {
      page.drawText(`${c.potencia_kw.toFixed(2).replace('.', ',')} kW`, {
        x: x - 4, y: R.potencia - 15,
        size: 6.5, font, color: BLACK,
        rotate: degrees(90),
      })
    }

    // RECEPTOR NAME — RECEPTORS zone (above D labels), rotated vertical, left of line
    page.drawText(c.nom, {
      x: x - 4, y: R.seccio + 12,
      size: 7, font, color: BLACK,
      rotate: degrees(90),
    })

    // SECCIÓ DEL CABLE — pujada per separar-la de les lletres C/E/G
    page.drawText(c.seccio, {
      x: x - 4, y: R.panelTop + 15,
      size: 7, font, color: BLACK,
      rotate: degrees(90),
    })
  }

  // ── 3. Large outer panel rectangle (quadre) ───────────────────────────────
  page.drawRectangle({
    x: XCOL_LEFT, y: R.panelBot,
    width: XCOL_RIGHT - XCOL_LEFT,
    height: R.panelTop - R.panelBot,
    borderColor: BLACK, borderWidth: 1.4,
    color: rgb(1, 1, 1),
  })

  // ── PIA symbols + amperaje for each active circuit ──────────────────────────
  // Drawn between column bottom and panel top, matching Can Manel style
  const PIA_H = 18  // height of PIA symbol
  const PIA_Y_BOT = R.panelTop + 22               // bottom of PIA — clear of C/E/G labels
  const PIA_Y_TOP = PIA_Y_BOT + PIA_H             // top of PIA symbol

  for (let i = 0; i < slotCount; i++) {
    const c = circuits[i]
    const x = cx(i)

    // Line from column bottom to PIA top
    page.drawLine({ start: { x, y: R.colBot }, end: { x, y: PIA_Y_TOP }, thickness: 1, color: BLACK })

    // PIA symbol: circle (top terminal) + diagonal blade + circle (bottom terminal)
    const circR = 2
    page.drawCircle({ x, y: PIA_Y_TOP, size: circR, borderColor: BLACK, borderWidth: 0.9, color: rgb(1,1,1) })
    page.drawLine({
      start: { x: x - 3, y: PIA_Y_BOT + 4 },
      end:   { x: x + 3, y: PIA_Y_TOP - 4 },
      thickness: 1.1, color: BLACK,
    })
    page.drawCircle({ x, y: PIA_Y_BOT, size: circR, borderColor: BLACK, borderWidth: 0.9, color: rgb(1,1,1) })

    // Amperaje value to the right of the symbol
    if (c.pia_amperatge) {
      page.drawText(`${c.pia_amperatge}A`, {
        x: x + 4, y: PIA_Y_BOT + 6,
        size: 6, font: fontBold, color: BLACK,
      })
    }

    // Line from PIA bottom into panel
    page.drawLine({ start: { x, y: PIA_Y_BOT }, end: { x, y: R.panelTop }, thickness: 1, color: BLACK })
  }

  // ── 4. Differential group boxes inside the panel (dashed border) ──────────
  type GrupDif = { dif: Diferencial; idxs: number[] }
  const grups: GrupDif[] = diferencials
    .map((d) => ({
      dif: d,
      idxs: circuits.map((c, i) => c.diferencial_grup === d.id ? i : -1).filter((i) => i >= 0),
    }))
    .filter((g) => g.idxs.length > 0)

  for (const g of grups) {
    const xs     = g.idxs.map(cx)
    const xMin   = Math.min(...xs) - COL_W / 2
    const xMax   = Math.max(...xs) + COL_W / 2
    const xCtr   = (xMin + xMax) / 2
    const difH   = R.difTop - R.difBot

    // Dashed rectangle for this differential group
    page.drawRectangle({
      x: xMin + 2, y: R.difBot,
      width: xMax - xMin - 4, height: difH,
      borderColor: DGRAY, borderWidth: 0.8,
      color: rgb(1, 1, 1),
      // pdf-lib drawRectangle supports borderDashArray in some versions;
      // fallback: draw dashed border manually with 4 drawLine calls
    })
    // Overwrite border with dashed lines manually
    const bx = xMin + 2, by = R.difBot, bw = xMax - xMin - 4, bh = difH
    const dash = [4, 3]
    page.drawLine({ start: { x: bx,      y: by      }, end: { x: bx + bw, y: by      }, thickness: 0.8, color: DGRAY, dashArray: dash })
    page.drawLine({ start: { x: bx + bw, y: by      }, end: { x: bx + bw, y: by + bh }, thickness: 0.8, color: DGRAY, dashArray: dash })
    page.drawLine({ start: { x: bx + bw, y: by + bh }, end: { x: bx,      y: by + bh }, thickness: 0.8, color: DGRAY, dashArray: dash })
    page.drawLine({ start: { x: bx,      y: by + bh }, end: { x: bx,      y: by      }, thickness: 0.8, color: DGRAY, dashArray: dash })

    // Label
    page.drawText(`${g.dif.amperatge}A / ${g.dif.sensibilitat_ma}mA`, {
      x: xCtr - 18, y: R.difBot + difH / 2 - 3,
      size: 6, font: fontBold, color: BLACK,
    })

    // Solid lines from column inside panel down to each differential box
    for (const i of g.idxs) {
      const x = cx(i)
      page.drawLine({
        start: { x, y: R.panelTop },
        end:   { x, y: R.difTop   },
        thickness: 1, color: BLACK,
      })
      page.drawLine({
        start: { x, y: R.difBot    },
        end:   { x, y: R.panelBot  },
        thickness: 0.8, color: BLACK, dashArray: [3, 3],
      })
    }

    // Line from differential box center down to panel exit point
    page.drawLine({
      start: { x: xCtr, y: R.difBot   },
      end:   { x: xCtr, y: R.panelBot },
      thickness: 1.2, color: BLACK,
    })
  }

  // Bus horizontal inside panel (connects all differential centers)
  if (grups.length > 0) {
    const centers = grups.map((g) => {
      const xs = g.idxs.map(cx)
      return (Math.min(...xs) + Math.max(...xs)) / 2
    })
    page.drawLine({
      start: { x: Math.min(...centers, CENTER_X), y: R.panelBot },
      end:   { x: Math.max(...centers, CENTER_X), y: R.panelBot },
      thickness: 1.4, color: BLACK,
    })
  }

  // ── 5. Dashed trunk: panel exit → IGA ────────────────────────────────────
  page.drawLine({
    start: { x: CENTER_X, y: R.trunkExit },
    end:   { x: CENTER_X, y: R.igaTop    },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })

  // ── 6. IGA box with official circuit-breaker switch symbol ──────────────────
  // Official symbol: circle (top terminal) + diagonal blade line + circle (bottom terminal)
  // Matches IEC/UNE standard for "interruptor automàtic"
  const igaH = R.igaTop - R.igaBot
  const igaW = 26
  const igaCy = R.igaBot + igaH / 2

  page.drawRectangle({
    x: CENTER_X - igaW / 2, y: R.igaBot,
    width: igaW, height: igaH,
    borderColor: BLACK, borderWidth: 1.4,
    color: rgb(1, 1, 1),
  })
  // Top terminal circle (input)
  const topTermY = R.igaTop - 5
  const botTermY = R.igaBot + 5
  page.drawCircle({ x: CENTER_X, y: topTermY, size: 2.8, borderColor: BLACK, borderWidth: 1.2, color: rgb(1,1,1) })
  // Bottom terminal circle (output)
  page.drawCircle({ x: CENTER_X, y: botTermY, size: 2.8, borderColor: BLACK, borderWidth: 1.2, color: rgb(1,1,1) })
  // Switch blade: diagonal from bottom-left to upper-right (open position)
  // In official form: the blade goes from ~bottom-center up-right, like a "/" at ~60°
  page.drawLine({
    start: { x: CENTER_X - 3, y: botTermY + 2 },
    end:   { x: CENTER_X + 4, y: topTermY - 2  },
    thickness: 1.3, color: BLACK,
  })
  // IGA label
  page.drawText(`${iga}A`, { x: CENTER_X + igaW / 2 + 3, y: igaCy - 3, size: 7, font: fontBold, color: BLACK })

  // ── 7. Dashed trunk: IGA → ICP ───────────────────────────────────────────
  page.drawLine({
    start: { x: CENTER_X, y: R.igaBot  },
    end:   { x: CENTER_X, y: R.icpTop  },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })

  // ── 8. ICP box ───────────────────────────────────────────────────────────
  const icpW = 18
  const icpH = R.icpTop - R.icpBot
  page.drawRectangle({
    x: CENTER_X - icpW / 2, y: R.icpBot,
    width: icpW, height: icpH,
    borderColor: BLACK, borderWidth: 1.2,
    color: rgb(1, 1, 1),
  })

  // ── 9. Dashed trunk: ICP → kWh ───────────────────────────────────────────
  page.drawLine({
    start: { x: CENTER_X, y: R.icpBot  },
    end:   { x: CENTER_X, y: R.kwhTop  },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })

  // ── 10. kWh meter box ────────────────────────────────────────────────────
  const kwhW = 46
  const kwhH = R.kwhTop - R.kwhBot
  const kwhCy = R.kwhBot + kwhH / 2
  page.drawRectangle({
    x: CENTER_X - kwhW / 2, y: R.kwhBot,
    width: kwhW, height: kwhH,
    borderColor: BLACK, borderWidth: 1.2,
    color: rgb(1, 1, 1),
  })
  page.drawText('kWh', { x: CENTER_X - 9, y: kwhCy - 3, size: 8, font: fontBold, color: BLACK })

  // ── 11. Terra symbol (bottom-right of diagram) ────────────────────────────
  const tx = XCOL_RIGHT - 18
  const ty = R.terraBase
  page.drawLine({ start: { x: tx - 12, y: ty      }, end: { x: tx + 12, y: ty      }, thickness: 1.6, color: BLACK })
  page.drawLine({ start: { x: tx - 8,  y: ty -  5 }, end: { x: tx + 8,  y: ty -  5 }, thickness: 1.3, color: BLACK })
  page.drawLine({ start: { x: tx - 4,  y: ty - 10 }, end: { x: tx + 4,  y: ty - 10 }, thickness: 1.0, color: BLACK })
  // Short vertical connecting to kWh bottom
  page.drawLine({
    start: { x: CENTER_X, y: R.kwhBot },
    end:   { x: CENTER_X, y: ty + 5   },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })
  // Horizontal line from trunk to terra symbol
  page.drawLine({
    start: { x: CENTER_X, y: ty + 5 },
    end:   { x: tx,       y: ty + 5 },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })
  page.drawLine({
    start: { x: tx, y: ty + 5 },
    end:   { x: tx, y: ty     },
    thickness: 1.4, color: BLACK, dashArray: [5, 3],
  })

  return pdfDoc.save()
}
