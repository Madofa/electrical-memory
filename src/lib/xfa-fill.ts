import { inflate, deflate } from 'pako'
import type { CertificatElec1 } from './supabase-elec1'
import type { Instalador } from '../types'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildXfaData(cert: CertificatElec1, instalador: Instalador): string {
  const nomEmpresa = instalador.empresa_nombre || instalador.nombre_completo
  const cifEmpresa = instalador.empresa_cif || instalador.dni_nie || ''
  const categoria = instalador.tipo === 'IBTE' ? 'Bàsica' : instalador.tipo === 'IBTM' ? 'Mitja' : (instalador.tipo || '')
  const nova     = cert.tipus_actuacio === 'nova'       ? '1' : '0'
  const ampliacio = cert.tipus_actuacio === 'ampliacio' ? '1' : '0'
  const modif    = cert.tipus_actuacio === 'modificacio'? '1' : '0'
  const p1 = cert.classificacio === 'p1'  ? '1' : '0'
  const p2 = cert.classificacio === 'p2'  ? '1' : '0'
  const mtd= cert.classificacio === 'mtd' ? '1' : '0'
  const optSi = cert.te_subministrament_complementari ? '1' : '0'
  const optNo = cert.te_subministrament_complementari ? '0' : '1'

  return (
`<xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">
<xfa:data>
<DATA>
<sTitular>
<NomCognoms>${esc(cert.titular_nom)}</NomCognoms>
<NIF>${esc(cert.titular_nif)}</NIF>
<CBO_TipusVia>${esc(cert.titular_tipus_via)}</CBO_TipusVia>
<TXT_NomVia>${esc(cert.titular_nom_via)}</TXT_NomVia>
<TXT_Num>${esc(cert.titular_numero)}</TXT_Num>
<TXT_Bloc>${esc(cert.titular_bloc)}</TXT_Bloc>
<TXT_Escala>${esc(cert.titular_escala)}</TXT_Escala>
<TXT_Pis>${esc(cert.titular_pis)}</TXT_Pis>
<TXT_Porta>${esc(cert.titular_porta)}</TXT_Porta>
<TXT_CodiPostal>${esc(cert.titular_cp)}</TXT_CodiPostal>
<TXT_Poblacio>${esc(cert.titular_poblacio)}</TXT_Poblacio>
<TXT_Tel>${esc(cert.titular_telefon)}</TXT_Tel>
<TXT_Correu>${esc(cert.titular_correu)}</TXT_Correu>
</sTitular>
<sEmpresaIns>
<NomCognoms>${esc(nomEmpresa)}</NomCognoms>
<TXT_Rasic>${esc(instalador.numero_carnet)}</TXT_Rasic>
<NIF>${esc(cifEmpresa)}</NIF>
<NomCognomsInstalador>${esc(instalador.nombre_completo)}</NomCognomsInstalador>
<TXT_Categoria>${esc(categoria)}</TXT_Categoria>
<DNIInstallador>${esc(instalador.dni_nie)}</DNIInstallador>
<TXT_Tel>${esc(instalador.empresa_telefono)}</TXT_Tel>
<TXT_Correu>${esc(instalador.empresa_email)}</TXT_Correu>
</sEmpresaIns>
<sInstallacio>
<CBO_TipusVia>${esc(cert.inst_tipus_via)}</CBO_TipusVia>
<TXT_NomVia>${esc(cert.inst_nom_via)}</TXT_NomVia>
<TXT_Num>${esc(cert.inst_numero)}</TXT_Num>
<TXT_Bloc>${esc(cert.inst_bloc)}</TXT_Bloc>
<TXT_Escala>${esc(cert.inst_escala)}</TXT_Escala>
<TXT_Pis>${esc(cert.inst_pis)}</TXT_Pis>
<TXT_Porta>${esc(cert.inst_porta)}</TXT_Porta>
<TXT_CodiPostal>${esc(cert.inst_cp)}</TXT_CodiPostal>
<TXT_Poblacio>${esc(cert.inst_poblacio)}</TXT_Poblacio>
</sInstallacio>
<sCaracteristiques>
<TXT_CUPS>${esc(cert.cups)}</TXT_CUPS>
<TXT_Us>${esc(cert.us_installacio)}</TXT_Us>
<CHK_Nova>${nova}</CHK_Nova>
<CHK_Ampliacio>${ampliacio}</CHK_Ampliacio>
<CHK_Modificacio>${modif}</CHK_Modificacio>
<OPT_P1>${p1}</OPT_P1>
<OPT_P2>${p2}</OPT_P2>
<OPT_Memoria>${mtd}</OPT_Memoria>
</sCaracteristiques>
<sTotes>
<TXT_PotenciaMax>${esc(cert.potencia_kw ? String(cert.potencia_kw) : '')}</TXT_PotenciaMax>
<TXT_Tensio>${esc(cert.tensio_v)}</TXT_Tensio>
<TXT_Circuits>${esc(cert.num_circuits ? String(cert.num_circuits) : '')}</TXT_Circuits>
<TXT_ResistenciaConductors>${esc(cert.resist_aillament_conductors_mt ? String(cert.resist_aillament_conductors_mt) : '')}</TXT_ResistenciaConductors>
<TXT_AillamentTerra>${esc(cert.resist_aillament_mt ? String(cert.resist_aillament_mt) : '')}</TXT_AillamentTerra>
<TXT_ResistenciaTerra>${esc(cert.resist_terra_ohm ? String(cert.resist_terra_ohm) : '')}</TXT_ResistenciaTerra>
<TXT_Interruptor>${esc(cert.intensitat_iga_a ? String(cert.intensitat_iga_a) : '')}</TXT_Interruptor>
<TXT_Calibre>${esc(cert.calibre_fusibles_cgp_a ? String(cert.calibre_fusibles_cgp_a) : '')}</TXT_Calibre>
<TXT_SeccioLGA>${esc(cert.seccio_lga_mm2)}</TXT_SeccioLGA>
<TXT_MaterialConductor>${esc(cert.material_conductor)}</TXT_MaterialConductor>
<TXT_UbicacioComptadors>${esc(cert.ubicacio_comptadors)}</TXT_UbicacioComptadors>
<OPT_Si>${optSi}</OPT_Si>
<OPT_No>${optNo}</OPT_No>
<TXT_Observacions>${esc(cert.observacions)}</TXT_Observacions>
</sTotes>
</DATA>
</xfa:data>
</xfa:datasets>`
  )
}

