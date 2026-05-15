// ── Instalador ────────────────────────────────────────────────────
export type TipoInstalador = 'IBTE' | 'IBTM' | 'TECNICO_TITULADO' | 'EMPRESA'

export interface Instalador {
  id: string
  nombre_completo: string
  dni_nie: string
  tipo: TipoInstalador
  numero_carnet: string
  numero_colegiado?: string
  empresa_nombre?: string
  empresa_cif?: string
  empresa_direccion?: string
  empresa_telefono?: string
  empresa_email?: string
  empresa_logo_url?: string
  firma_url?: string
  created_at?: string
  updated_at?: string
}

// ── Wizard / Memoria ─────────────────────────────────────────────
export type TipoSolicitud =
  | 'nuevo_suministro'
  | 'ampliacion_potencia'
  | 'modificacion'
  | 'reanudacion'

export type UsoFinca =
  | 'vivienda'
  | 'local_comercial'
  | 'garaje'
  | 'industrial'
  | 'otro'

export type GradoElectrificacion = 'basica' | 'elevada' | ''

export interface Receptor {
  id: string
  concepto: string
  aclarador: string
  potencia_kw: number
  tension: string
  grado: GradoElectrificacion
  num_plazas?: number        // garajes
  superficie_m2?: number     // garajes
  num_puntos_ve?: number     // vehículo eléctrico
  pot_unitaria_ve?: number   // vehículo eléctrico
}

export interface DatosSolicitante {
  razon_social: string
  cif_nif: string
  direccion: string
  municipio: string
  cp: string
  telefono: string
  email: string
}

export interface DatosUbicacion {
  tipo_solicitud: TipoSolicitud | null
  uso_finca: UsoFinca | null
  direccion: string
  numero: string
  piso_puerta: string
  municipio: string
  cp: string
  provincia: string
  referencia_catastral: string
  utm_x: string
  utm_y: string
  utm_huso: string
  cups: string
}

export interface ElementoFrontera {
  tipo_elemento: string
  descripcion: string
  foto_punto_entrega_base64: string
  foto_propuesta_cgp_base64: string
  croquis_base64: string
}

export interface Calculos {
  potencia_total_kw: number
  coef_simultaneidad: number
  potencia_demanda_kw: number
  num_fases: string
  tension_nominal_v: number
  intensidad_nominal_a: number
  material_conductor: string
  tipo_conductor: string
  tipo_instalacion: string
  temperatura_c: number
  longitud_m: number
  seccion_calculada_mm2: number
  seccion_normalizada_mm2: number
  caida_tension_pct: number
  icp_a: number
  diferencial_a: number
  diferencial_ma: number
  puesta_tierra_desc: string
}

export interface WizardData {
  // Paso 1
  referencia_interna: string
  // Paso 2
  solicitante: DatosSolicitante
  // Paso 3
  ubicacion: DatosUbicacion
  // Paso 4
  receptores: Receptor[]
  // Paso 5
  elementoFrontera: ElementoFrontera
  // Paso 6
  incluir_calculos: boolean
  calculos: Partial<Calculos>
  // Paso 7 (auto)
  lugarFirma: string
  fechaFirma: string
  // Estado
  paso_actual: number
}

export type EstadoMemoria = 'borrador' | 'finalizada'

export interface Memoria {
  id: string
  instalador_id: string
  referencia_interna: string
  numero_expediente?: string
  estado: EstadoMemoria
  wizard_data: WizardData
  created_at: string
  updated_at: string
}

// ── Helpers ───────────────────────────────────────────────────────
export const LABELS_TIPO_SOLICITUD: Record<TipoSolicitud, string> = {
  nuevo_suministro: 'Nuevo suministro (finca nueva sin acometida)',
  ampliacion_potencia: 'Ampliación de potencia',
  modificacion: 'Modificación de instalación existente',
  reanudacion: 'Reanudación de suministro',
}

export const LABELS_USO_FINCA: Record<UsoFinca, string> = {
  vivienda: 'Vivienda',
  local_comercial: 'Local comercial',
  garaje: 'Garaje / Aparcamiento',
  industrial: 'Uso industrial',
  otro: 'Otro uso',
}

export const LABELS_TIPO_INSTALADOR: Record<TipoInstalador, string> = {
  IBTE: 'Instalador Básico (IBTE)',
  IBTM: 'Instalador en Media Tensión (IBTM)',
  TECNICO_TITULADO: 'Técnico titulado',
  EMPRESA: 'Empresa instaladora',
}

export const TENSION_OPTIONS = [
  '230 V (monofásico)',
  '3×230/400 V (trifásico con neutro)',
]

export const defaultWizardData = (): WizardData => ({
  referencia_interna: `MT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
  solicitante: {
    razon_social: '', cif_nif: '', direccion: '',
    municipio: '', cp: '', telefono: '', email: '',
  },
  ubicacion: {
    tipo_solicitud: null, uso_finca: null,
    direccion: '', numero: '', piso_puerta: '',
    municipio: '', cp: '', provincia: '',
    referencia_catastral: '', utm_x: '', utm_y: '', utm_huso: '',
    cups: '',
  },
  receptores: [],
  elementoFrontera: {
    tipo_elemento: 'Caja General de Protección (CGP)',
    descripcion: '', foto_punto_entrega_base64: '',
    foto_propuesta_cgp_base64: '', croquis_base64: '',
  },
  incluir_calculos: false,
  calculos: {},
  lugarFirma: '',
  fechaFirma: new Date().toISOString().split('T')[0],
  paso_actual: 0,
})
