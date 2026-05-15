import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export const WIZARD_STEPS = [
  { label: 'Solicitante', short: '01' },
  { label: 'Ubicación', short: '02' },
  { label: 'Cargas', short: '03' },
  { label: 'CGP', short: '04' },
  { label: 'Cálculos', short: '05' },
  { label: 'Declaración', short: '06' },
  { label: 'Redactor', short: '07' },
]

interface StepIndicatorProps {
  currentStep: number
  onStepClick?: (step: number) => void
  completedSteps?: Set<number>
}

export function StepIndicator({ currentStep, onStepClick, completedSteps = new Set() }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {WIZARD_STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(index)
        const isCurrent = index === currentStep
        const isPast = index < currentStep

        return (
          <div key={index} className="flex items-center">
            <motion.button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={`
                relative flex flex-col items-center group
                ${onStepClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              whileHover={onStepClick ? { scale: 1.05 } : {}}
              whileTap={onStepClick ? { scale: 0.95 } : {}}
            >
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center
                border-2 font-mono text-xs font-semibold
                transition-all duration-300
                ${isCurrent
                  ? 'border-amber-500 bg-amber-500 text-ink-900'
                  : isPast || isCompleted
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-500'
                  : 'border-ink-500 bg-ink-800 text-slate-500'}
              `}
              style={isCurrent ? { boxShadow: '0 0 16px rgba(251,191,36,0.4)' } : {}}>
                {isPast || isCompleted
                  ? <Check className="w-4 h-4" strokeWidth={2.5} />
                  : step.short}
              </div>

              <span className={`
                mt-1.5 text-[10px] font-display font-semibold tracking-wider uppercase
                whitespace-nowrap transition-colors duration-300
                ${isCurrent ? 'text-amber-400' : isPast ? 'text-amber-500/50' : 'text-slate-600'}
              `}>
                {step.label}
              </span>
            </motion.button>

            {index < WIZARD_STEPS.length - 1 && (
              <div className="relative w-8 flex items-center" style={{ marginBottom: '18px' }}>
                <div className="h-px w-full bg-ink-600" />
                <motion.div
                  className="absolute h-px bg-amber-500/60"
                  initial={{ width: 0 }}
                  animate={{ width: index < currentStep ? '100%' : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