function findXfaStreamBounds(pdfBytes: Uint8Array): { dataStart: number; dataEnd: number } | null {
  const latin1 = new TextDecoder('latin1').decode(pdfBytes)
  let searchFrom = 0
  while (searchFrom < latin1.length) {
    const streamKeyword = latin1.indexOf('stream', searchFrom)
    if (streamKeyword === -1) break
    let dataStart = streamKeyword + 6
    if (latin1[dataStart] === '\r') dataStart++
    if (latin1[dataStart] === '\n') dataStart++
    const dataEnd = latin1.indexOf('endstream', dataStart)
    if (dataEnd === -1) break
    try {
      let trimEnd = dataEnd
      while (trimEnd > dataStart && (pdfBytes[trimEnd - 1] === 0x0A || pdfBytes[trimEnd - 1] === 0x0D)) trimEnd--
      const decompressed = inflate(pdfBytes.slice(dataStart, trimEnd))
      const text = new TextDecoder('utf-8', { fatal: false }).decode(decompressed)
      if (text.includes('xfa:datasets')) return { dataStart, dataEnd }
    } catch {
      // not deflate-compressed
    }
    searchFrom = dataEnd + 9
  }
  return null
}

function ascii(s: string): Uint8Array {
  return new Uint8Array(s.split('').map(c => c.charCodeAt(0)))
}

export async function fillElec1Xfa(cert: CertificatElec1, instalador: Instalador): Promise<Uint8Array> {
  const response = await fetch('/templates/elec1-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-1')
  const pdfBytes = new Uint8Array(await response.arrayBuffer())

  const bounds = findXfaStreamBounds(pdfBytes)
  if (!bounds) throw new Error('Stream XFA no trobat al PDF')

  // Build new XFA data as plain string — no DOM round-trip
  const newXml = buildXfaData(cert, instalador)
  const recompressed = deflate(new TextEncoder().encode(newXml))

  // Find original startxref (becomes /Prev) and object number
  const tail = new TextDecoder('latin1').decode(pdfBytes.slice(-200))
  const sxMatch = tail.match(/startxref\s+(\d+)/)
  const prevXref = sxMatch ? sxMatch[1] : '0'

  const lookback = new TextDecoder('latin1').decode(pdfBytes.slice(Math.max(0, bounds.dataStart - 300), bounds.dataStart))
  const allObjMatches = [...lookback.matchAll(/(\d+)\s+0\s+obj/g)]
  const objNum = allObjMatches.length > 0 ? allObjMatches[allObjMatches.length - 1][1] : '67'

  // Incremental update — original bytes untouched
  const sep       = ascii('\r\n')
  const newObjOffset = pdfBytes.length + sep.length
  const objHeader = ascii(`${objNum} 0 obj\r\n<</Filter[/FlateDecode]/Length ${recompressed.length}/Type/EmbeddedFile>>\r\nstream\r\n`)
  const objEnd    = ascii(`\r\nendstream\r\nendobj\r\n`)
  const xrefPos   = newObjOffset + objHeader.length + recompressed.length + objEnd.length
  const xrefEntry = `${String(newObjOffset).padStart(10, '0')} 00000 n\r\n`
  const xrefBlock = ascii(
    `xref\r\n${objNum} 1\r\n${xrefEntry}` +
    `trailer\r\n<</Size 75/Prev ${prevXref}>>\r\n` +
    `startxref\r\n${xrefPos}\r\n%%EOF\r\n`
  )

  const result = new Uint8Array(pdfBytes.length + sep.length + objHeader.length + recompressed.length + objEnd.length + xrefBlock.length)
  let off = 0
  result.set(pdfBytes,     off); off += pdfBytes.length
  result.set(sep,          off); off += sep.length
  result.set(objHeader,    off); off += objHeader.length
  result.set(recompressed, off); off += recompressed.length
  result.set(objEnd,       off); off += objEnd.length
  result.set(xrefBlock,    off)
  return result
}
