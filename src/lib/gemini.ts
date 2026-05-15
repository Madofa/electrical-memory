const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

export interface GeminiCGPResult {
  tipo_elemento?: string
  descripcion?: string
  notas?: string
}

export interface GeminiReceptoresResult {
  receptores?: Array<{
    concepto: string
    potencia_kw: number
    tension: string
    grado: string
  }>
  notas?: string
}

const TIPOS_CGP = [
  'Caja General de Protección (CGP)',
  'Caja General de Protección y Medida (CGPM)',
  'Equipo de Medida en Fachada',
]

export async function analizarFotoCGP(base64: string, mimeType = 'image/jpeg'): Promise<GeminiCGPResult> {
  const prompt = `Eres un técnico electricista español experto en instalaciones en baja tensión (REBT).
Analiza esta imagen de una instalación eléctrica. Puede ser: cuadro de contadores, armario de portería, CGP/CGPM, acometida, fachada del edificio, croquis o esquema eléctrico, elemento de medida, etc.

Devuelve ÚNICAMENTE un objeto JSON con este formato exacto (sin markdown, sin explicaciones):
{
  "tipo_elemento": "<si identificas el elemento frontera, uno de: 'Caja General de Protección (CGP)' | 'Caja General de Protección y Medida (CGPM)' | 'Equipo de Medida en Fachada' — o null si no lo identificas>",
  "descripcion": "<descripción técnica breve de lo que ves: ubicación, estado, características relevantes para la memoria técnica. Máximo 2 frases. Si es un croquis, descríbelo como tal.>",
  "notas": "<breve etiqueta descriptiva de la foto: 'Cuadro de contadores portería', 'Fachada edificio', 'Acometida exterior', 'Croquis planta', etc. — para usar como título>"
}

Sé específico con lo que ves. Si es un plano o croquis, indícalo.`

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64.replace(/^data:[^;]+;base64,/, '') } },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Gemini error ${res.status}`)

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as GeminiCGPResult

    // Normalizar tipo_elemento al valor exacto del enum
    if (parsed.tipo_elemento) {
      const match = TIPOS_CGP.find((t) => t.toLowerCase().includes(parsed.tipo_elemento!.toLowerCase().split('(')[0].trim()))
      parsed.tipo_elemento = match ?? undefined
    }

    return parsed
  } catch {
    return {}
  }
}

export async function analizarFotoReceptores(base64: string, mimeType = 'image/jpeg'): Promise<GeminiReceptoresResult> {
  const prompt = `Eres un técnico electricista español experto en instalaciones en baja tensión (REBT, ITC-BT-10).
Analiza esta imagen. Puede ser: un cuadro de distribución/eléctrico, un croquis o esquema unifilar, un plano, o una foto de la instalación.

Tu objetivo es identificar los SUMINISTROS (puntos de acometida) que hay en la instalación, NO los circuitos internos.
Ejemplos de suministros: una vivienda, un local comercial, un garaje, un trastero, un ascensor, zonas comunes.

REGLAS:
- Si ves un cuadro eléctrico de una vivienda (con circuitos como enchufes, luces, cocina, AC...) → es UN SOLO suministro tipo "Vivienda"
- La potencia del suministro se deduce del IGA/interruptor general: C25=5.75kW (básica), C40=9.2kW (elevada)
- Si ves un croquis con varios contadores o varios suministros, lista cada uno
- Si hay texto o etiquetas en la imagen, úsalos para identificar los elementos

Devuelve ÚNICAMENTE un objeto JSON (sin markdown, sin explicaciones):
{
  "receptores": [
    {
      "concepto": "<Vivienda | Local comercial | Garaje | Trastero | Ascensor | Zonas comunes | Uso industrial>",
      "potencia_kw": <número en kW, ej: 5.75>,
      "tension": "<'230 V' o '3×230/400 V'>",
      "grado": "<'basica' si IGA<=25A, 'elevada' si IGA>25A, '' si no es vivienda>"
    }
  ],
  "notas": "<qué has visto en la imagen en una frase>"
}

Si no puedes identificar ningún suministro, devuelve "receptores": [].`

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64.replace(/^data:[^;]+;base64,/, '') } },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Gemini error ${res.status}`)

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as GeminiReceptoresResult
  } catch {
    return { receptores: [] }
  }
}
