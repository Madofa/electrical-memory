# Official Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir els PDFs personalitzats d'ELEC-1, ELEC-2 i ELEC-3 per generació sobre els formularis oficials en blanc de la Generalitat.

**Architecture:** ELEC-1 via manipulació XML del stream XFA intern (pako); ELEC-2 via pdf-lib embedPdf del PDF escanejat + drawText/drawLine; ELEC-3 via pdf-lib AcroForm fill (o coordenades si la conversió no preserva camps). Els tres editors s'actualitzen per cridar les noves funcions en lloc de @react-pdf.

**Tech Stack:** React 19, TypeScript, Vite, pdf-lib (nou), pako (existent), Supabase.

---

## Mapa de fitxers

| Acció | Fitxer |
|---|---|
| Crear | `public/templates/elec1-blank.pdf` |
| Crear | `public/templates/elec2-blank.pdf` |
| Crear | `public/templates/elec3-blank.pdf` (Miguel: Word → PDF) |
| Crear | `src/lib/xfa-fill.ts` |
| Crear | `src/lib/pdf-elec2.ts` |
| Crear | `src/lib/pdf-elec3.ts` |
| Crear | `supabase/schema-elec3-v2.sql` |
| Modificar | `src/lib/elec3-calculs.ts` |
| Modificar | `src/lib/supabase-elec3.ts` |
| Modificar | `src/lib/supabase-elec1.ts` |
| Modificar | `src/pages/Elec1Editor.tsx` |
| Modificar | `src/pages/Elec3Editor.tsx` |
| Modificar | `src/pages/EsquemaUnifilarEditor.tsx` |
| Esborrar | `src/components/pdf/CertificatElec1PDF.tsx` |
| Esborrar | `src/components/pdf/EsquemaUnifilarPDF.tsx` |
| Esborrar | `src/components/pdf/Elec3PDF.tsx` |

---

## Task 1: Setup — Templates i pdf-lib

**Files:**
- Create: `public/templates/` (directory)
- Create: `public/templates/elec1-blank.pdf`
- Create: `public/templates/elec2-blank.pdf`
- Create: `public/templates/elec3-blank.pdf`

- [ ] **Step 1: Crear la carpeta de plantilles**

```bash
mkdir -p "public/templates"
```

- [ ] **Step 2: Copiar les plantilles oficials**

```bash
cp "Referencias nuevas Herramietnas/ELEC1CertificatInstalElectricaBT.pdf" public/templates/elec1-blank.pdf
cp "Referencias nuevas Herramietnas/EsquemaUnifilarELEC2.pdf" public/templates/elec2-blank.pdf
```

- [ ] **Step 3: Convertir MemoriaTecnicaELEC3.doc a PDF (pas manual)**

Miguel: obre `Referencias nuevas Herramietnas/MemoriaTecnicaELEC3.doc` a Word → Arxiu → Exportar → PDF → desa com `public/templates/elec3-blank.pdf`.

- [ ] **Step 4: Instal·lar pdf-lib**

```bash
cd "/Users/migueldelolmofuente/Antigravity/memoria eléctrica" && npm install pdf-lib
```

Expected: `pdf-lib` apareix a `package.json` dependencies.

- [ ] **Step 5: Verificar plantilles accessibles**

```bash
ls -lh public/templates/
```

Expected: 3 fitxers .pdf (elec1-blank ~141KB, elec2-blank ~84KB, elec3-blank variable).

- [ ] **Step 6: Commit setup**

```bash
git add public/templates/ package.json package-lock.json
git commit -m "feat: plantilles oficials + pdf-lib"
```

---

## Task 2: ELEC-1 — Afegir camps que falten al model

**Files:**
- Modify: `src/lib/supabase-elec1.ts`

El model `CertificatElec1` actual no té: `ubicacio_comptadors`, `te_subministrament_complementari`, ni camps d'adreça separats per a l'empresa instal·ladora.

- [ ] **Step 1: Afegir camps al tipus `CertificatElec1`**

A `src/lib/supabase-elec1.ts`, reemplaça la interfície `CertificatElec1`:

```typescript
export interface CertificatElec1 {
  id: string
  instalador_id: string
  nom: string
  titular_nom: string; titular_nif: string
  titular_tipus_via: string; titular_nom_via: string; titular_numero: string
  titular_bloc: string; titular_escala: string; titular_pis: string; titular_porta: string
  titular_cp: string; titular_poblacio: string; titular_telefon: string; titular_correu: string
  inst_tipus_via: string; inst_nom_via: string; inst_numero: string
  inst_bloc: string; inst_escala: string; inst_pis: string; inst_porta: string
  inst_cp: string; inst_poblacio: string
  tipus_actuacio: 'nova' | 'ampliacio' | 'modificacio'
  cups: string
  classificacio: 'p1' | 'p2' | 'mtd'
  us_installacio: string
  potencia_kw: number; tensio_v: string; seccio_lga_mm2: string; num_circuits: number
  calibre_fusibles_cgp_a: number; material_conductor: string
  resist_aillament_mt: number; resist_aillament_conductors_mt: number
  resist_terra_ohm: number; intensitat_iga_a: number
  ubicacio_comptadors: string          // NOU: 'Armari', 'Escala', 'Altra', ...
  te_subministrament_complementari: boolean  // NOU
  observacions: string; data_signatura: string
  estat: 'esborrany' | 'finalitzat'
  created_at: string; updated_at: string
}
```

- [ ] **Step 2: Afegir els nous camps a `emptyCertificat`**

```typescript
export function emptyCertificat(_instalador: Instalador | null): Omit<CertificatElec1, 'id' | 'instalador_id' | 'created_at' | 'updated_at'> {
  return {
    nom: '',
    titular_nom: '', titular_nif: '',
    titular_tipus_via: '', titular_nom_via: '', titular_numero: '',
    titular_bloc: '', titular_escala: '', titular_pis: '', titular_porta: '',
    titular_cp: '', titular_poblacio: '', titular_telefon: '', titular_correu: '',
    inst_tipus_via: '', inst_nom_via: '', inst_numero: '',
    inst_bloc: '', inst_escala: '', inst_pis: '', inst_porta: '',
    inst_cp: '', inst_poblacio: '',
    tipus_actuacio: 'nova',
    cups: '',
    classificacio: 'mtd',
    us_installacio: 'f) Instal·lacions d\'habitatges',
    potencia_kw: 0, tensio_v: '230', seccio_lga_mm2: '', num_circuits: 0,
    calibre_fusibles_cgp_a: 0, material_conductor: 'Coure',
    resist_aillament_mt: 0, resist_aillament_conductors_mt: 0,
    resist_terra_ohm: 0, intensitat_iga_a: 0,
    ubicacio_comptadors: 'Altra',
    te_subministrament_complementari: false,
    observacions: '',
    data_signatura: new Date().toISOString().split('T')[0],
    estat: 'esborrany',
  }
}
```

- [ ] **Step 3: Migració Supabase per als nous camps**

Executa al servidor Supabase:

```bash
SUPABASE_ACCESS_TOKEN=$(cat .env.supabase | grep SUPABASE_ACCESS_TOKEN | cut -d= -f2) \
  supabase db query --linked <<'SQL'
ALTER TABLE public.certificats_elec1
  ADD COLUMN IF NOT EXISTS ubicacio_comptadors text NOT NULL DEFAULT 'Altra',
  ADD COLUMN IF NOT EXISTS te_subministrament_complementari boolean NOT NULL DEFAULT false;
SQL
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase-elec1.ts
git commit -m "feat(elec1): afegir ubicacio_comptadors i te_subministrament_complementari"
```

---

## Task 3: ELEC-1 — xfa-fill.ts

**Files:**
- Create: `src/lib/xfa-fill.ts`

Aquesta funció localitza el stream XFA dins del PDF oficial, descomprimeix, modifica els valors dels camps, i reinjecta el stream.

- [ ] **Step 1: Crear `src/lib/xfa-fill.ts`**

