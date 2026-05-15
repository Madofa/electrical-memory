import { useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoUploadProps {
  label: string
  value: string
  onChange: (base64: string) => void
  onClear: () => void
  hint?: string
}

export function PhotoUpload({ label, value, onChange, onClear, hint }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <span className="field-label">{label}</span>
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative rounded-xl overflow-hidden border border-amber-500/30"
            style={{ height: 180 }}
          >
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ink-900/80 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-ink-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="upload"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className="w-full h-[140px] rounded-xl border-2 border-dashed border-ink-500
                       flex flex-col items-center justify-center gap-2
                       hover:border-amber-500/50 hover:bg-amber-500/5
                       transition-all duration-200 cursor-pointer"
          >
            <Camera className="w-6 h-6 text-amber-500/60" />
            <span className="text-[12px] text-slate-500 font-body">
              Haz clic o arrastra una imagen
            </span>
            {hint && <span className="text-[11px] text-slate-600 font-mono">{hint}</span>}
          </motion.button>
        )}
      </AnimatePresence>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
