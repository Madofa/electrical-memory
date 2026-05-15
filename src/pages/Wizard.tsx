import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Save, FileDown, Zap, Cloud } from 'lucide-react'
import { useWizardStore } from '../stores/wizardStore'
import { useAuthStore } from '../stores/authStore'
import { saveMemoria } from '../lib/supabase'
import { StepIndicator, WIZARD_STEPS } from '../components/ui/StepIndicator'
import { Step2Solicitante } from '../components/wizard/Step2Solicitante'
import { Step3Ubicacion } from '../components/wizard/Step3Ubicacion'
import { Step4Receptores } from '../components/wizard/Step4Receptores'
import { Step5CGP } from '../components/wizard/Step5CGP'
import { Step6Calculos } from '../components/wizard/Step6Calculos'
import { Step7Declaracion } from '../components/wizard/Step7Declaracion'
import { Step8Redactor } from '../components/wizard/Step8Redactor'
import { MiniPreview } from '../components/wizard/MiniPreview'
import toast from 'react-hot-toast'

const STEPS = [
  Step2Solicitante,
  Step3Ubicacion,
  Step4Receptores,
  Step5CGP,
  Step6Calculos,
  Step7Declaracion,
  Step8Redactor,
]

export function Wizard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data, memoriaId, setPasoActual, isDirty, markClean } = useWizardStore()
  const [step, setStep] = useState(data.paso_actual ?? 0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1)

  const StepComponent = STEPS[step]
  const isLast = step === STEPS.length - 1
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setPasoActual(step) }, [step])

  // Autoguardado silencioso 2s tras el último cambio
  useEffect(() => {
    if (!isDirty || !user) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true)
      try {
        const store = useWizardStore.getState()
        const id = await saveMemoria(user.id, store.data, 'borrador', store.memoriaId ?? undefined)
        store.loadMemoria(id, store.data)
      } catch (e) {
        console.error('Autoguardado fallido:', e)
      }
      setAutoSaving(false)
    }, 2000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [data, isDirty, user])

  const goNext = () => {
    setCompletedSteps((prev) => new Set([...prev, step]))
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goPrev = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSave = async (finalizar = false) => {
    if (!user) return
    setSaving(true)
    try {
      const id = await saveMemoria(
        user.id,
        data,
        finalizar ? 'finalizada' : 'borrador',
        memoriaId ?? undefined
      )
      markClean()
      toast.success(finalizar ? 'Memoria finalizada' : 'Borrador guardado')
      if (finalizar) navigate(`/pdf/${id}`)
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center gap-4 bg-[#0a0f1e]/90 backdrop-blur sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="btn-ghost p-2 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-sm tracking-widest uppercase text-slate-300 hidden sm:block">
            {data.referencia_interna || 'Nueva memoria'}
          </span>
        </div>
        <div className="flex-1 flex justify-center overflow-x-auto py-1">
          <StepIndicator
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={(s) => {
              if (completedSteps.has(s) || s <= step) {
                setDirection(s > step ? 1 : -1)
                setStep(s)
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {autoSaving && (
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <Cloud className="w-3 h-3 animate-pulse" /> guardando...
            </span>
          )}
          {!autoSaving && !isDirty && (
            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
              <Cloud className="w-3 h-3" /> guardado
            </span>
          )}
          {isDirty && !autoSaving && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-ghost text-sm text-slate-400"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main form area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            {/* Step header */}
            <div className="mb-8">
              <p className="section-sub mb-1">Paso {step + 1} de {WIZARD_STEPS.length}</p>
              <h1 className="font-display font-bold text-3xl tracking-wide uppercase text-slate-100">
                {WIZARD_STEPS[step].label}
              </h1>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <StepComponent onNext={goNext} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mini preview sidebar */}
        <aside className="hidden xl:block w-72 border-l border-[#1e2d47] overflow-y-auto bg-[#0a0f1e]/50">
          <MiniPreview data={data} currentStep={step} />
        </aside>
      </div>

      {/* Footer navigation */}
      <footer className="border-t border-[#1e2d47] px-6 py-4 flex items-center justify-between bg-[#0a0f1e]/90 backdrop-blur">
        <button
          onClick={goPrev}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="font-mono text-xs text-slate-600">
          {step + 1} / {WIZARD_STEPS.length}
        </span>

        {isLast ? (
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn-primary"
          >
            <FileDown className="w-4 h-4" />
            {saving ? 'Generando...' : 'Finalizar y generar PDF'}
          </button>
        ) : (
          <button onClick={goNext} className="btn-primary">
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  )
}