```typescript
import { inflate, deflate } from 'pako'
import type { CertificatElec1 } from './supabase-elec1'
import type { Instalador } from '../types'

// Builds a flat map of XFA path → value from cert + instalador data.
// Paths use dot-notation: 'DATA.sTitular.NomCognoms'
function buildValues(cert: CertificatElec1, instalador: Instalador): Record<string, string> {
  const nomEmpresa = instalador.empresa_nombre || instalador.nombre_completo
  const cifEmpresa = instalador.empresa_cif || instalador.dni_nie || ''
  const categoria = instalador.tipo === 'IBTE' ? 'Bàsica' : instalador.tipo === 'IBTM' ? 'Mitja' : (instalador.tipo || '')

  return {
    // Titular
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

    // Empresa instal·ladora
    'DATA.sEmpresaIns.NomCognoms': nomEmpresa,
    'DATA.sEmpresaIns.TXT_Rasic': instalador.numero_carnet || '',
    'DATA.sEmpresaIns.NIF': cifEmpresa,
    'DATA.sEmpresaIns.NomCognomsInstalador': instalador.nombre_completo,
    'DATA.sEmpresaIns.TXT_Categoria': categoria,
    'DATA.sEmpresaIns.DNIInstallador': instalador.dni_nie || '',
    'DATA.sEmpresaIns.TXT_Tel': instalador.empresa_telefono || '',
    'DATA.sEmpresaIns.TXT_Correu': instalador.empresa_email || '',

    // Instal·lació
    'DATA.sInstallacio.CBO_TipusVia': cert.inst_tipus_via,
    'DATA.sInstallacio.TXT_NomVia': cert.inst_nom_via,
    'DATA.sInstallacio.TXT_Num': cert.inst_numero,
    'DATA.sInstallacio.TXT_Bloc': cert.inst_bloc,
    'DATA.sInstallacio.TXT_Escala': cert.inst_escala,
    'DATA.sInstallacio.TXT_Pis': cert.inst_pis,
    'DATA.sInstallacio.TXT_Porta': cert.inst_porta,
    'DATA.sInstallacio.TXT_CodiPostal': cert.inst_cp,
    'DATA.sInstallacio.TXT_Poblacio': cert.inst_poblacio,

    // Característiques
    'DATA.sCaracteristiques.TXT_CUPS': cert.cups,
    'DATA.sCaracteristiques.TXT_Us': cert.us_installacio,
    // Checkboxes: XFA stores '1' for checked, '0' for unchecked
    'DATA.sCaracteristiques.CHK_Nova': cert.tipus_actuacio === 'nova' ? '1' : '0',
    'DATA.sCaracteristiques.CHK_Ampliacio': cert.tipus_actuacio === 'ampliacio' ? '1' : '0',
    'DATA.sCaracteristiques.CHK_Modificacio': cert.tipus_actuacio === 'modificacio' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_P1': cert.classificacio === 'p1' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_P2': cert.classificacio === 'p2' ? '1' : '0',
    'DATA.sCaracteristiques.OPT_Memoria': cert.classificacio === 'mtd' ? '1' : '0',

    // Dades tècniques
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

// Finds the index of the XFA data stream within the PDF bytes.
// Returns { dataStart, dataEnd } byte offsets of the compressed stream content.
function findXfaStreamBounds(pdfBytes: Uint8Array): { dataStart: number; dataEnd: number } | null {
  const latin1 = new TextDecoder('latin1').decode(pdfBytes)
  let searchFrom = 0

  while (searchFrom < latin1.length) {
    const streamKeyword = latin1.indexOf('stream', searchFrom)
    if (streamKeyword === -1) break

    // stream must be followed by \r\n or \n
    let dataStart = streamKeyword + 6
    if (latin1[dataStart] === '\r') dataStart++
    if (latin1[dataStart] !== '\n') { searchFrom = streamKeyword + 6; continue }
    dataStart++ // skip \n

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
      // not a deflate stream
    }
    searchFrom = dataEnd + 9
  }
  return null
}

// Sets a value at a dot-path within an XML Document.
// Creates intermediate elements if they don't exist.
// Path example: 'DATA.sTitular.NomCognoms'
function setValueAtPath(doc: Document, path: string, value: string): void {
  const parts = path.split('.')

  // Find the xfa:data element as root (it wraps all form data)
  const allElements = doc.getElementsByTagName('*')
  let dataRoot: Element | null = null
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i]
    if (el.localName === 'data' && el.namespaceURI?.includes('xfa')) {
      dataRoot = el
      break
    }
  }
  // Fallback: use document root
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

// Updates the /Length entry for a stream object.
// Finds the /Length value before the stream and replaces it with newLength.
function updateStreamLength(latin1: string, dataStart: number, newByteLength: number): string {
  // Look back from dataStart for /Length
  const lookback = latin1.slice(Math.max(0, dataStart - 500), dataStart)
  const lengthMatch = lookback.match(/\/Length\s+(\d+)/)
  if (!lengthMatch) return latin1

  const oldValue = lengthMatch[1]
  const absPos = dataStart - 500 + lookback.lastIndexOf(`/Length ${oldValue}`) + '/Length '.length
  return latin1.slice(0, absPos) + String(newByteLength) + latin1.slice(absPos + oldValue.length)
}

export async function fillElec1Xfa(cert: CertificatElec1, instalador: Instalador): Promise<Uint8Array> {
  const response = await fetch('/templates/elec1-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-1')
  const pdfBytes = new Uint8Array(await response.arrayBuffer())

  const bounds = findXfaStreamBounds(pdfBytes)
  if (!bounds) throw new Error('Stream XFA no trobat al PDF')

  // Decompress the XFA stream
  const compressed = pdfBytes.slice(bounds.dataStart, bounds.dataEnd)
  const xmlBytes = inflate(compressed)
  const xmlStr = new TextDecoder('utf-8').decode(xmlBytes)

  // Parse, modify, serialize
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

  // Rebuild PDF bytes with the new stream content
  const latin1 = new TextDecoder('latin1').decode(pdfBytes)
  const encoder = new TextEncoder()
  const updatedLatin1 = updateStreamLength(latin1, bounds.dataStart, recompressed.length)

  const beforeStream = encoder.encode(updatedLatin1.slice(0, bounds.dataStart))
  const afterStream = encoder.encode(updatedLatin1.slice(bounds.dataEnd))

  const result = new Uint8Array(beforeStream.length + recompressed.length + afterStream.length)
  result.set(beforeStream, 0)
  result.set(recompressed, beforeStream.length)
  result.set(afterStream, beforeStream.length + recompressed.length)
  return result
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/xfa-fill.ts
git commit -m "feat(elec1): xfa-fill — omplir formulari oficial amb dades de l'usuari"
```

---

## Task 4: ELEC-1 — Actualitzar Elec1Editor

**Files:**
- Modify: `src/pages/Elec1Editor.tsx`

Canviar el botó "Exporta PDF" per cridar `fillElec1Xfa` en lloc de `@react-pdf`. Afegir els 2 camps nous al formulari.

- [ ] **Step 1: Substituir l'import de @react-pdf i CertificatElec1PDF**

A `src/pages/Elec1Editor.tsx`:

Elimina les línies:
```typescript
import { pdf } from '@react-pdf/renderer'
import { CertificatElec1PDF } from '../components/pdf/CertificatElec1PDF'
```

Afegeix:
```typescript
import { fillElec1Xfa } from '../lib/xfa-fill'
```

- [ ] **Step 2: Substituir la funció `handleExport`**

```typescript
const handleExport = async () => {
  if (!cert || !instalador) return
  setExporting(true)
  try {
    const pdfBytes = await fillElec1Xfa(cert, instalador)
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elec1_${(cert.nom || 'document').replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('PDF descarregat')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error en exportar')
  }
  setExporting(false)
}
```

- [ ] **Step 3: Afegir els 2 camps nous al formulari (secció Dades tècniques)**

Dins del bloc `{/* Dades tècniques */}`, afegeix una fila addicional al final del bloc:

```tsx
<div className="grid grid-cols-2 gap-4">
  <FormInput
    label="Ubicació de comptadors"
    value={cert.ubicacio_comptadors}
    onChange={(e) => upd('ubicacio_comptadors', e.target.value)}
    placeholder="Armari, Escala, Altra..."
  />
  <div className="flex flex-col gap-1.5">
    <label className="field-label">Subministrament complementari?</label>
    <div className="flex gap-4 mt-1">
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="radio"
          name="subministrament"
          checked={cert.te_subministrament_complementari === true}
          onChange={() => upd('te_subministrament_complementari', 'true')}
          className="accent-amber-500"
        /> Sí
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="radio"
          name="subministrament"
          checked={cert.te_subministrament_complementari === false}
          onChange={() => upd('te_subministrament_complementari', 'false')}
          className="accent-amber-500"
        /> No
      </label>
    </div>
  </div>
</div>
```

