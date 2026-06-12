// src/pages/ProjectePage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Pencil, Loader2, Activity, FileText, BookOpen, ClipboardCheck, Calculator } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate, saveMemoria, getMemorias, deleteMemoria } from '../lib/supabase'
import {
  getProjecte, updateProjecte, prefillMTD,
  type Projecte, type ProjecteForm,
} from '../lib/supabase-projectes'
import { createEsquemaFromPlantilla, getEsquemes, deleteEsquema, updateEsquema } from '../lib/supabase-esquemes'
import { LABELS_TIPUS_INSTALLACIO, type TipusInstallacio } from '../types/esquemaUnifilar'
import { createCertificatElec1, getCertificatsElec1, deleteCertificatElec1, updateCertificatElec1 } from '../lib/supabase-elec1'
import { createElec3Doc, getElec3Docs, deleteElec3Doc, updateElec3Doc } from '../lib/supabase-elec3'
import { createMemoriaDescriptiva, getMemoriesDescriptives, deleteMemoriaDescriptiva, updateMemoriaDescriptiva } from '../lib/supabase-memoria-descriptiva'
import { defaultWizardData } from '../types'
import { useWizardStore } from '../stores/wizardStore'
import { DocumentCard } from '../components/projecte/DocumentCard'
import { ProjecteForm as ProjecteFormModal } from '../components/projecte/ProjecteForm'
import type { DocStatus } from '../components/projecte/DocumentCard'
import type { EsquemaUnifilar } from '../types/esquemaUnifilar'
import type { CertificatElec1 } from '../lib/supabase-elec1'
import type { Elec3Doc } from '../lib/supabase-elec3'
import type { MemoriaDescriptiva } from '../lib/supabase-memoria-descriptiva'
import type { Memoria } from '../types'
import toast from 'react-hot-toast'

