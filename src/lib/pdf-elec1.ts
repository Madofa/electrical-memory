import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CertificatElec1 } from './supabase-elec1'
import type { Instalador } from '../types'
import type { Projecte } from './supabase-projectes'

// ── Coordenades pàgina 1 (origen: bottom-left, A4 portrait 595×842 pt) ──────
// Ajustar amb /dev/calibrar-elec1 si cal

// Box width for CP digits (5 individual boxes) — approx 14.5 pt each
const CP_BOX_W = 14.5

const P1 = {
  titular_nom:        { x: 92,    y: 704   },
  titular_nif:        { x: 486.7, y: 704.7 },
  titular_tipus_via:  { x: 90.7,  y: 664.7 },
  titular_nom_via:    { x: 180,   y: 664.7 },
  titular_numero:     { x: 522,   y: 666.7 },
  titular_bloc:       { x: 92,    y: 626   },
  titular_escala:     { x: 185.3, y: 624.7 },
  titular_pis:        { x: 286,   y: 625.3 },
  titular_porta:      { x: 388.7, y: 626   },
  titular_cp:         { x: 487,   y: 621   },  // ⚠️ pendent calibrar 1r dígit
  titular_poblacio:   { x: 90.7,  y: 589.3 },
  titular_tel:        { x: 317.3, y: 589.3 },
  titular_correu:     { x: 402.7, y: 589.3 },
  empresa_nom:        { x: 90.7,  y: 532   },
  empresa_rasic:      { x: 375.3, y: 533.3 },
  empresa_nif:        { x: 487.3, y: 494   },
  instalador_nom:     { x: 90.7,  y: 494   },
  instalador_cat:     { x: 374,   y: 494.7 },
  instalador_dni:     { x: 488,   y: 532.7 },
  empresa_cp:         { x: 487,   y: 510   },  // ⚠️ pendent calibrar (posició aproximada)
  empresa_tel:        { x: 319.3, y: 379.3 },
  empresa_correu:     { x: 404,   y: 378.7 },
  inst_tipus_via:     { x: 89.3,  y: 456   },
  inst_nom_via:       { x: 178,   y: 456.7 },
  inst_numero:        { x: 522,   y: 310.7 },
  inst_bloc:          { x: 90.7,  y: 268.7 },
  inst_escala:        { x: 186.7, y: 268   },
  inst_pis:           { x: 285.3, y: 267.3 },
  inst_porta:         { x: 386,   y: 268   },
  inst_cp:            { x: 487,   y: 268   },  // ⚠️ pendent calibrar 1r dígit
  inst_poblacio:      { x: 94.7,  y: 234   },
  chk_nova:           { x: 92.7,  y: 176.7 },
  chk_ampliacio:      { x: 151.3, y: 177.3 },
  chk_modificacio:    { x: 226,   y: 176.7 },
  cups:               { x: 386.7, y: 176.7 },
  opt_p1:             { x: 92,    y: 100.7 },
  opt_p2:             { x: 172,   y: 100.7 },
  opt_memoria:        { x: 251.3, y: 100   },
  us_installacio:     { x: 91.3,  y: 67.3  },
}

// ── Coordenades pàgina 2 ─────────────────────────────────────────────────────

const P2 = {
  potencia_max:        { x: 294,   y: 726.7 },
  calibre_cgp:         { x: 465.3, y: 727.3 },
  tensio:              { x: 137.3, y: 710    },
  iga_igm:             { x: 522,   y: 710    },
  num_circuits:        { x: 244,   y: 692.7  },
  seccio_lga:          { x: 390,   y: 692.7  },
  material_conductor:  { x: 518,   y: 691.3  },
  ubicacio_comptadors: { x: 430,   y: 676    },
  resist_conductors:   { x: 282,   y: 675.3  },
  aillament_terra:     { x: 286.7, y: 658.7  },
  resist_terra:        { x: 285.3, y: 642    },
  iga:                 { x: 284.7, y: 624.7  },
  opt_submin_si:       { x: 227.3, y: 606.7  },
  opt_submin_no:       { x: 262,   y: 607.3  },
  observacions:        { x: 94.7,  y: 457.3  },
  signatura_nom:       { x: 115.3, y: 544    },
  data_signatura:      { x: 400,   y: 388    },  // ⚠️ pendent calibrar
}