Nota: `upd` accepta `string | number`, però `te_subministrament_complementari` és `boolean`. Afegeix una conversió a la funció `upd` o usa un handler específic:

```typescript
const updBool = (field: keyof CertificatElec1, value: boolean) => {
  setCert((c) => c ? { ...c, [field]: value } : c)
  setDirty(true)
  if (timer.current) clearTimeout(timer.current)
  timer.current = setTimeout(async () => {
    if (!id) return
    setAutoSaving(true)
    try { await updateCertificatElec1(id, { [field]: value }); setDirty(false) }
    catch { toast.error('Error desant') }
    setAutoSaving(false)
  }, 2000)
}
```

I canvia els handlers del radio button per cridar `updBool('te_subministrament_complementari', true/false)`.

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 5: Esborrar CertificatElec1PDF.tsx**

```bash
rm src/components/pdf/CertificatElec1PDF.tsx
```

- [ ] **Step 6: Build check final**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Elec1Editor.tsx src/components/pdf/
git commit -m "feat(elec1): exportar PDF oficial XFA en lloc de @react-pdf"
```

---

## Task 5: ELEC-2 — pdf-elec2.ts

**Files:**
- Create: `src/lib/pdf-elec2.ts`

Carrega el PDF oficial (imatge escanejada), l'embeu com a fons amb pdf-lib, i dibuixa el diagrama + camps del peu.

**Nota sobre coordenades:** El PDF ELEC-2 és A4 portrait (595×842 pt, origen baix-esquerra). Les coordenades del peu s'han de calibrar visualment. Les que es donen aquí són aproximades i poden requerir un ajust de ±5pt.

- [ ] **Step 1: Crear `src/lib/pdf-elec2.ts`**

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Circuit, Diferencial, DadesCapcalera } from '../types/esquemaUnifilar'

// ── Coordenades del peu del formulari (A4 portrait, 595×842pt, origen baix-esq.) ──
// Mesurades sobre el formulari oficial. Ajustar si cal després del primer test.
const FOOTER = {
  // Fila EMPRESA DISTRIBUÏDORA / SECCIÓ CONNEXIÓ / TENSIÓ
  empresaDist:      { x: 12,  y: 135, maxW: 140 },
  seccioConnexio:   { x: 175, y: 135, maxW: 115 },
  tensio:           { x: 315, y: 135, maxW: 75  },
  // Fila EMPLAÇAMENT
  emplacament:      { x: 12,  y: 108, maxW: 370 },
  // Fila INSTAL·LADOR AUTORITZAT
  installador:      { x: 12,  y: 80,  maxW: 370 },
  // Fila TITULAR
  titular:          { x: 12,  y: 52,  maxW: 370 },
  // DATA I SIGNATURA (part dreta)
  dataSignatura:    { x: 418, y: 20,  maxW: 160 },
}

// ── Zona de dibuix del diagrama (entre el peu i la part superior) ──
const DIAGRAM = {
  xLeft:    88,   // marge esquerre (on comencen les columnes de circuits)
  xRight:   585,  // marge dret
  yBottom:  162,  // y on comença la zona (just sobre el peu)
  yTop:     830,  // y màxima de la zona

  // Files de la zona de dibuix (y des del bas)
  yPotencia:     780,
  yReceptorTop:  740,
  yReceptorBot:  660,
  ySeccio:       635,
  yPiaTop:       610,
  yPiaBot:       570,
  yDifTop:       545,
  yDifBot:       505,
  yBus:          480,
  yIgaTop:       455,
  yIgaBot:       415,
  yIcpTop:       395,
  yIcpBot:       360,
  yCompTop:      340,
  yCompBot:      300,
  yTerraTop:     285,
  yTerraBot:     262,
}

function colX(circuits: Circuit[], index: number): number {
  const n = Math.min(circuits.length, 12)
  const colW = (DIAGRAM.xRight - DIAGRAM.xLeft) / Math.max(n, 1)
  return DIAGRAM.xLeft + colW * index + colW / 2
}

export async function generateElec2PDF(
  circuits: Circuit[],
  diferencials: Diferencial[],
  iga: number,
  capcalera: DadesCapcalera,
): Promise<Uint8Array> {
  // 1. Cargar la plantilla oficial
  const response = await fetch('/templates/elec2-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-2')
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  // 2. Crear document nou i embebre la plantilla com a fons
  const pdfDoc = await PDFDocument.create()
  const [embeddedPage] = await pdfDoc.embedPdf(templateBytes, [0])
  const page = pdfDoc.addPage([595, 842])
  page.drawPage(embeddedPage, { x: 0, y: 0, width: 595, height: 842 })

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const BLACK = rgb(0, 0, 0)
  const FS = 7.5  // font size per als camps del peu

  // 3. Omplir camps del peu
  const drawField = (text: string, x: number, y: number, maxW: number, bold = false) => {
    if (!text) return
    page.drawText(text.slice(0, 60), {
      x, y,
      size: FS,
      font: bold ? fontBold : font,
      color: BLACK,
      maxWidth: maxW,
    })
  }

  drawField(capcalera.empresa_distribuidora, FOOTER.empresaDist.x, FOOTER.empresaDist.y, FOOTER.empresaDist.maxW)
  drawField(capcalera.seccio_connexio, FOOTER.seccioConnexio.x, FOOTER.seccioConnexio.y, FOOTER.seccioConnexio.maxW)
  drawField(capcalera.tensio, FOOTER.tensio.x, FOOTER.tensio.y, FOOTER.tensio.maxW)
  drawField(capcalera.emplacament, FOOTER.emplacament.x, FOOTER.emplacament.y, FOOTER.emplacament.maxW)
  drawField(capcalera.titular, FOOTER.titular.x, FOOTER.titular.y, FOOTER.titular.maxW)

  // 4. Dibuixar el diagrama de circuits
  const slotCount = Math.min(circuits.length, 12)
  const cx = (DIAGRAM.xLeft + DIAGRAM.xRight) / 2  // centre per a IGA/ICP/Comptador

  // Columnes de circuits
  for (let i = 0; i < slotCount; i++) {
    const c = circuits[i]
    const x = colX(circuits, i)

    // Potència
    if (c.potencia_kw > 0) {
      page.drawText(String(c.potencia_kw), { x: x - 8, y: DIAGRAM.yPotencia, size: 7, font, color: BLACK })
    }

    // Nom receptor (horitzontal, truncat a 10 chars)
    const nom = c.nom.slice(0, 10)
    page.drawText(nom, { x: x - 12, y: DIAGRAM.yReceptorTop, size: 6, font, color: BLACK })

    // Secció
    page.drawText(c.seccio, { x: x - 10, y: DIAGRAM.ySeccio, size: 6.5, font, color: BLACK })

    // Línia vertical fins al PIA
    page.drawLine({ start: { x, y: DIAGRAM.ySeccio - 5 }, end: { x, y: DIAGRAM.yPiaTop }, thickness: 1, color: BLACK })

    // Símbol PIA (rectangle amb línia diagonal)
    page.drawRectangle({ x: x - 6, y: DIAGRAM.yPiaBot, width: 12, height: DIAGRAM.yPiaTop - DIAGRAM.yPiaBot, borderColor: BLACK, borderWidth: 1, color: rgb(1, 1, 1) })
    page.drawLine({ start: { x: x - 4, y: DIAGRAM.yPiaBot + 4 }, end: { x: x + 4, y: DIAGRAM.yPiaTop - 4 }, thickness: 1, color: BLACK })
    page.drawText(String(c.pia_amperatge), { x: x + 8, y: DIAGRAM.yPiaBot + 8, size: 6.5, font, color: BLACK })

    // Línia cap al bus diferencial
    page.drawLine({ start: { x, y: DIAGRAM.yPiaBot }, end: { x, y: DIAGRAM.yDifTop }, thickness: 1, color: BLACK })
  }

  // Diferencials
  type GrupDif = { dif: Diferencial; circuitIdxs: number[] }
  const grups: GrupDif[] = diferencials
    .map((d) => ({
      dif: d,
      circuitIdxs: circuits.map((c, i) => c.diferencial_grup === d.id ? i : -1).filter((i) => i >= 0),
    }))
    .filter((g) => g.circuitIdxs.length > 0)

  for (const g of grups) {
    const xs = g.circuitIdxs.map((i) => colX(circuits, i))
    const xMin = Math.min(...xs) - 10
    const xMax = Math.max(...xs) + 10
    const xCtr = (xMin + xMax) / 2

    page.drawRectangle({
      x: xMin, y: DIAGRAM.yDifBot,
      width: xMax - xMin, height: DIAGRAM.yDifTop - DIAGRAM.yDifBot,
      borderColor: BLACK, borderWidth: 1.2, color: rgb(1, 1, 1),
    })
    page.drawText(`${g.dif.amperatge}A/${g.dif.sensibilitat_ma}mA`, {
      x: xCtr - 16, y: (DIAGRAM.yDifTop + DIAGRAM.yDifBot) / 2 - 3,
      size: 6.5, font: fontBold, color: BLACK,
    })
    page.drawLine({ start: { x: xCtr, y: DIAGRAM.yDifBot }, end: { x: xCtr, y: DIAGRAM.yBus }, thickness: 1.2, color: BLACK })
  }

  // Bus horitzontal (connecta tots els diferencials)
  if (grups.length > 0) {
    const allCenters = grups.map((g) => {
      const xs = g.circuitIdxs.map((i) => colX(circuits, i))
      return (Math.min(...xs) + Math.max(...xs)) / 2
    })
    const busXMin = Math.min(...allCenters, cx)
    const busXMax = Math.max(...allCenters, cx)
    page.drawLine({ start: { x: busXMin, y: DIAGRAM.yBus }, end: { x: busXMax, y: DIAGRAM.yBus }, thickness: 1.6, color: BLACK })
  }

  // IGA
  page.drawLine({ start: { x: cx, y: DIAGRAM.yBus }, end: { x: cx, y: DIAGRAM.yIgaTop }, thickness: 1.6, color: BLACK })
  page.drawRectangle({ x: cx - 10, y: DIAGRAM.yIgaBot, width: 20, height: DIAGRAM.yIgaTop - DIAGRAM.yIgaBot, borderColor: BLACK, borderWidth: 1.6, color: rgb(1, 1, 1) })
  page.drawLine({ start: { x: cx - 6, y: DIAGRAM.yIgaBot + 6 }, end: { x: cx + 6, y: DIAGRAM.yIgaTop - 6 }, thickness: 1.4, color: BLACK })
  page.drawText(`${iga}A`, { x: cx + 13, y: (DIAGRAM.yIgaTop + DIAGRAM.yIgaBot) / 2 - 3, size: 7, font: fontBold, color: BLACK })

  // ICP (caixa de punts)
  page.drawLine({ start: { x: cx, y: DIAGRAM.yIgaBot }, end: { x: cx, y: DIAGRAM.yIcpTop }, thickness: 1.6, color: BLACK })
  page.drawRectangle({ x: cx - 20, y: DIAGRAM.yIcpBot, width: 40, height: DIAGRAM.yIcpTop - DIAGRAM.yIcpBot, borderColor: BLACK, borderWidth: 1.2, color: rgb(1, 1, 1), dashArray: [3, 2] })

  // Comptador
  page.drawLine({ start: { x: cx, y: DIAGRAM.yIcpBot }, end: { x: cx, y: DIAGRAM.yCompTop }, thickness: 1.6, color: BLACK })
  const compCy = (DIAGRAM.yCompTop + DIAGRAM.yCompBot) / 2
  const compR = (DIAGRAM.yCompTop - DIAGRAM.yCompBot) / 2
  page.drawCircle({ x: cx, y: compCy, size: compR, borderColor: BLACK, borderWidth: 1.4, color: rgb(1, 1, 1) })
  page.drawText('kWh', { x: cx - 8, y: compCy - 3, size: 6.5, font: fontBold, color: BLACK })

  // Terra
  page.drawLine({ start: { x: cx, y: DIAGRAM.yCompBot }, end: { x: cx, y: DIAGRAM.yTerraTop }, thickness: 1.4, color: BLACK })
  page.drawLine({ start: { x: cx - 10, y: DIAGRAM.yTerraTop }, end: { x: cx + 10, y: DIAGRAM.yTerraTop }, thickness: 1.6, color: BLACK })
  page.drawLine({ start: { x: cx - 6, y: DIAGRAM.yTerraTop - 5 }, end: { x: cx + 6, y: DIAGRAM.yTerraTop - 5 }, thickness: 1.4, color: BLACK })
  page.drawLine({ start: { x: cx - 2, y: DIAGRAM.yTerraBot }, end: { x: cx + 2, y: DIAGRAM.yTerraBot }, thickness: 1.2, color: BLACK })

  return pdfDoc.save()
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf-elec2.ts
git commit -m "feat(elec2): pdf-lib sobre formulari oficial escanejat"
```

