import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SignatureCanvas from 'react-signature-canvas'
import { ArrowLeft, Save, Upload, Pen, RotateCcw, Check, Zap } from 'lucide-react'
import { getInstalador, upsertInstalador, uploadFirma, uploadLogo } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Instalador, TipoInstalador } from '../types'
import { LABELS_TIPO_INSTALADOR } from '../types'
import { FormInput, FormSelect } from '../components/ui/FormField'
import toast from 'react-hot-toast'

const TIPO_OPTIONS = (Object.entries(LABELS_TIPO_INSTALADOR) as [TipoInstalador, string][]).map(
  ([value, label]) => ({ value, label })
)

export function ProfileSetup() {
  const navigate = useNavigate()
  const { user, setInstalador } = useAuthStore()
  const sigPadRef = useRef<SignatureCanvas>(null)
  const sigBoxRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(600)

  const [form, setForm] = useState<Partial<Instalador>>({
    nombre_completo: '', dni_nie: '', tipo: 'IBTM', numero_carnet: '',
    numero_colegiado: '', empresa_nombre: '', empresa_cif: '',
    empresa_direccion: '', empresa_telefono: '', empresa_email: '',
  })
  const [firmaDataUrl, setFirmaDataUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasFirma, setHasFirma] = useState(false)
  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw')

  useEffect(() => {
    const el = sigBoxRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w > 0) setCanvasWidth(w)
    })
    obs.observe(el)
    setCanvasWidth(el.clientWidth || 600)
    return () => obs.disconnect()
  }, [sigMode])

  useEffect(() => {
    if (!user) return
    getInstalador(user.id).then((data) => {
      if (data) {
        setForm(data)
        if (data.firma_url) setFirmaDataUrl(data.firma_url)
        if (data.empresa_logo_url) setLogoPreview(data.empresa_logo_url)
      }
    })
  }, [user])

  const set = (field: keyof Instalador) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSaveFirma = () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return
    setFirmaDataUrl(sigPadRef.current.toDataURL('image/png'))
    setHasFirma(true)
  }

  const handleLogoFile = (file: File) => {
    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    try {
      let firma_url = form.firma_url
      let empresa_logo_url = form.empresa_logo_url

      if (firmaDataUrl && firmaDataUrl.startsWith('data:')) {
        firma_url = await uploadFirma(user.id, firmaDataUrl)
      }
      if (logoFile) {
        empresa_logo_url = await uploadLogo(user.id, logoFile)
      }

      const updated: Instalador = {
        ...form as Instalador,
        id: user.id,
        firma_url,
        empresa_logo_url,
      }

      await upsertInstalador(updated)
      setInstalador(updated)
      toast.success('Perfil guardado correctamente')
      navigate('/')
    } catch {
      toast.error('Error al guardar el perfil')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-sm tracking-widest uppercase text-slate-300">
            Perfil del instalador
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-sub mb-1">Configuración</p>
          <h1 className="font-display font-bold text-3xl tracking-wide uppercase text-slate-100 mb-2">
            Datos del redactor
          </h1>
          <p className="text-slate-500 font-body text-sm mb-8">
            Estos datos aparecerán al pie de todas las memorias técnicas que generes.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal */}
            <section className="card">
              <h2 className="font-display font-bold text-sm tracking-widest uppercase text-amber-500 mb-6">
                01 — Datos personales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="Nombre completo" value={form.nombre_completo ?? ''} onChange={set('nombre_completo')} required className="sm:col-span-2" />
                <FormInput label="DNI / NIE" value={form.dni_nie ?? ''} onChange={set('dni_nie')} placeholder="12345678A" required />
                <FormSelect
                  label="Tipo de instalador"
                  value={form.tipo ?? 'IBTM'}
                  onChange={set('tipo') as any}
                  options={TIPO_OPTIONS}
                  required
                />
                <FormInput label="Nº de carnet / autorización" value={form.numero_carnet ?? ''} onChange={set('numero_carnet')} required />
                {form.tipo === 'TECNICO_TITULADO' && (
                  <FormInput label="Nº de colegiado" value={form.numero_colegiado ?? ''} onChange={set('numero_colegiado')} />
                )}
              </div>
            </section>

            {/* Empresa */}
            <section className="card">
              <h2 className="font-display font-bold text-sm tracking-widest uppercase text-amber-500 mb-6">
                02 — Datos de empresa <span className="text-slate-600 normal-case font-body font-normal">(opcional)</span>
              </h2>

              {/* Logo */}
              <div className="mb-6">
                <span className="field-label">Logo de empresa</span>
                <div className="flex items-center gap-4 mt-1">
                  <div
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-ink-500 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-500/40 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoPreview
                      ? <img src={logoPreview} className="w-full h-full object-contain p-1" />
                      : <Upload className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-ghost text-sm px-3 py-1.5">
                      <Upload className="w-3.5 h-3.5" /> Subir logo
                    </button>
                    <p className="text-[11px] text-slate-600 mt-1 font-mono">PNG o JPG, aparece en la cabecera del PDF</p>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormInput label="Nombre de empresa" value={form.empresa_nombre ?? ''} onChange={set('empresa_nombre')} className="sm:col-span-2" />
                <FormInput label="CIF de empresa" value={form.empresa_cif ?? ''} onChange={set('empresa_cif')} />
                <FormInput label="Teléfono" value={form.empresa_telefono ?? ''} onChange={set('empresa_telefono')} />
                <FormInput label="Email" value={form.empresa_email ?? ''} onChange={set('empresa_email')} type="email" />
                <FormInput label="Dirección" value={form.empresa_direccion ?? ''} onChange={set('empresa_direccion')} className="sm:col-span-2" />
              </div>
            </section>

            {/* Firma */}
            <section className="card">
              <h2 className="font-display font-bold text-sm tracking-widest uppercase text-amber-500 mb-2">
                03 — Firma digital
              </h2>
              <p className="text-[12px] text-slate-500 font-body mb-5">
                Aparecerá al pie del documento. Dibuja o sube una imagen.
              </p>

              <div className="flex gap-2 mb-4">
                {(['draw', 'upload'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSigMode(m)}
                    className={`btn-ghost text-sm px-4 py-2 ${sigMode === m ? 'text-amber-400 bg-[#162034]' : ''}`}
                  >
                    {m === 'draw' ? <><Pen className="w-3.5 h-3.5" /> Dibujar</> : <><Upload className="w-3.5 h-3.5" /> Subir imagen</>}
                  </button>
                ))}
              </div>

              {sigMode === 'draw' ? (
                <div>
                  {firmaDataUrl && !firmaDataUrl.startsWith('data:') ? (
                    <div className="border border-amber-500/30 rounded-xl overflow-hidden mb-3">
                      <img src={firmaDataUrl} className="w-full h-[160px] object-contain bg-white" />
                      <div className="px-3 py-2 text-[11px] text-slate-500 font-mono bg-ink-800/50">
                        Firma guardada — pulsa "Limpiar" para redibujar
                      </div>
                    </div>
                  ) : (
                    <div ref={sigBoxRef} className="border-2 border-dashed border-ink-500 rounded-xl overflow-hidden mb-3 bg-white" style={{ touchAction: 'none' }}>
                      <SignatureCanvas
                        ref={sigPadRef}
                        penColor="#0a0f1e"
                        canvasProps={{ width: canvasWidth, height: 160, style: { display: 'block', touchAction: 'none' } }}
                        onEnd={() => setHasFirma(true)}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { sigPadRef.current?.clear(); setHasFirma(false); setFirmaDataUrl('') }} className="btn-ghost text-sm">
                      <RotateCcw className="w-3.5 h-3.5" /> Limpiar
                    </button>
                    <button type="button" onClick={handleSaveFirma} disabled={!hasFirma} className="btn-ghost text-sm text-amber-400 disabled:opacity-30">
                      <Check className="w-3.5 h-3.5" /> Guardar firma
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full h-[120px] border-2 border-dashed border-ink-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500/40 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-[12px] text-slate-500 font-body">PNG o JPG con fondo transparente o blanco</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setFirmaDataUrl(reader.result as string)
                      reader.readAsDataURL(file)
                    }} />
                </label>
              )}
            </section>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving
                ? <><span className="w-4 h-4 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" /> Guardando...</>
                : <><Save className="w-4 h-4" /> Guardar perfil</>}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
