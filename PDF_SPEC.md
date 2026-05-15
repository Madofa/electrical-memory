# PDF_SPEC.md — Template del documento + Registro de instalador

## Estructura del PDF generado

El PDF se genera capturando el componente React `<PDFTemplate />` con html2pdf.js.
Formato A4 vertical, márgenes 15mm, fuente Arial/sans-serif.

---

## Secciones del documento (en orden)

### CABECERA

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO EMPRESA]          MEMORIA TÉCNICA DESCRIPTIVA            │
│                          Instalación Eléctrica en Baja Tensión  │
│                                                                 │
│  Ref. interna: MT-2025-001     Fecha: Barcelona, 12/06/2025    │
└─────────────────────────────────────────────────────────────────┘
```

### SECCIÓN 1 — CARACTERÍSTICAS DE LA SOLICITUD

```
TIPO DE SOLICITUD:     Nuevo suministro (finca nueva sin acometida)
USO DE LA FINCA:       Local comercial
NIVEL DE TENSIÓN:      3×230/400 V (trifásico con neutro)
POTENCIA TOTAL:        XX,XX kW
```

### SECCIÓN 2 — DATOS DEL SOLICITANTE

```
Razón social / Nombre:  _______________________________________________
CIF / NIF:              _______________________________________________
Dirección:              _______________________________________________
Municipio:              ___________________  C.P.: __________________
Teléfono:               ___________________  Email: _________________
```

### SECCIÓN 3 — UBICACIÓN DEL SUMINISTRO

```
Dirección del suministro:   ___________________________________________
Municipio:                  _____________________  C.P.: _____________
Provincia:                  ___________________________________________
Referencia catastral:       ___________________________________________
Coordenadas UTM (ETRS89):   X: ____________  Y: ____________  Huso: __
CUPS (si ampliación):       ___________________________________________
```

### SECCIÓN 4 — DATOS TÉCNICOS DE LA PETICIÓN

Tabla según el formato exacto de e-distribución:

```
┌─────────────────────┬────────────┬────────────┬──────────────┬────────────────────────┐
│ CONCEPTO            │ ACLARADOR  │ POT. (kW)  │ TENSIÓN (V)  │ GRADO ELECTRIFICACIÓN  │
├─────────────────────┼────────────┼────────────┼──────────────┼────────────────────────┤
│ Vivienda            │ 1ª 1A      │ 5,75       │ 3×230/400 V  │ Básica                 │
│ Vivienda            │ 1ª 2A      │ 9,20       │ 3×230/400 V  │ Elevada                │
│ Local comercial     │ LOCAL 1    │ 8,00       │ 3×230/400 V  │ —                      │
│ Ascensores          │ ASCENSOR   │ 5,50       │ 3×230/400 V  │ —                      │
├─────────────────────┴────────────┴────────────┴──────────────┴────────────────────────┤
│                                               POTENCIA TOTAL:       28,45 kW          │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Para garajes, incluir columna adicional Nº PLAZAS y SUPERFICIE (m²).
Para VE, incluir Nº PUNTOS y POT. UNITARIA.

### SECCIÓN 5 — PROPUESTA DE UBICACIÓN DEL ELEMENTO FRONTERA

```
Tipo de elemento frontera:  Caja General de Protección (CGP)
Descripción:
  [Campo de texto libre del instalador]

Fotografía punto de entrega de energía:
  [IMAGEN INCRUSTADA — foto_punto_entrega]

Fotografía propuesta de ubicación CGP:
  [IMAGEN INCRUSTADA — foto_propuesta_cgp]

Croquis:
  [IMAGEN INCRUSTADA — croquis]
```

Nota al pie: *"Las fotografías y el croquis adjuntos muestran la propuesta de ubicación de la CGP
en el emplazamiento indicado."*

### SECCIÓN 6 — CÁLCULOS JUSTIFICATIVOS (si incluidos)

```
DATOS DE CÁLCULO
─────────────────────────────────────────────────────────────
Potencia total instalada:          XX,XX kW
Coeficiente de simultaneidad:      0,XX
Potencia de demanda:               XX,XX kW
Número de fases:                   Trifásico (3F+N)
Tensión nominal:                   400 V
Intensidad nominal:                XX,X A

LÍNEA GENERAL DE ALIMENTACIÓN (LGA)
─────────────────────────────────────────────────────────────
Material conductor:                Cobre (Cu)
Tipo conductor:                    RZ1-K 0,6/1 kV
Tipo de instalación:               Tubo empotrado en pared
Temperatura de servicio:           70 °C
Longitud estimada:                 XX m
Sección calculada:                 XX mm²
Sección normalizada adoptada:      XX mm²    ← sección comercial
Caída de tensión:                  X,XX %    (límite: 1,5%)
✅ Cumple con ITC-BT-14

PROTECCIONES
─────────────────────────────────────────────────────────────
ICP recomendado:                   XX A
Interruptor diferencial:           ID XX A  30 mA  Clase AC

PUESTA A TIERRA
─────────────────────────────────────────────────────────────
[Descripción libre del instalador]
```