---

## Task 6: ELEC-2 — Actualitzar EsquemaUnifilarEditor

**Files:**
- Modify: `src/pages/EsquemaUnifilarEditor.tsx`

- [ ] **Step 1: Substituir imports**

A `src/pages/EsquemaUnifilarEditor.tsx`, elimina:
```typescript
import { pdf } from '@react-pdf/renderer'
import { EsquemaUnifilarPDF } from '../components/pdf/EsquemaUnifilarPDF'
```

Afegeix:
```typescript
import { generateElec2PDF } from '../lib/pdf-elec2'
```

- [ ] **Step 2: Substituir la funció `handleExport` (o equivalent)**

Localitza la funció que usa `pdf(<EsquemaUnifilarPDF .../>)` i substitueix-la per:

```typescript
const handleExport = async () => {
  setExporting(true)
  try {
    const pdfBytes = await generateElec2PDF(
      esquema.circuits,
      esquema.diferencials,
      esquema.iga_amperatge,
      esquema.capcalera,
    )
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elec2_${(esquema.nom || 'unifilar').replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('PDF descarregat')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error en exportar')
  }
  setExporting(false)
}
```

- [ ] **Step 3: Esborrar EsquemaUnifilarPDF.tsx**

```bash
rm src/components/pdf/EsquemaUnifilarPDF.tsx
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EsquemaUnifilarEditor.tsx src/components/pdf/EsquemaUnifilarPDF.tsx
git commit -m "feat(elec2): exportar sobre formulari oficial en lloc de @react-pdf"
```

---

## Task 7: ELEC-3 — Actualitzar el model de dades

**Files:**
- Modify: `src/lib/elec3-calculs.ts`
- Modify: `src/lib/supabase-elec3.ts`
- Create: `supabase/schema-elec3-v2.sql`

El formulari oficial ELEC-3 té exactament 13 files fixes (1 derivació individual + 12 derivacions C-D a Y-Z) i 19 columnes. Cal canviar el model de trams lliures a slots fixos i afegir 9 camps nous.

- [ ] **Step 1: Actualitzar `src/lib/elec3-calculs.ts`**

Substitueix el contingut complet per:

