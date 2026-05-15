import { createClient } from '@supabase/supabase-js'
import type { Instalador, Memoria, WizardData, EstadoMemoria } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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

// ── Instalador ────────────────────────────────────────────────────

export async function getInstalador(userId: string): Promise<Instalador | null> {
  const { data } = await supabase
    .from('instaladores')
    .select('*')
    .eq('id', userId)
    .single()
  if (data) return data

  // Primera vez — crear fila vacía y devolver
  await supabase.from('instaladores').insert({ id: userId })
  const { data: fresh } = await supabase
    .from('instaladores')
    .select('*')
    .eq('id', userId)
    .single()
  return fresh
}

export async function upsertInstalador(data: Partial<Instalador> & { id: string }) {
  return supabase.from('instaladores').upsert({
    ...data,
    updated_at: new Date().toISOString(),
  })
}

export async function uploadLogo(userId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/logo.${ext}`
  await supabase.storage.from('instaladores').upload(path, file, { upsert: true })
  const { data } = supabase.storage.from('instaladores').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFirma(userId: string, dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl)
  const path = `${userId}/firma.png`
  await supabase.storage
    .from('instaladores')
    .upload(path, blob, { upsert: true, contentType: 'image/png' })
  const { data } = supabase.storage.from('instaladores').getPublicUrl(path)
  return data.publicUrl
}

// ── Memorias ──────────────────────────────────────────────────────

export async function getMemorias(instaladorId: string) {
  return supabase
    .from('memorias')
    .select('id, referencia_interna, numero_expediente, estado, created_at, updated_at, wizard_data')
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
  id?: string
): Promise<string> {
  const payload = {
    instalador_id: instaladorId,
    referencia_interna: wizardData.referencia_interna || null,
    estado,
    wizard_data: wizardData,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('memorias').update(payload).eq('id', id)
    if (error) throw error
    return id
  }

  const { data, error } = await supabase
    .from('memorias')
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select('id')

  if (error) throw error
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