### SECCIÓN 7 — DECLARACIÓN RESPONSABLE CALIDAD DE ONDA

Texto obligatorio literal según e-distribución:

```
DECLARACIÓN RESPONSABLE DE CALIDAD DE ONDA

En calidad de solicitante, declaro bajo mi responsabilidad que la instalación eléctrica
objeto de la solicitud de acceso y conexión cumplirá con la normativa de calidad de la
onda vigente y huecos de tensión.

Y para que conste a los efectos oportunos, firma la presente en [CIUDAD], a [FECHA].

Razón Social / Nombre (Solicitante):    _________________________________
DNI / NIF (Solicitante):               _________________________________

Firma del solicitante:
                    [ESPACIO PARA FIRMA MANUAL O IMAGEN FIRMA]
```

### SECCIÓN 8 — DATOS DEL REDACTOR (instalador)

```
MEMORIA REDACTADA POR:

Nombre y apellidos:         ___________________________________________
DNI / NIE:                  ___________________________________________
Tipo:                       Instalador autorizado en Baja Tensión (IBTM)
Nº de instalador:           ___________________________________________
Empresa:                    ___________________________________________
CIF empresa:                ___________________________________________
Dirección:                  ___________________________________________
Teléfono:                   ___________________________________________
Email:                      ___________________________________________

El instalador/técnico redactor declara que la presente Memoria Técnica está de acuerdo
con las prescripciones del vigente Reglamento Electrotécnico para Baja Tensión (RD
842/2002) e instrucciones ITC-BT específicas de aplicación.

            [LUGAR], a [FECHA]

Firma y sello del instalador:

            [IMAGEN FIRMA DEL INSTALADOR]
            [SELLO SI PROCEDE]
```

---

## PDFTemplate.tsx (esqueleto)