```typescript
// Càlculs de caiguda de tensió per tram (REBT ITC-BT-19)

export type Material = 'coure' | 'alumini'
export type TipusCorrent = 'mono' | 'tri'

export interface Tram {
  id: string                         // slot fix: 'derivacio_individual' | 'C_D' | 'E_F' | ...
  nom: string                        // etiqueta fixa: 'Derivació individual (A — B)', 'C — D', ...
  carrega_pct: number
  potencia_kw: number
  cos_fi: number
  seccio_mm2: number
  longitud_m: number
  material: Material
  tipus: TipusCorrent
  tensio_v?: number
  // 9 camps nous (formulari oficial)
  tipus_conductor: 'Cu' | 'Al'
  tensio_nominal_aillament: string    // ex: "0,45/0,75"
  canal_sense_tub: string            // sistema sense tub, ex: "B"
  canal_tub_encastat_mm: number | null
  canal_tub_sense_encas_mm: number | null
  canal_enterrat_prof_m: number | null
  aillament_instal_kohm: number | null
  conduc_neutre_mm2: number | null
  conduc_protec_mm2: number | null
}

export interface TramCalculat extends Tram {
  potencia_demanada_kw: number
  intensitat_a: number
  moment_kwm: number
  caiguda_parcial_pct: number
  caiguda_total_pct: number
  ok: boolean
}

// Slots fixos del formulari oficial (ordre i etiquetes immutables)
export const FIXED_SLOTS = [
  { id: 'derivacio_individual', label: 'Derivació individual (A — B)' },
  { id: 'C_D',  label: 'C — D' },
  { id: 'E_F',  label: 'E — F' },
  { id: 'G_H',  label: 'G — H' },
  { id: 'I_J',  label: 'I — J' },
  { id: 'K_L',  label: 'K — L' },
  { id: 'M_N',  label: 'M — N' },
  { id: 'O_P',  label: 'O — P' },
  { id: 'Q_R',  label: 'Q — R' },
  { id: 'S_T',  label: 'S — T' },
  { id: 'U_V',  label: 'U — V' },
  { id: 'W_X',  label: 'W — X' },
  { id: 'Y_Z',  label: 'Y — Z' },
] as const

export type SlotId = typeof FIXED_SLOTS[number]['id']

function tramDefaults(id: SlotId, label: string): Tram {
  return {
    id, nom: label,
    carrega_pct: 100, potencia_kw: 0, cos_fi: 0.9,
    seccio_mm2: id === 'derivacio_individual' ? 10 : 2.5,
    longitud_m: 0,
    material: 'coure', tipus: 'mono',
    tipus_conductor: 'Cu',
    tensio_nominal_aillament: '0,45/0,75',
    canal_sense_tub: '', canal_tub_encastat_mm: null,
    canal_tub_sense_encas_mm: null, canal_enterrat_prof_m: null,
    aillament_instal_kohm: null, conduc_neutre_mm2: null, conduc_protec_mm2: null,
  }
}

// Crea els 13 trams fixos en blanc per a un document nou
export function initTrams(): Tram[] {
  return FIXED_SLOTS.map((s) => tramDefaults(s.id, s.label))
}

// Retrocompatibilitat per a docs antics amb trams lliures:
// mapeja els trams existents als slots fixos per ordre
export function migrateTrams(existing: Tram[]): Tram[] {
  return FIXED_SLOTS.map((s, i) => {
    const old = existing[i]
    if (!old) return tramDefaults(s.id, s.label)
    return {
      ...tramDefaults(s.id, s.label),
      ...old,
      id: s.id,
      nom: s.label,
    }
  })
}

const GAMMA: Record<Material, number> = { coure: 56, alumini: 35 }
const LIMIT_PCT = 5

export function calculaTrams(trams: Tram[]): TramCalculat[] {
  let acumulat = 0
  return trams.map((t) => {
    const U = t.tensio_v ?? (t.tipus === 'mono' ? 230 : 400)
    const gamma = GAMMA[t.material]
    const cosfi = Math.max(t.cos_fi || 0.001, 0.001)
    const pot = t.potencia_kw * (t.carrega_pct / 100)
    const I = t.tipus === 'mono'
      ? (pot * 1000) / (U * cosfi)
      : (pot * 1000) / (Math.sqrt(3) * U * cosfi)
    const moment = pot * t.longitud_m
    const dU = t.tipus === 'mono'
      ? (200000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)
      : (100000 * pot * t.longitud_m) / (gamma * t.seccio_mm2 * U * U * cosfi)
    acumulat += dU
    return {
      ...t,
      potencia_demanada_kw: round2(pot),
      intensitat_a: round2(I),
      moment_kwm: round2(moment),
      caiguda_parcial_pct: round2(dU),
      caiguda_total_pct: round2(acumulat),
      ok: acumulat <= LIMIT_PCT,
    }
  })
}

function round2(v: number) { return Math.round(v * 100) / 100 }

// Mantenim tramDerivacioIndividual per retrocompatibilitat però ja no s'usa per crear
export function tramDerivacioIndividual(): Tram {
  return tramDefaults('derivacio_individual', 'Derivació individual (A — B)')
}
```

- [ ] **Step 2: Actualitzar `src/lib/supabase-elec3.ts`** — afegir camps de pàgina 2 a `Elec3Doc`

```typescript
export interface Elec3Doc {
  id: string
  instalador_id: string
  nom: string
  trams: Tram[]
  estat: 'esborrany' | 'finalitzat'
  // Camps de la pàgina 2 del formulari oficial
  us_installacio: string           // ex: "Vivenda Elevada"
  empresa_distribuidora: string
  nova_ampliacio_reforma: 'nova' | 'ampliacio' | 'reforma'
  resist_terra_ohm: number | null
  potencia_instal_kw: number | null
  intensitat_iga_a: number | null
  superficie_local_m2: number | null
  created_at: string
  updated_at: string
}
```

Actualitza `createElec3Doc` per incloure els valors per defecte dels camps nous i usa `initTrams()`:

```typescript
import { initTrams } from './elec3-calculs'

export async function createElec3Doc(
  instaladorId: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillElec3(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      nom: '',
      trams: initTrams(),
      estat: 'esborrany',
      us_installacio: 'Vivenda Elevada',
      empresa_distribuidora: '',
      nova_ampliacio_reforma: 'nova',
      resist_terra_ohm: null,
      potencia_instal_kw: null,
      intensitat_iga_a: null,
      superficie_local_m2: null,
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  return (data![0] as { id: string }).id
}
```

- [ ] **Step 3: Crear `supabase/schema-elec3-v2.sql`**

```sql
-- Migració ELEC-3 v2: 9 nous camps als trams (jsonb) + 6 camps de pàgina 2

-- Els trams es guarden com JSONB, els nous camps s'hi afegiran automàticament
-- quan es guardin nous documents. Els documents antics es migren a l'editor
-- via migrateTrams() al carregar.

-- Nous camps a nivell de document (pàgina 2 del formulari)
ALTER TABLE public.calculs_elec3
  ADD COLUMN IF NOT EXISTS us_installacio           text NOT NULL DEFAULT 'Vivenda Elevada',
  ADD COLUMN IF NOT EXISTS empresa_distribuidora    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nova_ampliacio_reforma   text NOT NULL DEFAULT 'nova'
    CHECK (nova_ampliacio_reforma IN ('nova', 'ampliacio', 'reforma')),
  ADD COLUMN IF NOT EXISTS resist_terra_ohm         numeric,
  ADD COLUMN IF NOT EXISTS potencia_instal_kw       numeric,
  ADD COLUMN IF NOT EXISTS intensitat_iga_a         numeric,
  ADD COLUMN IF NOT EXISTS superficie_local_m2      numeric;
```

- [ ] **Step 4: Executar la migració**

```bash
SUPABASE_ACCESS_TOKEN=$(cat .env.supabase | grep SUPABASE_ACCESS_TOKEN | cut -d= -f2) \
  supabase db query --linked -f supabase/schema-elec3-v2.sql
```

Expected: sortida sense errors.