export async function generateElec1PDF(
  cert: CertificatElec1,
  instalador: Instalador,
  _projecte?: Projecte,
): Promise<Uint8Array> {
  const response = await fetch('/templates/elec1-flat.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-1')
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const BLACK = rgb(0, 0, 0)
  const FS = 8   // font size for regular fields

  const [embP1, embP2] = await pdfDoc.embedPdf(templateBytes, [0, 1])

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  const page1 = pdfDoc.addPage([595, 842])
  page1.drawPage(embP1, { x: 0, y: 0, width: 595, height: 842 })

  const nomEmpresa = instalador.empresa_nombre || instalador.nombre_completo
  const cifEmpresa = instalador.empresa_cif || instalador.dni_nie || ''
  const categoria = instalador.tipo === 'IBTE' ? 'Bàsica' : instalador.tipo === 'IBTM' ? 'Mitja' : (instalador.tipo || '')

  const d1 = (coord: { x: number; y: number }, text: string, fs = FS) => {
    if (!text) return
    page1.drawText(text, { x: coord.x, y: coord.y, size: fs, font, color: BLACK })
  }

  // Draw each digit of a CP (5 boxes) individually
  // Els 3 últims dígits tenen 2pt extra de separació respecte als 2 primers
  const drawCP1 = (coord: { x: number; y: number }, cp: string) => {
    cp.padEnd(5, ' ').split('').forEach((ch, i) => {
      if (!ch.trim()) return
      const extra = i >= 2 ? 2 : 0
      page1.drawText(ch, { x: coord.x + i * CP_BOX_W + 3 + extra, y: coord.y, size: FS, font, color: BLACK })
    })
  }

  // Titular
  d1(P1.titular_nom,        cert.titular_nom || '')
  d1(P1.titular_nif,        cert.titular_nif || '')
  d1(P1.titular_tipus_via,  cert.titular_tipus_via || '')
  d1(P1.titular_nom_via,    cert.titular_nom_via || '')
  d1(P1.titular_numero,     cert.titular_numero || '')
  d1(P1.titular_bloc,       cert.titular_bloc || '')
  d1(P1.titular_escala,     cert.titular_escala || '')
  d1(P1.titular_pis,        cert.titular_pis || '')
  d1(P1.titular_porta,      cert.titular_porta || '')
  drawCP1(P1.titular_cp,    cert.titular_cp || '')
  d1(P1.titular_poblacio,   cert.titular_poblacio || '')
  d1(P1.titular_tel,        cert.titular_telefon || '')
  d1(P1.titular_correu,     cert.titular_correu || '')

  // Empresa instal·ladora
  d1(P1.empresa_nom,        nomEmpresa)
  d1(P1.empresa_rasic,      instalador.numero_carnet || '')
  d1(P1.empresa_nif,        cifEmpresa)
  d1(P1.instalador_nom,     instalador.nombre_completo)
  d1(P1.instalador_cat,     categoria)
  d1(P1.instalador_dni,     instalador.dni_nie || '')
  drawCP1(P1.empresa_cp,    instalador.empresa_cp || '')
  d1(P1.empresa_tel,        instalador.empresa_telefono || '')
  d1(P1.empresa_correu,     instalador.empresa_email || '')

  // Instal·lació
  d1(P1.inst_tipus_via,     cert.inst_tipus_via || '')
  d1(P1.inst_nom_via,       cert.inst_nom_via || '')
  d1(P1.inst_numero,        cert.inst_numero || '')
  d1(P1.inst_bloc,          cert.inst_bloc || '')
  d1(P1.inst_escala,        cert.inst_escala || '')
  d1(P1.inst_pis,           cert.inst_pis || '')
  d1(P1.inst_porta,         cert.inst_porta || '')
  drawCP1(P1.inst_cp,       cert.inst_cp || '')
  d1(P1.inst_poblacio,      cert.inst_poblacio || '')

  // Tipus actuació (checkboxes)
  if (cert.tipus_actuacio === 'nova')        d1(P1.chk_nova,        'X')
  if (cert.tipus_actuacio === 'ampliacio')   d1(P1.chk_ampliacio,   'X')
  if (cert.tipus_actuacio === 'modificacio') d1(P1.chk_modificacio, 'X')
  d1(P1.cups, cert.cups || '')

  // Classificació
  if (cert.classificacio === 'p1')  d1(P1.opt_p1,      'X')
  if (cert.classificacio === 'p2')  d1(P1.opt_p2,      'X')
  if (cert.classificacio === 'mtd') d1(P1.opt_memoria, 'X')
  d1(P1.us_installacio, cert.us_installacio || '')

  // ── PAGE 2 ──────────────────────────────────────────────────────────────────
  const page2 = pdfDoc.addPage([595, 842])
  page2.drawPage(embP2, { x: 0, y: 0, width: 595, height: 842 })

  const d2 = (coord: { x: number; y: number }, text: string, fs = FS) => {
    if (!text) return
    page2.drawText(text, { x: coord.x, y: coord.y, size: fs, font, color: BLACK })
  }

  d2(P2.potencia_max,        cert.potencia_kw ? String(cert.potencia_kw) : '')
  d2(P2.calibre_cgp,         cert.calibre_fusibles_cgp_a ? String(cert.calibre_fusibles_cgp_a) : '')
  d2(P2.tensio,              cert.tensio_v || '')
  d2(P2.iga_igm,             cert.intensitat_iga_a ? String(cert.intensitat_iga_a) : '')
  d2(P2.num_circuits,        cert.num_circuits ? String(cert.num_circuits) : '')
  d2(P2.seccio_lga,          cert.seccio_lga_mm2 || '')
  d2(P2.material_conductor,  cert.material_conductor || '')
  d2(P2.ubicacio_comptadors, cert.ubicacio_comptadors || '')
  d2(P2.resist_conductors,   cert.resist_aillament_conductors_mt ? String(cert.resist_aillament_conductors_mt) : '')
  d2(P2.aillament_terra,     cert.resist_aillament_mt ? String(cert.resist_aillament_mt) : '')
  d2(P2.resist_terra,        cert.resist_terra_ohm ? String(cert.resist_terra_ohm) : '')
  d2(P2.iga,                 cert.intensitat_iga_a ? String(cert.intensitat_iga_a) : '')

  if (cert.te_subministrament_complementari) {
    d2(P2.opt_submin_si, 'X')
  } else {
    d2(P2.opt_submin_no, 'X')
  }

  d2(P2.observacions, cert.observacions || '')
  d2(P2.signatura_nom, instalador.nombre_completo)
  d2(P2.data_signatura, cert.data_signatura || '')

  return pdfDoc.save()
}
