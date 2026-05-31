import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import type { Circuit, Diferencial } from '../../types/esquemaUnifilar'
import { useEsquemaStore } from '../../stores/esquemaUnifilarStore'

interface RowProps {
  circuit: Circuit
  diferencials: Diferencial[]
  diferencialColor: (id: string) => string
}

function CircuitRow({ circuit, diferencials, diferencialColor }: RowProps) {
  const { updateCircuit, removeCircuit } = useEsquemaStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: circuit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-ink-600/40 hover:bg-amber-500/[0.03]"
    >
      <td className="px-2 py-1.5 w-8">
        <button
          {...attributes}
          {...listeners}
          className="text-slate-600 hover:text-amber-400 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrossega per reordenar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </td>
      <td className="px-2 py-1.5">
        <input
          className="bg-transparent text-[13px] text-slate-200 font-body w-full focus:outline-none focus:bg-ink-800/50 rounded px-1"
          value={circuit.nom}
          onChange={(e) => updateCircuit(circuit.id, { nom: e.target.value })}
        />
      </td>
      <td className="px-2 py-1.5 w-24">
        <input
          type="number"
          step="0.01"
          min="0"
          className="bg-transparent text-[13px] text-amber-300 font-mono w-full text-right focus:outline-none focus:bg-ink-800/50 rounded px-1"
          value={circuit.potencia_kw || ''}
          onChange={(e) => updateCircuit(circuit.id, { potencia_kw: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td className="px-2 py-1.5 w-28">
        <input
          className="bg-transparent text-[12px] text-slate-300 font-mono w-full focus:outline-none focus:bg-ink-800/50 rounded px-1"
          value={circuit.seccio}
          onChange={(e) => updateCircuit(circuit.id, { seccio: e.target.value })}
        />
      </td>
      <td className="px-2 py-1.5 w-20">
        <input
          type="number"
          className="bg-transparent text-[13px] text-slate-200 font-mono w-full text-right focus:outline-none focus:bg-ink-800/50 rounded px-1"
          value={circuit.pia_amperatge}
          onChange={(e) => updateCircuit(circuit.id, { pia_amperatge: parseInt(e.target.value) || 0 })}
        />
      </td>
      <td className="px-2 py-1.5 w-40">
        <select
          className="bg-ink-800 border border-ink-500 text-[12px] text-slate-300 font-mono rounded px-1.5 py-0.5 w-full"
          value={circuit.diferencial_grup}
          onChange={(e) => updateCircuit(circuit.id, { diferencial_grup: e.target.value })}
          style={{ borderLeft: `3px solid ${diferencialColor(circuit.diferencial_grup)}` }}
        >
          {diferencials.map((d, i) => (
            <option key={d.id} value={d.id}>
              Dif {i + 1} · {d.amperatge}A/{d.sensibilitat_ma}mA
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5 w-8">
        <button
          type="button"
          onClick={() => removeCircuit(circuit.id)}
          className="text-slate-600 hover:text-red-400"
          aria-label="Esborrar circuit"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}

const DIF_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899']

export function CircuitTaula() {
  const { circuits, diferencials, addCircuit, reorderCircuits } = useEsquemaStore()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = circuits.findIndex((c) => c.id === active.id)
    const newIndex = circuits.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(circuits, oldIndex, newIndex)
    reorderCircuits(reordered.map((c) => c.id))
  }

  const diferencialColor = (id: string) => {
    const idx = diferencials.findIndex((d) => d.id === id)
    return idx >= 0 ? DIF_COLORS[idx % DIF_COLORS.length] : '#64748b'
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-display font-semibold tracking-widest uppercase text-amber-500/60 border-b border-amber-500/20">
              <th className="px-2 py-2 w-8"></th>
              <th className="px-2 py-2 text-left">Circuit</th>
              <th className="px-2 py-2 text-right">Pot. kW</th>
              <th className="px-2 py-2 text-left">Secció</th>
              <th className="px-2 py-2 text-right">PIA A</th>
              <th className="px-2 py-2 text-left">Diferencial</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={circuits.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {circuits.map((c) => (
                <CircuitRow
                  key={c.id}
                  circuit={c}
                  diferencials={diferencials}
                  diferencialColor={diferencialColor}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      {circuits.length === 0 && (
        <div className="text-center py-8 text-[12px] text-slate-500 font-body">
          Cap circuit. Afegeix-ne un per començar.
        </div>
      )}

      <button
        type="button"
        onClick={addCircuit}
        className="btn-ghost text-sm mt-3 w-full justify-center"
      >
        <Plus className="w-3.5 h-3.5" /> Afegir circuit
      </button>
    </div>
  )
}