- [ ] **Step 5: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/lib/elec3-calculs.ts src/lib/supabase-elec3.ts supabase/schema-elec3-v2.sql
git commit -m "feat(elec3): model de dades — slots fixos, 9 nous camps de tram, 6 camps pàgina 2"
```

---

## Task 8: ELEC-3 — Actualitzar Elec3Editor

**Files:**
- Modify: `src/pages/Elec3Editor.tsx`

Els canvis principals: eliminar add/remove tram (files fixes), afegir columnes noves a la taula, afegir secció de dades de pàgina 2, aplicar `migrateTrams()` en carregar.

- [ ] **Step 1: Actualitzar imports i afegir migrateTrams al useEffect**

A `src/pages/Elec3Editor.tsx`:

```typescript
import { calculaTrams, migrateTrams, type Tram, type TramCalculat } from '../lib/elec3-calculs'
```

Al `useEffect`, després de `setDoc(data as Elec3Doc)`, afegeix la migració:

```typescript
getElec3Doc(id).then(({ data, error }) => {
  if (!mounted) return
  if (error || !data) { toast.error('Document no trobat'); navigate('/elec3'); return }
  const doc = data as Elec3Doc
  // Migrar trams antics a slots fixos si cal
  if (doc.trams.length !== 13 || doc.trams[0]?.id !== 'derivacio_individual') {
    doc.trams = migrateTrams(doc.trams)
  }
  setDoc(doc)
  setLoading(false)
  // ... resta del codi existent
})
```

- [ ] **Step 2: Eliminar `addTram` i `removeTram`, actualitzar `updTram`**

Elimina completament les funcions `addTram()` i `removeTram()`.

Canvia `updTram` per acceptar tots els camps de `Tram`:

```typescript
const updTram = (tramId: string, field: keyof Tram, value: string | number | null) => {
  setDoc((d) => {
    if (!d) return d
    const trams = d.trams.map((t) => t.id === tramId ? { ...t, [field]: value } : t)
    save(trams)
    setDirty(true)
    return { ...d, trams }
  })
}
```

- [ ] **Step 3: Afegir `updDoc` per als camps de pàgina 2**

```typescript
const updDoc = (field: keyof Elec3Doc, value: string | number | null) => {
  setDoc((d) => d ? { ...d, [field]: value } : d)
  setDirty(true)
  if (timer.current) clearTimeout(timer.current)
  timer.current = setTimeout(async () => {
    if (!id) return
    setAutoSaving(true)
    try { await updateElec3Doc(id, { [field]: value as never }); setDirty(false) }
    catch { toast.error('Error desant') }
    setAutoSaving(false)
  }, 2000)
}
```

- [ ] **Step 4: Actualitzar la capçalera de la taula — afegir 9 columnes noves**

Substitueix el div de la capçalera de la taula per:

```tsx
<div className="grid text-[9px] font-display font-semibold tracking-widest uppercase text-amber-500/60 border-b border-amber-500/20 pb-1.5 mb-1"
  style={{ gridTemplateColumns: '2fr 0.5fr 0.7fr 0.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.6fr 0.7fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr' }}>
  <span>Tram</span>
  <span className="text-right">Càrg %</span>
  <span className="text-right">Pot kW</span>
  <span className="text-right">cos φ</span>
  <span className="text-right">Int A</span>
  <span>Secc mm²</span>
  <span className="text-right">Long m</span>
  <span className="text-right">Moment</span>
  <span className="text-right">ΔU parc%</span>
  <span className="text-right">ΔU tot%</span>
  <span>Tipus</span>
  <span>Aïll.</span>
  <span className="text-right">S.tub enc</span>
  <span className="text-right">S.tub s/enc</span>
  <span className="text-right">Enter. m</span>
  <span className="text-right">Aïll kΩ</span>
  <span className="text-right">Neutre</span>
  <span className="text-right">Protec</span>
</div>
```

- [ ] **Step 5: Actualitzar les files de la taula — eliminar botó esborrar, nom fix, afegir 9 camps**

Substitueix el `trams.map(...)` per:

```tsx
{trams.map((t) => (
  <div
    key={t.id}
    className={`grid items-center gap-0.5 py-1 border-b border-ink-600/30 ${!t.ok ? 'bg-red-950/20' : ''}`}
    style={{ gridTemplateColumns: '2fr 0.5fr 0.7fr 0.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr 0.8fr 0.6fr 0.7fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.6fr 0.6fr' }}
  >
    {/* Nom fix (no editable) */}
    <div className="text-[11px] text-slate-300 font-body px-1 truncate">{t.nom}</div>
    {/* Càrrega */}
    <input type="number" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.carrega_pct} onChange={(e) => updTram(t.id, 'carrega_pct', parseFloat(e.target.value) || 0)} min="0" max="100" />
    {/* Potència */}
    <input type="number" step="0.01" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.potencia_kw || ''} onChange={(e) => updTram(t.id, 'potencia_kw', parseFloat(e.target.value) || 0)} />
    {/* cos fi */}
    <input type="number" step="0.01" min="0" max="1" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.cos_fi} onChange={(e) => updTram(t.id, 'cos_fi', parseFloat(e.target.value) || 0)} />
    {/* Intensitat (calculada) */}
    <div className="text-[11px] text-amber-300/80 font-mono text-right pr-0.5">{t.intensitat_a}</div>
    {/* Secció */}
    <select className="bg-ink-800 border border-ink-600 text-[11px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.seccio_mm2} onChange={(e) => updTram(t.id, 'seccio_mm2', parseFloat(e.target.value))}>
      {[1.5,2.5,4,6,10,16,25,35,50].map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
    {/* Longitud */}
    <input type="number" step="0.5" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.longitud_m || ''} onChange={(e) => updTram(t.id, 'longitud_m', parseFloat(e.target.value) || 0)} />
    {/* Moment (calculat) */}
    <div className="text-[11px] text-slate-400 font-mono text-right pr-0.5">{t.moment_kwm}</div>
    {/* ΔU parcial */}
    <div className="text-[11px] text-slate-400 font-mono text-right pr-0.5">{t.caiguda_parcial_pct.toFixed(2)}%</div>
    {/* ΔU total */}
    <div className={`text-[11px] font-mono text-right pr-0.5 font-semibold ${t.ok ? 'text-emerald-400' : 'text-red-400'}`}>{t.caiguda_total_pct.toFixed(2)}%</div>
    {/* Tipus corrent */}
    <select className="bg-ink-800 border border-ink-600 text-[10px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.tipus} onChange={(e) => updTram(t.id, 'tipus', e.target.value)}>
      <option value="mono">Mono</option>
      <option value="tri">Tri</option>
    </select>
    {/* Tipus conductor */}
    <select className="bg-ink-800 border border-ink-600 text-[10px] font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.tensio_nominal_aillament} onChange={(e) => updTram(t.id, 'tensio_nominal_aillament', e.target.value)}>
      <option value="0,45/0,75">0,45/0,75</option>
      <option value="0,6/1">0,6/1</option>
    </select>
    {/* Tub encastat mm */}
    <input type="number" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.canal_tub_encastat_mm ?? ''} onChange={(e) => updTram(t.id, 'canal_tub_encastat_mm', e.target.value ? parseFloat(e.target.value) : null)} />
    {/* Tub s/encastar mm */}
    <input type="number" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.canal_tub_sense_encas_mm ?? ''} onChange={(e) => updTram(t.id, 'canal_tub_sense_encas_mm', e.target.value ? parseFloat(e.target.value) : null)} />
    {/* Enterrat prof m */}
    <input type="number" step="0.1" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.canal_enterrat_prof_m ?? ''} onChange={(e) => updTram(t.id, 'canal_enterrat_prof_m', e.target.value ? parseFloat(e.target.value) : null)} />
    {/* Aïllament kΩ */}
    <input type="number" step="0.1" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.aillament_instal_kohm ?? ''} onChange={(e) => updTram(t.id, 'aillament_instal_kohm', e.target.value ? parseFloat(e.target.value) : null)} />
    {/* Neutre mm² */}
    <input type="number" step="0.5" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.conduc_neutre_mm2 ?? ''} onChange={(e) => updTram(t.id, 'conduc_neutre_mm2', e.target.value ? parseFloat(e.target.value) : null)} />
    {/* Protecció mm² */}
    <input type="number" step="0.5" className="bg-ink-800/50 text-[11px] text-right font-mono rounded px-0.5 py-0.5 w-full focus:outline-none" value={t.conduc_protec_mm2 ?? ''} onChange={(e) => updTram(t.id, 'conduc_protec_mm2', e.target.value ? parseFloat(e.target.value) : null)} />
  </div>
))}
```

- [ ] **Step 6: Afegir secció de dades de pàgina 2 sota la taula**

Afegeix un nou bloc `<motion.div>` sota la llegenda de la taula:

```tsx
{/* Dades Pàgina 2 */}
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
  className="mt-8 card space-y-4">
  <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Dades resum (pàgina 2)</h3>
  <div className="grid grid-cols-3 gap-4">
    <FormInput label="Ús de la instal·lació" value={doc.us_installacio} onChange={(e) => updDoc('us_installacio', e.target.value)} placeholder="Vivenda Elevada" />
    <FormInput label="Empresa distribuïdora" value={doc.empresa_distribuidora} onChange={(e) => updDoc('empresa_distribuidora', e.target.value)} />
    <FormSelect label="Nova / Ampliació / Reforma" value={doc.nova_ampliacio_reforma}
      onChange={(e) => updDoc('nova_ampliacio_reforma', e.target.value)}
      options={[
        { value: 'nova', label: 'Nova' },
        { value: 'ampliacio', label: 'Ampliació' },
        { value: 'reforma', label: 'Reforma' },
      ]} />
  </div>
  <div className="grid grid-cols-4 gap-4">
    <FormInput label="Resistència terra (Ω)" type="number" step="0.1" value={String(doc.resist_terra_ohm ?? '')} onChange={(e) => updDoc('resist_terra_ohm', e.target.value ? parseFloat(e.target.value) : null)} className="font-mono" />
    <FormInput label="Potència a instal·lar (kW)" type="number" step="0.01" value={String(doc.potencia_instal_kw ?? '')} onChange={(e) => updDoc('potencia_instal_kw', e.target.value ? parseFloat(e.target.value) : null)} className="font-mono" />
    <FormInput label="Intensitat IGA (A)" type="number" value={String(doc.intensitat_iga_a ?? '')} onChange={(e) => updDoc('intensitat_iga_a', e.target.value ? parseFloat(e.target.value) : null)} className="font-mono" />
    <FormInput label="Superfície local (m²)" type="number" value={String(doc.superficie_local_m2 ?? '')} onChange={(e) => updDoc('superficie_local_m2', e.target.value ? parseFloat(e.target.value) : null)} className="font-mono" />
  </div>