```tsx
// components/pdf/PDFTemplate.tsx
import { useWizardStore } from '@/stores/wizardStore'
import { useAuthStore } from '@/stores/authStore'

export function PDFTemplate() {
  const wizard = useWizardStore()
  const { instalador } = useAuthStore()
  const potenciaTotal = wizard.getPotenciaTotal()

  return (
    <div id="pdf-content" style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#000',
      lineHeight: '1.4',
      padding: '0',
    }}>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
        <div>
          {instalador?.empresa_logo_url && (
            <img src={instalador.empresa_logo_url} alt="Logo" style={{ maxHeight: '50px' }} />
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>MEMORIA TÉCNICA DESCRIPTIVA</h1>
          <p style={{ margin: '2px 0', fontSize: '10px' }}>Instalación Eléctrica en Baja Tensión</p>
          <p style={{ margin: '2px 0', fontSize: '10px' }}>
            Ref: {wizard.referencia_interna || '—'} &nbsp;|&nbsp; Fecha: {formatDate(wizard.fechaFirma)}
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: Características */}
      <Section title="1. CARACTERÍSTICAS DE LA SOLICITUD">
        <Row label="Tipo de solicitud" value={LABELS_TIPO[wizard.ubicacion.tipo_solicitud!]} />
        <Row label="Uso de la finca" value={LABELS_USO[wizard.ubicacion.uso_finca!]} />
        <Row label="Nivel de tensión solicitado" value={potenciaTotal > 15 ? '3×230/400 V' : '230 V'} />
        <Row label="Potencia total solicitada" value={`${potenciaTotal.toFixed(2).replace('.', ',')} kW`} />
      </Section>

      {/* SECCIÓN 2: Solicitante */}
      <Section title="2. DATOS DEL SOLICITANTE">
        <Row label="Razón social / Nombre" value={wizard.solicitante.razon_social} />
        <Row label="CIF / NIF" value={wizard.solicitante.cif_nif} />
        <Row label="Dirección" value={`${wizard.solicitante.direccion}, ${wizard.solicitante.municipio} ${wizard.solicitante.cp}`} />
        <Row label="Teléfono" value={wizard.solicitante.telefono} />
        <Row label="Email" value={wizard.solicitante.email} />
      </Section>

      {/* SECCIÓN 3: Ubicación */}
      <Section title="3. UBICACIÓN DEL SUMINISTRO">
        <Row label="Dirección" value={`${wizard.ubicacion.direccion} ${wizard.ubicacion.numero}${wizard.ubicacion.piso_puerta ? ', ' + wizard.ubicacion.piso_puerta : ''}`} />
        <Row label="Municipio / C.P." value={`${wizard.ubicacion.municipio} / ${wizard.ubicacion.cp}`} />
        <Row label="Provincia" value={wizard.ubicacion.provincia} />
        {wizard.ubicacion.referencia_catastral && (
          <Row label="Referencia catastral" value={wizard.ubicacion.referencia_catastral} />
        )}
        {wizard.ubicacion.utm_x && (
          <Row label="Coordenadas UTM (ETRS89)" value={`X: ${wizard.ubicacion.utm_x} / Y: ${wizard.ubicacion.utm_y} / Huso: ${wizard.ubicacion.utm_huso}`} />
        )}
        {wizard.ubicacion.cups && (
          <Row label="CUPS" value={wizard.ubicacion.cups} />
        )}
      </Section>

      {/* SECCIÓN 4: Tabla receptores */}
      <Section title="4. DATOS TÉCNICOS DE LA PETICIÓN">
        <ReceptoresTable receptores={wizard.receptores} potenciaTotal={potenciaTotal} />
      </Section>

      {/* SECCIÓN 5: CGP */}
      <Section title="5. PROPUESTA DE UBICACIÓN DEL ELEMENTO FRONTERA">
        <p><strong>Tipo de elemento:</strong> {wizard.elementoFrontera.tipo_elemento}</p>
        <p><strong>Descripción:</strong> {wizard.elementoFrontera.descripcion}</p>
        {wizard.elementoFrontera.foto_punto_entrega_base64 && (
          <div>
            <p><strong>Fotografía — Punto de entrega de energía:</strong></p>
            <img src={wizard.elementoFrontera.foto_punto_entrega_base64}
                 style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }} />
          </div>
        )}
        {wizard.elementoFrontera.foto_propuesta_cgp_base64 && (
          <div>
            <p><strong>Fotografía — Propuesta de ubicación CGP:</strong></p>
            <img src={wizard.elementoFrontera.foto_propuesta_cgp_base64}
                 style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ccc' }} />
          </div>
        )}
      </Section>

      {/* SECCIÓN 6: Cálculos (si existen) */}
      {wizard.calculos.seccion_normalizada_mm2 && (
        <Section title="6. CÁLCULOS JUSTIFICATIVOS (REBT)">
          <CalculosTable calculos={wizard.calculos} />
        </Section>
      )}

      {/* SECCIÓN 7: Declaración responsable */}
      <Section title="7. DECLARACIÓN RESPONSABLE DE CALIDAD DE ONDA">
        <p style={{ textAlign: 'justify', fontSize: '10px' }}>
          En calidad de solicitante, declaro bajo mi responsabilidad que la instalación eléctrica
          objeto de la solicitud de acceso y conexión cumplirá con la normativa de calidad de la
          onda vigente y huecos de tensión.
        </p>
        <p>Y para que conste a los efectos oportunos, firma la presente en <strong>{wizard.lugarFirma}</strong>, a <strong>{formatDate(wizard.fechaFirma)}</strong>.</p>
        <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
          <div>
            <p>Razón Social / Nombre: ____________________________</p>
            <p>DNI / NIF: ____________________________</p>
            <p>Firma del solicitante:</p>
            <div style={{ height: '60px', border: '1px solid #ccc', width: '200px' }} />
          </div>
        </div>
      </Section>

      {/* SECCIÓN 8: Datos del instalador */}
      <Section title="8. DATOS DEL REDACTOR">
        <InstaladorSection instalador={instalador} fecha={wizard.fechaFirma} lugar={wizard.lugarFirma} />
      </Section>
    </div>
  )
}
```

---

## Registro de instalador — ProfileSetupForm

### Campos del formulario de perfil

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| Nombre completo | text | ✅ | |
| DNI / NIE | text | ✅ | |
| Tipo de instalador | select | ✅ | IBTE / IBTM / Técnico titulado / Empresa |
| Número de carnet | text | ✅ | Nº autorización CCAA |
| Número colegiado | text | ❌ | Solo técnicos titulados |
| Nombre empresa | text | ❌ | Vacío si autónomo sin empresa |
| CIF empresa | text | ❌ | |
| Dirección empresa | text | ❌ | |
| Teléfono empresa | text | ❌ | |
| Email empresa | text | ❌ | |
| Logo empresa | image upload | ❌ | PNG/JPG, aparece en cabecera PDF |
| **Firma digital** | canvas / upload | ✅ | Aparece al pie del documento |

