import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Loader2, Zap } from 'lucide-react'
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
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getMemoria(id).then(({ data }) => {
      setMemoria(data as Memoria)
      setLoading(false)
    })
  }, [id])

  const handleDownload = async () => {
    if (!contentRef.current || !memoria) return
    setGenerating(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const ref = data.referencia_interna || 'memoria-tecnica'
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: `${ref.replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(contentRef.current)
        .save()
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar el PDF')
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
      Memoria no encontrada
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
            {data.referencia_interna || 'Sin referencia'}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="btn-primary"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            : <><Download className="w-4 h-4" /> Descargar PDF</>}
        </button>
      </header>

      <div className="flex-1 flex">
        {/* PDF preview */}
        <main className="flex-1 p-8 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[794px]"
          >
            <div
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
            >
              <div ref={contentRef} className="p-[30px]">
                <PDFTemplate data={data} instalador={instalador} />
              </div>
            </div>
          </motion.div>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-l border-[#1e2d47] p-6">
          <p className="section-sub mb-4">Resumen</p>
          <div className="space-y-3">
            {[
              { label: 'Referencia', value: data.referencia_interna || '—' },
              { label: 'Potencia total', value: `${data.receptores.reduce((s, r) => s + r.potencia_kw, 0).toFixed(2)} kW` },
              { label: 'Receptores', value: String(data.receptores.length) },
              { label: 'Municipio', value: data.ubicacion.municipio || '—' },
              { label: 'Instalador', value: instalador.nombre_completo },
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
