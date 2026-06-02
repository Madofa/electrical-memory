import { inflate, deflate } from 'pako'
import type { CertificatElec1 } from './supabase-elec1'
import type { Instalador } from '../types'

function buildValues(cert: CertificatElec1, instalador: Instalador): Record<string, string> {
  const nomEmpresa = instalador.empresa_nombre || instalador.nombre_completo
  const cifEmpresa = instalador.empresa_cif || instalador.dni_nie || ''
  const categoria = instalador.tipo === 'IBTE' ? 'Bàsica' : instalador.tipo === 'IBTM' ? 'Mitja' : (instalador.tipo || '')

  return {
    'DATA.sTitular.NomCognoms': cert.titular_nom,
    'DATA.sTitular.NIF': cert.titular_nif,
    'DATA.sTitular.CBO_TipusVia': cert.titular_tipus_via,
    'DATA.sTitular.TXT_NomVia': cert.titular_nom_via,
    'DATA.sTitular.TXT_Num': cert.titular_numero,
    'DATA.sTitular.TXT_Bloc': cert.titular_bloc,
    'DATA.sTitular.TXT_Escala': cert.titular_escala,
    'DATA.sTitular.TXT_Pis': cert.titular_pis,
    'DATA.sTitular.TXT_Porta': cert.titular_porta,
    'DATA.sTitular.TXT_CodiPostal': cert.titular_cp,
    'DATA.sTitular.TXT_Poblacio': cert.titular_poblacio,
    'DATA.sTitular.TXT_Tel': cert.titular_telefon,
    'DATA.sTitular.TXT_Correu': cert.titular_correu,
    'DATA.sEmpresaIns.NomCognoms': nomEmpresa,
    'DATA.sEmpresaIns.TXT_Rasic': instalador.numero_carnet || '',
    'DATA.sEmpresaIns.NIF': cifEmpresa,
    'DATA.sEmpresaIns.NomCognomsInstalador': instalador.nombre_completo,
    'DATA.sEmpresaIns.TXT_Categoria': categoria,
    'DATA.sEmpresaIns.DNIInstallador': instalador.dni_nie || '',
    'DATA.sEmpresaIns.TXT_Tel': instalador.empresa_telefono || '',
    'DATA.sEmpresaIns.TXT_Correu': instalador.empresa_email || '',
    'DATA.sInstallacio.CBO_TipusVia': cert.inst_tipus_via,
    'DATA.sInstallacio.TXT_NomVia': cert.inst_nom_via,
    'DATA.sInstallacio.TXT_Num': cert.inst_numero,
    'DATA.sInstallacio.TXT_Bloc': cert.inst_bloc,
    'DATA.sInstallacio.TXT_Escala': cert.inst_escala,
    'DATA.sInstallacio.TXT_Pis': cert.inst_pis,
    'DATA.sInstallacio.TXT_Porta': cert.inst_porta,
    'DATA.sInstallacio.TXT_CodiPostal': cert.inst_cp,
    'DATA.sInstallacio.TXT_Poblacio': cert.inst_poblacio,
    'DATA.sCaracteristiques.TXT_CUPS': cert.cups,
    'DATA.sCaracteristiques.TXT_Us': cert.us_installacio,
    'DATA.sCaracteristiques.CHK_Nova': cert.tipus_actuacio === 'nova' ? '1' : '0',
    'DATA.sCaracteristiques.CHK_Ampliacio': cert.tipus_actuacio === 'ampliacio' ? '1' : '0',
    'DATA.sCaracteristiques.CHK_Modificacio': cert.tipus_actuacio === 'modificacio' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_P1': cert.classificacio === 'p1' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_P2': cert.classificacio === 'p2' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_Memoria': cert.classificacio === 'mtd' ? '1' : '0',
    'DATA.sTotes.TXT_PotenciaMax': cert.potencia_kw ? String(cert.potencia_kw) : '',
    'DATA.sTotes.TXT_Tensio': cert.tensio_v || '',
    'DATA.sTotes.TXT_Circuits': cert.num_circuits ? String(cert.num_circuits) : '',
    'DATA.sTotes.TXT_ResistenciaConductors': cert.resist_aillament_conductors_mt ? String(cert.resist_aillament_conductors_mt) : '',
    'DATA.sTotes.TXT_AillamentTerra': cert.resist_aillament_mt ? String(cert.resist_aillament_mt) : '',
    'DATA.sTotes.TXT_ResistenciaTerra': cert.resist_terra_ohm ? String(cert.resist_terra_ohm) : '',
    'DATA.sTotes.TXT_Interruptor': cert.intensitat_iga_a ? String(cert.intensitat_iga_a) : '',
    'DATA.sTotes.TXT_Calibre': cert.calibre_fusibles_cgp_a ? String(cert.calibre_fusibles_cgp_a) : '',
    'DATA.sTotes.TXT_SeccioLGA': cert.seccio_lga_mm2 || '',
    'DATA.sTotes.TXT_MaterialConductor': cert.material_conductor || '',
    'DATA.sTotes.TXT_UbicacioComptadors': cert.ubicacio_comptadors || '',
    'DATA.sTotes.OPT_Si': cert.te_subministrament_complementari ? '1' : '0',
    'DATA.sTotes.OPT_No': cert.te_subministrament_complementari ? '0' : '1',
    'DATA.sTotes.TXT_Observacions': cert.observacions || '',
  }
}