### Flujo de registro completo

```
1. /register
   → email + contraseña (Supabase Auth)
   → supabase.auth.signUp()
   → redirect /perfil/completar

2. /perfil/completar  (ProfileSetupForm)
   → Rellenar datos profesionales
   → Dibujar/subir firma en SignaturePad
   → submit → INSERT into instaladores
   → redirect / (dashboard)

3. En cualquier momento: /perfil
   → Editar cualquier dato
   → Cambiar firma
   → UPDATE instaladores
```

### Schema Zod (registro instalador)

```ts
const instaladorSchema = z.object({
  nombre_completo: z.string().min(3),
  dni_nie: z.string().regex(/^[XYZ\d]\d{7}[A-Z]$/, 'Formato DNI/NIE no válido'),
  tipo: z.enum(['IBTE','IBTM','TECNICO_TITULADO','EMPRESA']),
  numero_carnet: z.string().min(3),
  numero_colegiado: z.string().optional(),
  empresa_nombre: z.string().optional(),
  empresa_cif: z.string().optional(),
  empresa_direccion: z.string().optional(),
  empresa_telefono: z.string().optional(),
  empresa_email: z.string().email().optional().or(z.literal('')),
  // La firma se valida por separado (dataURL del canvas)
})
```

### SignaturePad.tsx (esqueleto)

```tsx
import SignatureCanvas from 'react-signature-canvas'
import { useRef, useState } from 'react'

export function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const padRef = useRef<SignatureCanvas>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const handleSave = () => {
    if (!padRef.current || padRef.current.isEmpty()) return
    const dataUrl = padRef.current.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">Dibuja tu firma o sube una imagen:</p>
      <div className="border border-gray-300 rounded-lg bg-white">
        <SignatureCanvas
          ref={padRef}
          penColor="black"
          canvasProps={{ width: 400, height: 150, className: 'rounded-lg' }}
          onEnd={() => setHasSignature(true)}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={() => { padRef.current?.clear(); setHasSignature(false) }}>
          Limpiar
        </button>
        <button type="button" onClick={handleSave} disabled={!hasSignature}>
          Guardar firma
        </button>
        <label>
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => onSave(reader.result as string)
              reader.readAsDataURL(file)
            }} />
          <span className="cursor-pointer underline text-sm">Subir imagen</span>
        </label>
      </div>
    </div>
  )
}
```

---

## Supabase helpers (`lib/supabase.ts`)

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Instalador ──────────────────────────────────────

export async function getInstalador(userId: string) {
  const { data } = await supabase
    .from('instaladores')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertInstalador(data: Partial<Instalador>) {
  return supabase.from('instaladores').upsert(data)
}

export async function uploadFirma(userId: string, dataUrl: string) {
  const blob = dataUrlToBlob(dataUrl)
  const { data } = await supabase.storage
    .from('instaladores')
    .upload(`${userId}/firma.png`, blob, { upsert: true, contentType: 'image/png' })
  return supabase.storage.from('instaladores').getPublicUrl(`${userId}/firma.png`)
}

// ── Memorias ──────────────────────────────────────

export async function getMemorias(instaladorId: string) {
  return supabase.from('memorias')
    .select('id, referencia_interna, numero_expediente, estado, created_at, updated_at, ubicacion')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function saveMemoria(memoria: Partial<Memoria>) {
  if (memoria.id) {
    return supabase.from('memorias').update(memoria).eq('id', memoria.id)
  }
  return supabase.from('memorias').insert(memoria).select().single()
}

export async function deleteMemoria(id: string) {
  return supabase.from('memorias').delete().eq('id', id)
}

// ── Utils ──────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}
```

---

## Dashboard — lista de memorias

```
┌──────────────────────────────────────────────────────────────────────┐
│  📋 Mis memorias técnicas                        [+ Nueva memoria]   │
├──────────────────────────────────────────────────────────────────────┤
│  MT-2025-001  │  C/ Mayor 5, Hospitalet  │  Borrador  │  12/06/2025  │  [Ver] [PDF] [✏] [🗑] │
│  MT-2025-002  │  Avda. Diagonal 40, BCN  │  Finalizada│  08/06/2025  │  [Ver] [PDF]           │
└──────────────────────────────────────────────────────────────────────┘
```

Cada fila muestra: referencia, dirección del suministro, estado, fecha, acciones.
Estados: `borrador` (azul) / `finalizada` (verde).