</motion.div>
```

Afegeix l'import de `FormSelect` si no hi és:
```typescript
import { FormInput, FormSelect } from '../components/ui/FormField'
```

- [ ] **Step 7: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Elec3Editor.tsx
git commit -m "feat(elec3): editor — slots fixos, 9 camps nous, dades pàgina 2"
```

---

## Task 9: ELEC-3 — pdf-elec3.ts

**Files:**
- Create: `src/lib/pdf-elec3.ts`

**Nota prèvia:** Abans d'implementar, comprova si la conversió Word → PDF ha preservat camps AcroForm:

```typescript
// Script temporal d'inspecció — executa a la consola del navegador o en Node:
import { PDFDocument } from 'pdf-lib'
const bytes = await fetch('/templates/elec3-blank.pdf').then(r => r.arrayBuffer())
const doc = await PDFDocument.load(bytes)
const form = doc.getForm()
console.log(form.getFields().map(f => f.getName()))
```

Si retorna una llista de noms → usa el camí AcroForm. Si retorna `[]` → usa coordenades.

- [ ] **Step 1: Crear `src/lib/pdf-elec3.ts`**

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Elec3Doc } from './supabase-elec3'
import type { Instalador } from '../types'
import type { Projecte } from './supabase-projectes'
import { calculaTrams } from './elec3-calculs'

// ── Coordenades pàgina 1 (taula de càlculs) ──────────────────────────
// El formulari ELEC-3 és A4 landscape (842×595pt).
// Les files comencen a y≈520pt (derivació individual) i baixen ~33pt per fila.
// Les columnes comencen a x≈55pt (TRAM) amb amplades variables.

const P1 = {
  pageSize: [842, 595] as [number, number],
  // Fila "Derivació individual (A — B)": y inicial
  firstRowY: 510,
  rowHeight: 30,
  // X de cada columna (esquerra de cada cel·la)
  cols: {
    tram:         55,
    carrega:     205,
    potencia:    225,
    cosfi:       250,
    intensitat:  270,
    seccio:      293,
    longitud:    318,
    moment:      340,
    caiguda_p:   372,
    caiguda_t:   400,
    tipus:       428,
    tensio_ail:  455,
    canal_stub:  490,
    tub_enc:     520,
    tub_senc:    545,
    enterrat:    568,
    aillament:   593,
    neutre:      618,
    protec:      640,
  },
  fontSize: 6.5,
}

// ── Coordenades pàgina 2 (resum) ─────────────────────────────────────
const P2 = {
  pageSize: [595, 842] as [number, number],
  titular:        { x: 90,  y: 756 },
  us_installacio: { x: 290, y: 756 },
  emplacament:    { x: 90,  y: 720 },
  localitat:      { x: 90,  y: 690 },
  cp:             { x: 200, y: 690 },
  nova_x:         { x: 290, y: 690 },
  empresa_dist:   { x: 90,  y: 655 },
  // Diferencials: 3 files, primera a y=610, espai 28pt
  difY:           [610, 582, 554],
  difCols: { circuit: 290, nombre: 350, in_a: 400, sensibilitat: 450 },
  seccio_di:      { x: 500, y: 620 },
  resist_terra:   { x: 500, y: 574 },
  superfície:     { x: 400, y: 530 },
  potencia_max:   { x: 290, y: 498 },
  tensio:         { x: 500, y: 498 },
  potencia_inst:  { x: 290, y: 464 },
  iga:            { x: 500, y: 464 },
  fontSize: 7.5,
}

export async function generateElec3PDF(
  doc: Elec3Doc,
  instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  const response = await fetch('/templates/elec3-blank.pdf')
  if (!response.ok) throw new Error('No s\'ha pogut carregar la plantilla ELEC-3')
  const templateBytes = new Uint8Array(await response.arrayBuffer())

  // Intentar AcroForm primer
  try {
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    if (fields.length > 0) {
      return fillElec3AcroForm(pdfDoc, form, doc, instalador, projecte)
    }
  } catch {
    // Si falla, passar a coordenades
  }

  // Fallback: coordenades
  return fillElec3Coordinates(templateBytes, doc, instalador, projecte)
}

