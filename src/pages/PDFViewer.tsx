import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Loader2, Zap } from 'lucide-react'
import { PDFViewer as ReactPDFViewer, pdf } from '@react-pdf/renderer'
import { getMemoria } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Memoria } from '../types'
import { PDFTemplate } from '../components/pdf/PDFTemplate'
import toast from 'react-hot-toast'

export function PDFViewer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { instalador } = useAuthStore()
  const [memoria, setMemoria] = useState<Memoria | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id) return
    getMemoria(id).then(({ data }) => {
      setMemoria(data as Memoria)
      setLoading(false)
    })
  }, [id])

  const buildFilename = () => {
    if (!memoria) return 'memoria-tecnica.pdf'
    const ref = memoria.wizard_data.referencia_interna || 'memoria-tecnica'
    const u = memoria.wizard_data.ubicacion
    const partes = [u.direccion, u.numero, u.piso_puerta].filter(Boolean).join(' ')
    const slug = partes
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .trim()
      .replace(/\s+/g, '_')
    return slug
      ? `${ref.replace(/\//g, '-')}-${slug}.pdf`
      : `${ref.replace(/\//g, '-')}.pdf`
  }

  const handleDownload = async () => {
    if (!memoria || !instalador) return
    setGenerating(true)
    try {
      const blob = await pdf(
        <PDFTemplate data={memoria.wizard_data} instalador={instalador} />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = buildFilename()
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF descarregat')
    } catch {
      toast.error('Error en generar el PDF')
    }
    setGenerating(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )

  if (!memoria || !instalador) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Memòria no trobada
    </div>
  )

  const { wizard_data: data } = memoria

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center justify-between bg-[#0a0f1e]/90 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-mono text-sm text-amber-500/70">
            {data.referencia_interna || 'Sense referència'}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="btn-primary"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generant…</>
            : <><Download className="w-4 h-4" /> Descarrega el PDF</>}
        </button>
      </header>

      <div className="flex-1 flex">
        {/* PDF preview — render real con @react-pdf/renderer */}
        <main className="flex-1 p-8 flex justify-center bg-ink-900/40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[900px] rounded-xl overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
          >
            <ReactPDFViewer width="100%" height={900} showToolbar={false}>
              <PDFTemplate data={data} instalador={instalador} />
            </ReactPDFViewer>
          </motion.div>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-l border-[#1e2d47] p-6">
          <p className="section-sub mb-4">Resum</p>
          <div className="space-y-3">
            {[
              { label: 'Referència', value: data.referencia_interna || '—' },
              { label: 'Potència total', value: `${data.receptores.reduce((s, r) => s + r.potencia_kw, 0).toFixed(2)} kW` },
              { label: 'Receptors', value: String(data.receptores.length) },
              { label: 'Municipi', value: data.ubicacion.municipio || '—' },
              { label: 'Instal·lador', value: instalador.nombre_completo },
            ].map((item) => (
              <div key={item.label}>
                <span className="field-label">{item.label}</span>
                <div className="font-mono text-xs text-slate-300">{item.value}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