// Helper to filter docs by projecte_id, ordenats per creació (els nous van al final)
function filterByProjecte<T extends { projecte_id?: string; created_at: string }>(docs: T[], id: string): T[] {
  return docs.filter((d) => d.projecte_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

// Evita noms duplicats: si "Joaquin Auger" ja existeix, el següent serà "Joaquin Auger 2", "Joaquin Auger 3"...
function uniqueDocName(base: string, existing: (string | null | undefined)[]): string {
  const taken = new Set(existing.filter(Boolean) as string[])
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base} ${i}`)) i++
  return `${base} ${i}`
}

export function ProjectePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, instalador } = useAuthStore()
  const wizardStore = useWizardStore()

  const [projecte, setProjecte] = useState<Projecte | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [triantTipusEsquema, setTriantTipusEsquema] = useState(false)

  const [mtds, setMtds] = useState<Memoria[]>([])
  const [esquemes, setEsquemes] = useState<EsquemaUnifilar[]>([])
  const [elec1s, setElec1s] = useState<CertificatElec1[]>([])
  const [elec3s, setElec3s] = useState<Elec3Doc[]>([])
  const [mds, setMds] = useState<MemoriaDescriptiva[]>([])

  useEffect(() => {
    if (!id || !user) return
    let mounted = true
    Promise.all([
      getProjecte(id),
      getMemorias(user.id),
      getEsquemes(user.id),
      getCertificatsElec1(user.id),
      getElec3Docs(user.id),
      getMemoriesDescriptives(user.id),
    ]).then(([pRes, mtdRes, esqRes, e1Res, e3Res, mdRes]) => {
      if (!mounted) return
      if (pRes.error || !pRes.data) { toast.error('Projecte no trobat'); navigate('/projectes'); return }
      setProjecte(pRes.data as Projecte)
      const allMtds = (mtdRes.data ?? []) as (Memoria & { projecte_id?: string })[]
      const allEsq = (esqRes.data ?? []) as (EsquemaUnifilar & { projecte_id?: string })[]
      const allE1 = (e1Res.data ?? []) as (CertificatElec1 & { projecte_id?: string })[]
      const allE3 = (e3Res.data ?? []) as (Elec3Doc & { projecte_id?: string })[]
      const allMd = (mdRes.data ?? []) as (MemoriaDescriptiva & { projecte_id?: string })[]
      setMtds(filterByProjecte(allMtds, id))
      setEsquemes(filterByProjecte(allEsq, id))
      setElec1s(filterByProjecte(allE1, id))
      setElec3s(filterByProjecte(allE3, id))
      setMds(filterByProjecte(allMd, id))
      setLoading(false)
    }).catch((err) => {
      if (!mounted) return
      console.error('[ProjectePage] Error carregant dades:', err)
      toast.error(`Error carregant el projecte: ${err instanceof Error ? err.message : String(err)}`)
      navigate('/projectes')
    })
    return () => { mounted = false }
  }, [id, user, navigate])

  const handleEditSave = async (data: ProjecteForm) => {
    if (!id) return
    await updateProjecte(id, data)
    setProjecte((p) => p ? { ...p, ...data } : p)
    toast.success('Projecte actualitzat')
  }

  const handleCreateMTD = async () => {
    if (!user || !projecte) return
    const prefill = prefillMTD(projecte)
    wizardStore.reset()
    wizardStore.setSolicitante(prefill.solicitante)
    wizardStore.setUbicacion(prefill.ubicacion_patch)
    const storeData = useWizardStore.getState().data
    const newData = { ...defaultWizardData(), ...storeData }
    const newId = await saveMemoria(user.id, newData, 'borrador', undefined, id)
    wizardStore.setMemoriaId(newId)
    wizardStore.setProjecteId(id ?? null)
    navigate('/wizard')
  }

  const handleCreateEsquema = async () => {
    // Mostra el selector de tipus en comptes de crear directament
    setTriantTipusEsquema(true)
  }

  const handleConfirmEsquema = async (tipus: TipusInstallacio) => {
    if (!user || !projecte) return
    setTriantTipusEsquema(false)
    const newId = await createEsquemaFromPlantilla(user.id, tipus, projecte.nom, id, projecte)
    const nom = uniqueDocName(projecte.nom, esquemes.map((d) => d.nom))
    if (nom !== projecte.nom) await updateEsquema(newId, { nom })
    navigate(`/unifilar/${newId}`)
  }

  const handleCreateElec1 = async () => {
    if (!user || !projecte) return
    const newId = await createCertificatElec1(user.id, instalador, id, projecte)
    const nom = uniqueDocName(projecte.nom, elec1s.map((d) => d.nom))
    if (nom !== projecte.nom) await updateCertificatElec1(newId, { nom })
    navigate(`/elec1/${newId}`)
  }

  const handleCreateElec3 = async () => {
    if (!user || !projecte) return
    const newId = await createElec3Doc(user.id, id, projecte)
    const nom = uniqueDocName(projecte.nom, elec3s.map((d) => d.nom))
    if (nom !== projecte.nom) await updateElec3Doc(newId, { nom })
    navigate(`/elec3/${newId}`)
  }

  const handleCreateMD = async () => {
    if (!user || !projecte) return
    const newId = await createMemoriaDescriptiva(user.id, id, projecte)
    const nom = uniqueDocName(projecte.nom, mds.map((d) => d.nom))
    if (nom !== projecte.nom) await updateMemoriaDescriptiva(newId, { nom })
    navigate(`/memoria-descriptiva/${newId}`)
  }

  const handleDeleteMTD = async (docId: string) => {
    const { error } = await deleteMemoria(docId)
    if (error) { toast.error(error.message); return }
    setMtds((prev) => prev.filter((d) => d.id !== docId))
    toast.success('Document eliminat')
  }

  const handleDeleteEsquema = async (docId: string) => {
    const { error } = await deleteEsquema(docId)
    if (error) { toast.error(error.message); return }
    setEsquemes((prev) => prev.filter((d) => d.id !== docId))
    toast.success('Document eliminat')
  }

  const handleDeleteElec3 = async (docId: string) => {
    const { error } = await deleteElec3Doc(docId)
    if (error) { toast.error(error.message); return }
    setElec3s((prev) => prev.filter((d) => d.id !== docId))
    toast.success('Document eliminat')
  }

  const handleDeleteElec1 = async (docId: string) => {
    const { error } = await deleteCertificatElec1(docId)
    if (error) { toast.error(error.message); return }
    setElec1s((prev) => prev.filter((d) => d.id !== docId))
    toast.success('Document eliminat')
  }

  const handleDeleteMD = async (docId: string) => {
    const { error } = await deleteMemoriaDescriptiva(docId)
    if (error) { toast.error(error.message); return }
    setMds((prev) => prev.filter((d) => d.id !== docId))
    toast.success('Document eliminat')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )
  if (!projecte) return null

  const adreça = [projecte.inst_nom_via, projecte.inst_numero, projecte.inst_cp, projecte.inst_poblacio]
    .filter(Boolean).join(', ')

  const mtdDocs: DocStatus[] = mtds.map((d) => ({
    id: d.id,
    estat: d.estado === 'finalizada' ? 'finalitzat' : 'esborrany',
    nom: d.referencia_interna || (d.wizard_data?.ubicacion?.municipio) || 'MTD',
    route: `/wizard`,
    onOpen: () => {
      if (d.wizard_data) {
        wizardStore.loadMemoria(d.id, d.wizard_data)
        if (id) wizardStore.setProjecteId(id)
      }
      navigate('/wizard')
    },
    onDelete: () => handleDeleteMTD(d.id),
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/projectes')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-base tracking-wide uppercase text-slate-100 truncate">
              {projecte.nom || 'Sense nom'}
            </div>
            {adreça && <div className="text-[11px] text-slate-500 font-mono truncate">{adreça}</div>}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="btn-ghost">
          <Pencil className="w-4 h-4" /> Editar
        </button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {projecte.titular_nom && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 card bg-ink-700/30 border-ink-600/40"
          >
            <p className="section-sub mb-1">Titular</p>
            <div className="flex flex-wrap gap-4 text-[13px] text-slate-300 font-body">
              <span className="font-semibold">{projecte.titular_nom}</span>
              {projecte.titular_nif && <span className="text-slate-500">{projecte.titular_nif}</span>}
              {projecte.titular_telefon && <span className="text-slate-500">{projecte.titular_telefon}</span>}
              {projecte.titular_correu && <span className="text-slate-500">{projecte.titular_correu}</span>}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="section-sub mb-4">Documents de l'expedient</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard
              icon={<FileText className="w-5 h-5 text-amber-400" />}
              label="Memòria Tècnica Descriptiva"
              sublabel="e-distribució"
              docs={mtdDocs}
              onCreate={handleCreateMTD}
            />
            <DocumentCard
              icon={<Activity className="w-5 h-5 text-amber-400" />}
              label="Esquema Unifilar"
              sublabel="Model ELEC 2"
              docs={esquemes.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/unifilar/${d.id}`, onDelete: () => handleDeleteEsquema(d.id) }))}
              onCreate={handleCreateEsquema}
            />
            <DocumentCard
              icon={<Calculator className="w-5 h-5 text-amber-400" />}
              label="Memòria Tècnica de càlculs"
              sublabel="ELEC-3 · ITC-BT-19"
              docs={elec3s.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/elec3/${d.id}`, onDelete: () => handleDeleteElec3(d.id) }))}
              onCreate={handleCreateElec3}
            />
            <DocumentCard
              icon={<ClipboardCheck className="w-5 h-5 text-amber-400" />}
              label="Certificat d'instal·lació"
              sublabel="ELEC-1 Abril 2024"
              docs={elec1s.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom || d.titular_nom, route: `/elec1/${d.id}`, onDelete: () => handleDeleteElec1(d.id) }))}
              onCreate={handleCreateElec1}
            />
            <DocumentCard
              icon={<BookOpen className="w-5 h-5 text-amber-400" />}
              label="Memòria Descriptiva"
              sublabel="Document narratiu"
              docs={mds.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/memoria-descriptiva/${d.id}`, onDelete: () => handleDeleteMD(d.id) }))}
              onCreate={handleCreateMD}
            />
          </div>
        </motion.div>

        <p className="text-[10px] text-slate-700 font-mono mt-10">
          Creat: {formatDate(projecte.created_at)} · Actualitzat: {formatDate(projecte.updated_at)}
        </p>
      </main>

      {editing && (
        <ProjecteFormModal
          initial={projecte}
          onSave={handleEditSave}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Modal: selecció de tipus d'instal·lació per a l'Esquema Unifilar */}
      {triantTipusEsquema && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setTriantTipusEsquema(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0f1729] border border-[#1e2d47] rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg tracking-widest uppercase text-slate-100 mb-2">
              Esquema Unifilar
            </h3>
            <p className="text-[13px] text-slate-500 font-body mb-6">
              Tria el tipus d'instal·lació per carregar la plantilla de circuits corresponent.
            </p>
            <div className="space-y-2">
              {(Object.entries(LABELS_TIPUS_INSTALLACIO) as [TipusInstallacio, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => handleConfirmEsquema(v)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-ink-500 bg-ink-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-[13px] font-body text-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTriantTipusEsquema(false)}
              className="mt-4 w-full text-center text-[12px] text-slate-600 hover:text-slate-400 font-body"
            >
              Cancel·la
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