async function fillElec3AcroForm(
  pdfDoc: PDFDocument,
  form: import('pdf-lib').PDFForm,
  doc: Elec3Doc,
  _instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  const trams = calculaTrams(doc.trams)
  const ROWS = ['Derivaci_individual_A_B', 'C_D', 'E_F', 'G_H', 'I_J', 'K_L', 'M_N', 'O_P', 'Q_R', 'S_T', 'U_V', 'W_X', 'Y_Z']

  const trySet = (name: string, value: string) => {
    try { form.getTextField(name).setText(value) } catch { /* camp no trobat */ }
  }

  trams.forEach((t, i) => {
    const prefix = ROWS[i] || `row${i}`
    trySet(`${prefix}_carrega`, t.carrega_pct ? String(t.carrega_pct) : '')
    trySet(`${prefix}_potencia`, t.potencia_kw ? String(t.potencia_kw) : '')
    trySet(`${prefix}_cosfi`, String(t.cos_fi))
    trySet(`${prefix}_intensitat`, t.intensitat_a ? String(t.intensitat_a) : '')
    trySet(`${prefix}_seccio`, String(t.seccio_mm2))
    trySet(`${prefix}_longitud`, t.longitud_m ? String(t.longitud_m) : '')
    trySet(`${prefix}_moment`, t.moment_kwm ? String(t.moment_kwm) : '')
    trySet(`${prefix}_caiguda_p`, t.caiguda_parcial_pct ? t.caiguda_parcial_pct.toFixed(2) : '')
    trySet(`${prefix}_caiguda_t`, t.caiguda_total_pct ? t.caiguda_total_pct.toFixed(2) : '')
    trySet(`${prefix}_tipus`, t.tipus_conductor)
    trySet(`${prefix}_tensio_ail`, t.tensio_nominal_aillament)
    trySet(`${prefix}_tub_enc`, t.canal_tub_encastat_mm ? String(t.canal_tub_encastat_mm) : '')
    trySet(`${prefix}_tub_senc`, t.canal_tub_sense_encas_mm ? String(t.canal_tub_sense_encas_mm) : '')
    trySet(`${prefix}_enterrat`, t.canal_enterrat_prof_m ? String(t.canal_enterrat_prof_m) : '')
    trySet(`${prefix}_aillament`, t.aillament_instal_kohm ? String(t.aillament_instal_kohm) : '')
    trySet(`${prefix}_neutre`, t.conduc_neutre_mm2 ? String(t.conduc_neutre_mm2) : '')
    trySet(`${prefix}_protec`, t.conduc_protec_mm2 ? String(t.conduc_protec_mm2) : '')
  })

  // Pàgina 2
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
  instalador: Instalador,
  projecte?: Projecte,
): Promise<Uint8Array> {
  const trams = calculaTrams(doc.trams)
  const [embedded] = await (await PDFDocument.create()).embedPdf(templateBytes, [0, 1])
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const BLACK = rgb(0, 0, 0)

  // Pàgina 1: taula de càlculs
  const [embP1, embP2] = await pdfDoc.embedPdf(templateBytes, [0, 1])
  const page1 = pdfDoc.addPage(P1.pageSize)
  page1.drawPage(embP1, { x: 0, y: 0, width: P1.pageSize[0], height: P1.pageSize[1] })

  trams.forEach((t, i) => {
    const y = P1.firstRowY - i * P1.rowHeight
    if (y < 50) return
    const fs = P1.fontSize
    const draw = (text: string, x: number) => {
      if (text) page1.drawText(text, { x, y, size: fs, font, color: BLACK })
    }
    draw(t.carrega_pct ? String(t.carrega_pct) : '', P1.cols.carrega)
    draw(t.potencia_kw ? String(t.potencia_kw) : '', P1.cols.potencia)
    draw(String(t.cos_fi), P1.cols.cosfi)
    draw(t.intensitat_a ? String(t.intensitat_a) : '', P1.cols.intensitat)
    draw(String(t.seccio_mm2), P1.cols.seccio)
    draw(t.longitud_m ? String(t.longitud_m) : '', P1.cols.longitud)
    draw(t.moment_kwm ? String(t.moment_kwm) : '', P1.cols.moment)
    draw(t.caiguda_parcial_pct ? t.caiguda_parcial_pct.toFixed(2) : '', P1.cols.caiguda_p)
    draw(t.caiguda_total_pct ? t.caiguda_total_pct.toFixed(2) : '', P1.cols.caiguda_t)
    draw(t.tipus_conductor, P1.cols.tipus)
    draw(t.tensio_nominal_aillament, P1.cols.tensio_ail)
    draw(t.canal_tub_encastat_mm ? String(t.canal_tub_encastat_mm) : '', P1.cols.tub_enc)
    draw(t.canal_tub_sense_encas_mm ? String(t.canal_tub_sense_encas_mm) : '', P1.cols.tub_senc)
    draw(t.canal_enterrat_prof_m ? String(t.canal_enterrat_prof_m) : '', P1.cols.enterrat)
    draw(t.aillament_instal_kohm ? String(t.aillament_instal_kohm) : '', P1.cols.aillament)
    draw(t.conduc_neutre_mm2 ? String(t.conduc_neutre_mm2) : '', P1.cols.neutre)
    draw(t.conduc_protec_mm2 ? String(t.conduc_protec_mm2) : '', P1.cols.protec)
  })

  // Pàgina 2: resum
  const page2 = pdfDoc.addPage(P2.pageSize)
  page2.drawPage(embP2, { x: 0, y: 0, width: P2.pageSize[0], height: P2.pageSize[1] })

  const draw2 = (text: string, x: number, y: number) => {
    if (text) page2.drawText(text, { x, y, size: P2.fontSize, font, color: BLACK })
  }

  draw2(projecte?.titular_nom || '', P2.titular.x, P2.titular.y)
  draw2(doc.us_installacio, P2.us_installacio.x, P2.us_installacio.y)
  draw2(projecte ? `${projecte.inst_nom_via} ${projecte.inst_numero}`.trim() : '', P2.emplacament.x, P2.emplacament.y)
  draw2(projecte?.inst_poblacio || '', P2.localitat.x, P2.localitat.y)
  draw2(projecte?.inst_cp || '', P2.cp.x, P2.cp.y)
  draw2(doc.empresa_distribuidora, P2.empresa_dist.x, P2.empresa_dist.y)
  draw2(doc.resist_terra_ohm ? String(doc.resist_terra_ohm) : '', P2.resist_terra.x, P2.resist_terra.y)
  draw2(trams[0]?.potencia_kw ? String(trams[0].potencia_kw) : '', P2.potencia_max.x, P2.potencia_max.y)
  draw2(trams[0]?.tensio_v ? String(trams[0].tensio_v) : '230', P2.tensio.x, P2.tensio.y)
  draw2(doc.potencia_instal_kw ? String(doc.potencia_instal_kw) : '', P2.potencia_inst.x, P2.potencia_inst.y)
  draw2(doc.intensitat_iga_a ? String(doc.intensitat_iga_a) : '', P2.iga.x, P2.iga.y)
  draw2(String(trams[0]?.seccio_mm2 ?? ''), P2.seccio_di.x, P2.seccio_di.y)

  return pdfDoc.save()
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf-elec3.ts
git commit -m "feat(elec3): generació PDF sobre formulari oficial (AcroForm + fallback coordenades)"
```

---

## Task 10: ELEC-3 — Wiring editor + cleanup

**Files:**
- Modify: `src/pages/Elec3Editor.tsx`
- Delete: `src/components/pdf/Elec3PDF.tsx`

- [ ] **Step 1: Actualitzar imports a Elec3Editor**

Elimina:
```typescript
import { pdf } from '@react-pdf/renderer'
import { Elec3PDF } from '../components/pdf/Elec3PDF'
```

Afegeix:
```typescript
import { generateElec3PDF } from '../lib/pdf-elec3'
import { getProjecte, type Projecte } from '../lib/supabase-projectes'
```

Afegeix estat per al projecte si no hi és:
```typescript
const [projecte, setProjecte] = useState<Projecte | null>(null)
```

Al `useEffect`, carrega el projecte quan es coneix `projecteId`:
```typescript
if (pid) {
  getProjecte(pid).then(({ data: p }) => {
    if (p && mounted) {
      setProjecteNom((p as Projecte).nom)
      setProjecte(p as Projecte)
    }
  })
}
```

- [ ] **Step 2: Substituir `handleExport`**

```typescript
const handleExport = async () => {
  if (!doc || !instalador) return
  setExporting(true)
  try {
    const pdfBytes = await generateElec3PDF(doc, instalador, projecte ?? undefined)
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elec3_${(doc.nom || 'calculs').replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('PDF descarregat')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error en exportar')
  }
  setExporting(false)
}
```

- [ ] **Step 3: Esborrar Elec3PDF.tsx**

```bash
rm src/components/pdf/Elec3PDF.tsx
```

- [ ] **Step 4: Build check final**

```bash
npm run build 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 5: Verificar que @react-pdf ja no s'importa als 3 editors**

```bash
grep -r "@react-pdf" src/pages/Elec1Editor.tsx src/pages/Elec3Editor.tsx src/pages/EsquemaUnifilarEditor.tsx
```

Expected: cap sortida (cap import restant).

- [ ] **Step 6: Commit + deploy**

```bash
git add src/pages/Elec3Editor.tsx src/components/pdf/Elec3PDF.tsx
git commit -m "feat(elec3): exportar PDF oficial en lloc de @react-pdf"
npm run deploy
```

---

## Notes d'implementació

### Calibratge de coordenades (ELEC-2 i ELEC-3)
Les coordenades proporcionades són aproximacions. Després del primer deploy:
1. Exportar un PDF de prova
2. Obrir-lo i comparar visualment amb el formulari original
3. Ajustar les constants `FOOTER`, `DIAGRAM`, `P1`, `P2` fins que els valors caiguin dins de les cel·les correctes

### Primer test del ELEC-1 (XFA)
Si el primer test mostra "Please wait..." → el stream XFA no s'ha modificat correctament. Verificar:
- Que `findXfaStreamBounds` retorna uns bounds vàlids (log a consola)
- Que el XML descomprimit conté `<xfa:data` o `<xfa:datasets`
- Que `setValueAtPath` troba els elements (`DATA.sTitular.NomCognoms` etc.)

Si els elements no existeixen al XML → crear-los sota `<xfa:data>` amb el node `DATA` com a arrel.

### ELEC-3: Si no hi ha camps AcroForm
Si la inspecció confirma 0 camps AcroForm → les coordenades de `P1.cols` i `P2.*` cal calibrar-les manualment tal com s'indica a la secció de calibratge.
