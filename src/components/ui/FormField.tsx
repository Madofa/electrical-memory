import { forwardRef } from 'react'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

// ── Text Input ────────────────────────────────────────────────────
type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => (
    <div className={`flex flex-col ${className}`}>
      <label className="field-label">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <input
        ref={ref}
        className={`input-field ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      {hint && !error && <span className="text-[11px] text-slate-500 mt-1 font-mono">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
)
FormInput.displayName = 'FormInput'

// ── Select ────────────────────────────────────────────────────────
type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder, className = '', ...props }, ref) => (
    <div className={`flex flex-col ${className}`}>
      <label className="field-label">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <select
        ref={ref}
        className={`input-field appearance-none cursor-pointer ${error ? 'border-red-500' : ''}`}
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23f59e0b\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && !error && <span className="text-[11px] text-slate-500 mt-1 font-mono">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
)
FormSelect.displayName = 'FormSelect'

// ── Textarea ──────────────────────────────────────────────────────
type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => (
    <div className={`flex flex-col ${className}`}>
      <label className="field-label">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <textarea
        ref={ref}
        rows={3}
        className={`input-box resize-none mt-0 ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      {hint && !error && <span className="text-[11px] text-slate-500 mt-1 font-mono">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
)
FormTextarea.displayName = 'FormTextarea'

// ── Toggle checkbox ───────────────────────────────────────────────
interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}

export function FormToggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`
        flex items-start gap-4 p-4 rounded-xl border text-left w-full
        transition-all duration-200
        ${checked
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-ink-500 bg-ink-800 hover:border-ink-400'}
      `}
    >
      <div className={`
        mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
        transition-all duration-200
        ${checked ? 'border-amber-500 bg-amber-500' : 'border-ink-400'}
      `}>
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-ink-900 fill-current">
            <path d="M10 2L4.5 9 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <div className="font-body font-semibold text-slate-200 text-[14px]">{label}</div>
        {description && <div className="text-[12px] text-slate-500 mt-0.5 font-body">{description}</div>}
      </div>
    </button>
  )
}