function findXfaStreamBounds(pdfBytes: Uint8Array): { dataStart: number; dataEnd: number } | null {
  const latin1 = new TextDecoder('latin1').decode(pdfBytes)
  let searchFrom = 0
  while (searchFrom < latin1.length) {
    const streamKeyword = latin1.indexOf('stream', searchFrom)
    if (streamKeyword === -1) break
    let dataStart = streamKeyword + 6
    if (latin1[dataStart] === '\r') dataStart++
    if (latin1[dataStart] !== '\n') { searchFrom = streamKeyword + 6; continue }
    dataStart++
    const dataEnd = latin1.indexOf('endstream', dataStart)
    if (dataEnd === -1) break
    try {
      const compressed = pdfBytes.slice(dataStart, dataEnd)
      const decompressed = inflate(compressed)
      const text = new TextDecoder('utf-8', { fatal: false }).decode(decompressed)
      if (text.includes('<xfa:data') || (text.includes('xfa:datasets') && text.length > 50000)) {
        return { dataStart, dataEnd }
      }
    } catch {
      // not deflate
    }
    searchFrom = dataEnd + 9
  }
  return null
}

function setValueAtPath(doc: Document, path: string, value: string): void {
  const parts = path.split('.')
  const allElements = doc.getElementsByTagName('*')
  let dataRoot: Element | null = null
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i]
    if (el.localName === 'data' && el.namespaceURI?.includes('xfa')) {
      dataRoot = el
      break
    }
  }
  if (!dataRoot) dataRoot = doc.documentElement
  let current: Element = dataRoot
  for (const part of parts) {
    let child: Element | null = null
    for (let i = 0; i < current.children.length; i++) {
      if (current.children[i].localName === part) { child = current.children[i]; break }
    }
    if (!child) {
      child = doc.createElementNS(current.namespaceURI, part)
      current.appendChild(child)
    }
    current = child
  }
  current.textContent = value
}

function updateStreamLength(latin1: string, dataStart: number, newByteLength: number): string {
  const lookback = latin1.slice(Math.max(0, dataStart - 500), dataStart)
  const lengthMatch = lookback.match(/\/Length\s+(\d+)/)
  if (!lengthMatch) return latin1
  const oldValue = lengthMatch[1]
  const relPos = lookback.lastIndexOf(`/Length ${oldValue}`) + '/Length '.length
  const absPos = Math.max(0, dataStart - 500) + relPos
  return latin1.slice(0, absPos) + String(newByteLength) + latin1.slice(absPos + oldValue.length)
}

export async function fillElec1Xfa(cert: CertificatElec1, instalador: Instalador): Promise<Uint8Array> {
  const response = await fetch('/templates/elec1-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-1')
  const pdfBytes = new Uint8Array(await response.arrayBuffer())
  const bounds = findXfaStreamBounds(pdfBytes)
  if (!bounds) throw new Error('Stream XFA no trobat al PDF')
  const compressed = pdfBytes.slice(bounds.dataStart, bounds.dataEnd)
  const xmlBytes = inflate(compressed)
  const xmlStr = new TextDecoder('utf-8').decode(xmlBytes)
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml')
  const values = buildValues(cert, instalador)
  for (const [path, value] of Object.entries(values)) {
    setValueAtPath(xmlDoc, path, value)
  }
  const serializer = new XMLSerializer()
  const modifiedXml = serializer.serializeToString(xmlDoc)
  const modifiedBytes = new TextEncoder().encode(modifiedXml)
  const recompressed = deflate(modifiedBytes)
  const latin1 = new TextDecoder('latin1').decode(pdfBytes)
  const updatedLatin1 = updateStreamLength(latin1, bounds.dataStart, recompressed.length)
  const encoder = new TextEncoder()
  const beforeStream = encoder.encode(updatedLatin1.slice(0, bounds.dataStart))
  const afterStream = encoder.encode(updatedLatin1.slice(bounds.dataEnd))
  const result = new Uint8Array(beforeStream.length + recompressed.length + afterStream.length)
  result.set(beforeStream, 0)
  result.set(recompressed, beforeStream.length)
  result.set(afterStream, beforeStream.length + recompressed.length)
  return result
}
