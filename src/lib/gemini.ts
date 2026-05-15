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
Analiza esta imagen (puede ser un cuadro eléctrico, esquema, plano, o instalación) e identifica los receptores/suministros eléctricos.

Devuelve ÚNICAMENTE un objeto JSON (sin markdown, sin explicaciones):
{
  "receptores": [
    {
      "concepto": "<tipo de espacio: Vivienda, Local comercial, Garaje, Trastero, Ascensor, Zonas comunes, etc.>",
      "potencia_kw": <potencia en kW como número, 0 si no es visible>,
      "tension": "<'230 V' o '3×230/400 V'>",
      "grado": "<'basica' | 'elevada' | '' — solo para viviendas según ITC-BT-10>"
    }
  ],
  "notas": "<observaciones técnicas adicionales o null>"
}

Si no puedes identificar receptores eléctricos, devuelve "receptores": [].`

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
