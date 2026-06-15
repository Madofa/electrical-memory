import { createClient } from '@supabase/supabase-js'
import type { Instalador, Memoria, WizardData, EstadoMemoria } from '../types'

// Clau pública (anon key): per disseny va incrustada al codi client de qualsevol
// app Supabase; la seguretat depèn de les polítiques RLS, no del seu secret.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://moctmdicimxivthkrzhs.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3RtZGljaW14aXZ0aGtyemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Mzk1MDEsImV4cCI6MjA5NDQxNTUwMX0.xJdX_UJHOgAAIvJ5wKP9eC-U1DOuD9gUsQkhRkvobtY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth ──────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword })
}

export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
}

export async function resendConfirmation(email: string) {
  return supabase.auth.resend({ type: 'signup', email })
}

// ── Instalador ────────────────────────────────────────────────────

const STORAGE_BUCKET = 'instaladores'
// 1 any: les URLs es regeneren a cada càrrega del perfil, però donem marge ampli
// per a sessions llargues i per a la descàrrega de la imatge dins el PDF.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365

// Extreu el path dins el bucket a partir d'una URL (pública o signada) o d'un
// path ja net. Tolera dades antigues (URL pública sencera) i noves (path).
function storagePathFromUrl(urlOrPath: string): string | null {
  if (!urlOrPath) return null
  const marker = `/${STORAGE_BUCKET}/`
  const i = urlOrPath.indexOf(marker)
  if (i === -1) return urlOrPath.includes('/') ? urlOrPath.split('?')[0] : null
  return urlOrPath.slice(i + marker.length).split('?')[0]
}

// Converteix firma_url i empresa_logo_url en URLs signades fresques. Si alguna
// cosa falla, deixa el valor original perquè mai es trenqui la generació del PDF.
async function withSignedAssetUrls(row: Instalador | null): Promise<Instalador | null> {
  if (!row) return row
  const sign = async (value?: string): Promise<string | undefined> => {
    if (!value) return value
    const path = storagePathFromUrl(value)
    if (!path) return value
    try {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
      return error || !data?.signedUrl ? value : data.signedUrl
    } catch {
      return value
    }
  }
  const [firma_url, empresa_logo_url] = await Promise.all([sign(row.firma_url), sign(row.empresa_logo_url)])
  return { ...row, firma_url, empresa_logo_url }
}

export async function getInstalador(userId: string): Promise<Instalador | null> {
  const { data } = await supabase
    .from('instaladores')
    .select('*')
    .eq('id', userId)
    .single()
  if (data) return withSignedAssetUrls(data)

  // Primera vez — crear fila vacía y devolver. Usem upsert amb ignoreDuplicates
  // perquè App.tsx pot cridar aquesta funció dues vegades quasi alhora
  // (getSession + onAuthStateChange) i un INSERT normal violaria la PK.
  await supabase.from('instaladores').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
  const { data: fresh } = await supabase
    .from('instaladores')
    .select('*')
    .eq('id', userId)
    .single()
  return withSignedAssetUrls(fresh)
}

export async function upsertInstalador(data: Partial<Instalador> & { id: string }) {
  const { error } = await supabase.from('instaladores').upsert({
    ...data,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
}

// Valida que el perfil de l'instal·lador tingui les dades imprescindibles per
// emetre un document oficial. Retorna la llista d'etiquetes de camps que falten
// (buida = perfil complet).
export function missingInstaladorFields(i: Instalador | null): string[] {
  if (!i) return ['Perfil d\'instal·lador']
  const missing: string[] = []
  if (!i.nombre_completo?.trim()) missing.push('Nom complet')
  if (!i.dni_nie?.trim())         missing.push('DNI / NIE')
  if (!i.numero_carnet?.trim())   missing.push('Núm. de carnet / RASIC')
  return missing
}

async function signedUrlOrThrow(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  if (error || !data?.signedUrl) throw new Error(error?.message || 'No s\'ha pogut signar la URL')
  return data.signedUrl
}

export async function uploadLogo(userId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/logo.${ext}`
  await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
  return signedUrlOrThrow(path)
}

export async function uploadFirma(userId: string, dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl)
  const path = `${userId}/firma.png`
  await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/png' })
  return signedUrlOrThrow(path)
}

// ── Memorias ──────────────────────────────────────────────────────

export async function getMemorias(instaladorId: string) {
  return supabase
    .from('memorias')
    .select('id, referencia_interna, numero_expediente, estado, created_at, updated_at, wizard_data, projecte_id')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function getMemoria(id: string) {
  return supabase.from('memorias').select('*').eq('id', id).single()
}

export async function saveMemoria(
  instaladorId: string,
  wizardData: WizardData,
  estado: EstadoMemoria = 'borrador',
  id?: string,
  projecteId?: string,
): Promise<string> {
  const payload = {
    instalador_id: instaladorId,
    referencia_interna: wizardData.referencia_interna || null,
    estado,
    wizard_data: wizardData,
    updated_at: new Date().toISOString(),
    ...(projecteId ? { projecte_id: projecteId } : {}),
  }

  if (id) {
    const { error } = await supabase.from('memorias').update(payload).eq('id', id)
    if (error) throw new Error(error.message || error.details || JSON.stringify(error))
    return id
  }

  const { data, error } = await supabase
    .from('memorias')
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select('id')

  if (error) throw new Error(error.message || error.details || JSON.stringify(error))
  if (!data?.length) throw new Error('Insert sin respuesta — posible bloqueo RLS')
  return (data[0] as Memoria).id
}

export async function deleteMemoria(id: string) {
  return supabase.from('memorias').delete().eq('id', id)
}

export async function finalizarMemoria(id: string) {
  return supabase
    .from('memorias')
    .update({ estado: 'finalizada', updated_at: new Date().toISOString() })
    .eq('id', id)
}

// ── Utils ─────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
