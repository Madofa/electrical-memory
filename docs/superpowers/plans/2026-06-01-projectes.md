# Projectes — Hub central d'expedients: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afegir un concepte de "Projecte" que agrupa els 5 tipus de documents d'una instal·lació, amb pre-relleno automàtic dels camps compartits i navegació entre documents des d'una pàgina central.

**Architecture:** Nova taula `projectes` amb dades compartides (titular + adreça instal·lació). Els 5 tipus de document reben un `projecte_id` opcional. El Dashboard mostra projectes en primer pla; `ProjectePage` és el hub amb 5 cards (una per eina) que permeten crear o obrir cada document. La còpia de dades és estàtica (un sol cop en crear).

**Tech Stack:** React 19, TypeScript, Supabase (Postgres + RLS), Tailwind, Framer Motion, Zustand (no s'usa per a projectes — CRUD directe).

---

## Mapa de fitxers

### Nous
| Fitxer | Responsabilitat |
|---|---|
| `supabase/schema-projectes.sql` | Migració: taula + ALTER columns + RLS |
| `src/lib/supabase-projectes.ts` | Tipus `Projecte`, CRUD, helpers pre-relleno |
| `src/components/projecte/ProjecteForm.tsx` | Modal crear/editar projecte |
| `src/components/projecte/DocumentCard.tsx` | Card d'una eina dins del projecte |
| `src/pages/ProjecteList.tsx` | Llista de projectes (nova pantalla principal) |
| `src/pages/ProjectePage.tsx` | Hub del projecte: capçalera + 5 cards |

### Modificats
| Fitxer | Canvi |
|---|---|
| `src/pages/Dashboard.tsx` | Secció "Sense projecte" + link a ProjecteList |
| `src/App.tsx` | Rutes `/projectes` i `/projectes/:id`; redirigir `/` a `/projectes` |
| `src/lib/supabase-esquemes.ts` | `createEsquemaFromPlantilla` accepta `projecteId?` |
| `src/lib/supabase-elec1.ts` | `createCertificatElec1` accepta `projecteId?` |
| `src/lib/supabase-elec3.ts` | `createElec3Doc` accepta `projecteId?` |
| `src/lib/supabase-memoria-descriptiva.ts` | `createMemoriaDescriptiva` accepta `projecteId?` |
| `src/lib/supabase.ts` | `saveMemoria` accepta `projecteId?` |
| `src/pages/EsquemaUnifilarEditor.tsx` | Breadcrumb al projecte |
| `src/pages/Elec1Editor.tsx` | Breadcrumb al projecte |
| `src/pages/Elec3Editor.tsx` | Breadcrumb al projecte |
| `src/pages/MemoriaDescriptivaEditor.tsx` | Breadcrumb al projecte |
| `src/pages/Wizard.tsx` | Breadcrumb al projecte |

---

## Task 1: Migració de base de dades

**Files:**
- Create: `supabase/schema-projectes.sql`

- [ ] **Escriure el fitxer SQL de migració**

```sql
-- supabase/schema-projectes.sql

-- 1. Taula projectes
create table if not exists public.projectes (
  id              uuid primary key default gen_random_uuid(),
  instalador_id   uuid not null references public.instaladores(id) on delete cascade,
  nom             text not null default '',
  estat           text not null default 'actiu' check (estat in ('actiu','tancat')),
  titular_nom     text not null default '',
  titular_nif     text not null default '',
  titular_telefon text not null default '',
  titular_correu  text not null default '',
  inst_tipus_via  text not null default '',
  inst_nom_via    text not null default '',
  inst_numero     text not null default '',
  inst_bloc       text not null default '',
  inst_escala     text not null default '',
  inst_pis        text not null default '',
  inst_porta      text not null default '',
  inst_cp         text not null default '',
  inst_poblacio   text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists projectes_instalador_idx
  on public.projectes (instalador_id, updated_at desc);

alter table public.projectes enable row level security;

create policy "select_own" on public.projectes for select using (instalador_id = auth.uid());
create policy "insert_own" on public.projectes for insert with check (instalador_id = auth.uid());
create policy "update_own" on public.projectes for update using (instalador_id = auth.uid());
create policy "delete_own" on public.projectes for delete using (instalador_id = auth.uid());

-- 2. Columna projecte_id als 5 documents (nullable, SET NULL en esborrar projecte)
alter table public.memorias
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.esquemes_unifilars
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.certificats_elec1
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.calculs_elec3
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;

alter table public.memories_descriptives
  add column if not exists projecte_id uuid references public.projectes(id) on delete set null;
```

- [ ] **Executar la migració**

```bash
cd "/Users/migueldelolmofuente/Antigravity/memoria eléctrica"
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  supabase db query --linked -f supabase/schema-projectes.sql
```

Resultat esperat: `{"rows": []}` sense errors.

- [ ] **Verificar les taules**

```bash
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  supabase db query --linked \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```

Ha d'aparèixer `projectes` a la llista.

- [ ] **Commit**

```bash
git add supabase/schema-projectes.sql
git commit -m "feat(projectes): schema + RLS + projecte_id als 5 documents"
```

---

## Task 2: Tipus i CRUD de projectes

**Files:**
- Create: `src/lib/supabase-projectes.ts`

- [ ] **Crear el fitxer**

```typescript
// src/lib/supabase-projectes.ts
import { supabase } from './supabase'

export interface Projecte {
  id: string
  instalador_id: string
  nom: string
  estat: 'actiu' | 'tancat'
  titular_nom: string
  titular_nif: string
  titular_telefon: string
  titular_correu: string
  inst_tipus_via: string
  inst_nom_via: string
  inst_numero: string
  inst_bloc: string
  inst_escala: string
  inst_pis: string
  inst_porta: string
  inst_cp: string
  inst_poblacio: string
  created_at: string
  updated_at: string
}

export type ProjecteForm = Omit<Projecte, 'id' | 'instalador_id' | 'created_at' | 'updated_at'>

export function emptyProjecte(): ProjecteForm {
  return {
    nom: '', estat: 'actiu',
    titular_nom: '', titular_nif: '', titular_telefon: '', titular_correu: '',
    inst_tipus_via: '', inst_nom_via: '', inst_numero: '',
    inst_bloc: '', inst_escala: '', inst_pis: '', inst_porta: '',
    inst_cp: '', inst_poblacio: '',
  }
}

// ── CRUD ──────────────────────────────────────────────────────────

export async function getProjectes(instaladorId: string) {
  return supabase
    .from('projectes')
    .select('*')
    .eq('instalador_id', instaladorId)
    .order('updated_at', { ascending: false })
}

export async function getProjecte(id: string) {
  return supabase.from('projectes').select('*').eq('id', id).single()
}

export async function createProjecte(instaladorId: string, data: ProjecteForm): Promise<string> {
  const { data: rows, error } = await supabase
    .from('projectes')
    .insert({ instalador_id: instaladorId, ...data })
    .select('id')
  if (error) throw error
  return (rows![0] as { id: string }).id
}

export async function updateProjecte(id: string, patch: Partial<ProjecteForm>) {
  const { error } = await supabase
    .from('projectes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProjecte(id: string) {
  return supabase.from('projectes').delete().eq('id', id)
}

// ── Documents sense projecte ──────────────────────────────────────

export async function assignDocToProjecte(
  table: 'memorias' | 'esquemes_unifilars' | 'certificats_elec1' | 'calculs_elec3' | 'memories_descriptives',
  docId: string,
  projecteId: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ projecte_id: projecteId, updated_at: new Date().toISOString() })
    .eq('id', docId)
  if (error) throw error
}

// ── Helpers de pre-relleno ────────────────────────────────────────
// Retornen camps per pre-emplenar cada tipus de document a partir d'un Projecte.

export function prefillMTD(p: Projecte) {
  return {
    solicitante: {
      razon_social: p.titular_nom,
      cif_nif: p.titular_nif,
      telefono: p.titular_telefon,
      email: p.titular_correu,
      direccion: '', municipio: '', cp: '',
    },
    ubicacion_patch: {
      direccion: p.inst_nom_via,
      numero: p.inst_numero,
      municipio: p.inst_poblacio,
      cp: p.inst_cp,
    },
  }
}

export function prefillEsquemaUnifilar(p: Projecte) {
  const emplacament = [
    p.inst_nom_via,
    p.inst_numero,
    p.inst_cp,
    p.inst_poblacio,
  ].filter(Boolean).join(', ')
  return {
    nom: p.nom,
    capcalera: {
      titular: p.titular_nom,
      emplacament,
      empresa_distribuidora: '',
      seccio_connexio: '10mm²',
      tensio: '230V',
    },
  }
}

export function prefillElec1(p: Projecte) {
  return {
    nom: p.nom,
    titular_nom: p.titular_nom,
    titular_nif: p.titular_nif,
    titular_telefon: p.titular_telefon,
    titular_correu: p.titular_correu,
    inst_tipus_via: p.inst_tipus_via,
    inst_nom_via: p.inst_nom_via,
    inst_numero: p.inst_numero,
    inst_bloc: p.inst_bloc,
    inst_escala: p.inst_escala,
    inst_pis: p.inst_pis,
    inst_porta: p.inst_porta,
    inst_cp: p.inst_cp,
    inst_poblacio: p.inst_poblacio,
  }
}

export function prefillElec3(p: Projecte) {
  return { nom: p.nom }
}

export function prefillMemoriaDescriptiva(p: Projecte) {
  return { nom: p.nom }
}
```

- [ ] **Verificar que compila**

```bash
cd "/Users/migueldelolmofuente/Antigravity/memoria eléctrica"
npx tsc --noEmit 2>&1 | head -20
```

Ha d'acabar sense errors.

- [ ] **Commit**

```bash
git add src/lib/supabase-projectes.ts
git commit -m "feat(projectes): tipus Projecte, CRUD i helpers pre-relleno"
```

---

## Task 3: Actualitzar les 5 funcions de creació de documents

Cada funció de creació ha d'acceptar un `projecteId?` opcional i un objecte de pre-relleno.

**Files:**
- Modify: `src/lib/supabase-esquemes.ts`
- Modify: `src/lib/supabase-elec1.ts`
- Modify: `src/lib/supabase-elec3.ts`
- Modify: `src/lib/supabase-memoria-descriptiva.ts`
- Modify: `src/lib/supabase.ts`

- [ ] **Modificar `supabase-esquemes.ts`**

Localitzar `createEsquemaFromPlantilla` i afegir paràmetres opcionals:

```typescript
// Afegir imports al capdamunt
import type { Projecte } from './supabase-projectes'
import { prefillEsquemaUnifilar } from './supabase-projectes'

// Modificar la signatura i el payload:
export async function createEsquemaFromPlantilla(
  instaladorId: string,
  tipus: EsquemaUnifilar['tipus_installacio'],
  nom: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const { circuits, diferencials, iga_amperatge } = instanciarPlantilla(tipus)
  const prefill = projecte ? prefillEsquemaUnifilar(projecte) : null
  const payload = {
    instalador_id: instaladorId,
    nom: prefill?.nom || nom,
    tipus_installacio: tipus,
    circuits,
    diferencials,
    iga_amperatge,
    capcalera: prefill?.capcalera ?? defaultCapcalera(),
    estat: 'esborrany' as EstatEsquema,
    ...(projecteId ? { projecte_id: projecteId } : {}),
  }
  const { data, error } = await supabase.from(TABLE).insert(payload).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Insert sense resposta — possible bloqueig RLS')
  return (data[0] as { id: string }).id
}
```

- [ ] **Modificar `supabase-elec1.ts`**

```typescript
// Afegir imports:
import type { Projecte } from './supabase-projectes'
import { prefillElec1 } from './supabase-projectes'

// Modificar createCertificatElec1:
export async function createCertificatElec1(
  instaladorId: string,
  instalador: Instalador | null,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillElec1(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      ...emptyCertificat(instalador),
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw error
  return (data![0] as { id: string }).id
}
```

- [ ] **Modificar `supabase-elec3.ts`**

```typescript
// Afegir imports:
import type { Projecte } from './supabase-projectes'
import { prefillElec3 } from './supabase-projectes'

// Modificar createElec3Doc:
export async function createElec3Doc(
  instaladorId: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillElec3(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      nom: '',
      trams: [tramDerivacioIndividual()],
      estat: 'esborrany',
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw error
  return (data![0] as { id: string }).id
}
```

- [ ] **Modificar `supabase-memoria-descriptiva.ts`**

```typescript
// Afegir imports:
import type { Projecte } from './supabase-projectes'
import { prefillMemoriaDescriptiva } from './supabase-projectes'

// Modificar createMemoriaDescriptiva:
export async function createMemoriaDescriptiva(
  instaladorId: string,
  projecteId?: string,
  projecte?: Projecte,
): Promise<string> {
  const prefill = projecte ? prefillMemoriaDescriptiva(projecte) : {}
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      instalador_id: instaladorId,
      ...emptyMemoriaDescriptiva(),
      ...prefill,
      ...(projecteId ? { projecte_id: projecteId } : {}),
    })
    .select('id')
  if (error) throw error
  return (data![0] as { id: string }).id
}
```

- [ ] **Modificar `supabase.ts` — funció `saveMemoria`**

Afegir `projecteId?` com a cinquè paràmetre:

```typescript
export async function saveMemoria(
  instaladorId: string,
  wizardData: WizardData,
  estado: EstadoMemoria = 'borrador',
  id?: string,
  projecteId?: string,   // ← nou
): Promise<string> {
  const payload = {
    instalador_id: instaladorId,
    referencia_interna: wizardData.referencia_interna || null,
    estado,
    wizard_data: wizardData,
    updated_at: new Date().toISOString(),
    ...(projecteId ? { projecte_id: projecteId } : {}),  // ← nou
  }
  // ... resta sense canvis
```

- [ ] **Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Pot haver-hi errors als callers de `createElec3Doc` que no passen els nous paràmetres — és normal, els callers actuals no passen `projecteId` i `projecte`, i TypeScript els accepta perquè són opcionals. Ha d'acabar sense errors.

- [ ] **Commit**

```bash
git add src/lib/supabase-esquemes.ts src/lib/supabase-elec1.ts \
        src/lib/supabase-elec3.ts src/lib/supabase-memoria-descriptiva.ts \
        src/lib/supabase.ts
git commit -m "feat(projectes): funcions de creació accepten projecteId i pre-relleno"
```

---

## Task 4: Component `ProjecteForm`

Modal per crear i editar un projecte.

**Files:**
- Create: `src/components/projecte/ProjecteForm.tsx`

- [ ] **Crear el component**

```typescript
// src/components/projecte/ProjecteForm.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { FormInput } from '../ui/FormField'
import type { Projecte, ProjecteForm as PForm } from '../../lib/supabase-projectes'
import { emptyProjecte } from '../../lib/supabase-projectes'

interface Props {
  initial?: Partial<Projecte>
  onSave: (data: PForm) => Promise<void>
  onClose: () => void
}

export function ProjecteForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<PForm>({ ...emptyProjecte(), ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof PForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Cal indicar un nom per al projecte.'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en desar')
    }
    setSaving(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="bg-[#0f1729] border border-[#1e2d47] rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d47]">
            <h2 className="font-display font-bold text-lg tracking-widest uppercase text-slate-100">
              {initial?.id ? 'Editar projecte' : 'Nou projecte'}
            </h2>
            <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nom */}
            <FormInput label="Nom del projecte" value={form.nom} onChange={set('nom')} placeholder="Ex: Can Manel" required autoFocus />

            {/* Titular */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Titular de la instal·lació</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Nom / Raó social" value={form.titular_nom} onChange={set('titular_nom')} />
                <FormInput label="NIF / DNI" value={form.titular_nif} onChange={set('titular_nif')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Telèfon" value={form.titular_telefon} onChange={set('titular_telefon')} type="tel" />
                <FormInput label="Correu electrònic" value={form.titular_correu} onChange={set('titular_correu')} type="email" />
              </div>
            </div>

            {/* Adreça instal·lació */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-xs tracking-widest uppercase text-amber-500/70">Adreça de la instal·lació</h3>
              <div className="grid grid-cols-4 gap-3">
                <FormInput label="Tipus via" value={form.inst_tipus_via} onChange={set('inst_tipus_via')} placeholder="Carrer" />
                <div className="col-span-2"><FormInput label="Nom de la via" value={form.inst_nom_via} onChange={set('inst_nom_via')} /></div>
                <FormInput label="Núm." value={form.inst_numero} onChange={set('inst_numero')} />
              </div>
              <div className="grid grid-cols-5 gap-3">
                <FormInput label="Bloc" value={form.inst_bloc} onChange={set('inst_bloc')} />
                <FormInput label="Escala" value={form.inst_escala} onChange={set('inst_escala')} />
                <FormInput label="Pis" value={form.inst_pis} onChange={set('inst_pis')} />
                <FormInput label="Porta" value={form.inst_porta} onChange={set('inst_porta')} />
                <FormInput label="C.P." value={form.inst_cp} onChange={set('inst_cp')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Municipi" value={form.inst_poblacio} onChange={set('inst_poblacio')} />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="btn-ghost">Cancel·la</button>
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'Desant…' : 'Desa el projecte'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/components/projecte/ProjecteForm.tsx
git commit -m "feat(projectes): component ProjecteForm (modal crear/editar)"
```

---

## Task 5: Component `DocumentCard`

Card que mostra l'estat d'un document dins del projecte i permet crear-lo o obrir-lo.

**Files:**
- Create: `src/components/projecte/DocumentCard.tsx`

- [ ] **Crear el component**

```typescript
// src/components/projecte/DocumentCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Loader2 } from 'lucide-react'

export type DocStatus = {
  id: string
  estat: 'esborrany' | 'finalitzat'
  nom?: string
  route: string  // ruta per obrir: "/unifilar/UUID"
}

interface Props {
  icon: React.ReactNode
  label: string
  sublabel: string
  docs: DocStatus[]
  onCreate: () => Promise<void>
}

export function DocumentCard({ icon, label, sublabel, docs, onCreate }: Props) {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try { await onCreate() }
    catch { /* errors handled by parent */ }
    setCreating(false)
  }

  return (
    <div className="card flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-slate-200 text-[13px] leading-tight">{label}</div>
          <div className="text-[11px] text-slate-500 font-body mt-0.5">{sublabel}</div>
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        {docs.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(d.route)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-500 bg-ink-800/40 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left"
          >
            <span className={`text-[10px] font-mono font-semibold ${d.estat === 'finalitzat' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {d.estat === 'finalitzat' ? '✓' : '○'}
            </span>
            <span className="text-[12px] text-slate-300 font-body flex-1 truncate">{d.nom || 'Sense nom'}</span>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
          </button>
        ))}
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        className="btn-ghost text-sm w-full justify-center"
      >
        {creating
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creant…</>
          : <><Plus className="w-3.5 h-3.5" /> {docs.length === 0 ? 'Crear' : 'Afegir'}</>}
      </button>
    </div>
  )
}
```

- [ ] **Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/components/projecte/DocumentCard.tsx
git commit -m "feat(projectes): component DocumentCard"
```

---

## Task 6: Pàgina `ProjectePage`

Hub central del projecte: capçalera editable + 5 cards de documents.

**Files:**
- Create: `src/pages/ProjectePage.tsx`

- [ ] **Crear la pàgina**

```typescript
// src/pages/ProjectePage.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Pencil, Loader2, Activity, FileText, BookOpen, ClipboardCheck, Calculator } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate } from '../lib/supabase'
import {
  getProjecte, updateProjecte,
  prefillEsquemaUnifilar, prefillElec1, prefillElec3, prefillMemoriaDescriptiva, prefillMTD,
  type Projecte,
} from '../lib/supabase-projectes'
import { createEsquemaFromPlantilla, getEsquemes } from '../lib/supabase-esquemes'
import { createCertificatElec1, getCertificatsElec1 } from '../lib/supabase-elec1'
import { createElec3Doc, getElec3Docs } from '../lib/supabase-elec3'
import { createMemoriaDescriptiva, getMemoriesDescriptives } from '../lib/supabase-memoria-descriptiva'
import { saveMemoria, getMemorias } from '../lib/supabase'
import { defaultWizardData } from '../types'
import { useWizardStore } from '../stores/wizardStore'
import { DocumentCard } from '../components/projecte/DocumentCard'
import { ProjecteForm } from '../components/projecte/ProjecteForm'
import type { DocStatus } from '../components/projecte/DocumentCard'
import type { EsquemaUnifilar } from '../types/esquemaUnifilar'
import type { CertificatElec1 } from '../lib/supabase-elec1'
import type { Elec3Doc } from '../lib/supabase-elec3'
import type { MemoriaDescriptiva } from '../lib/supabase-memoria-descriptiva'
import type { Memoria } from '../types'
import toast from 'react-hot-toast'

export function ProjectePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, instalador } = useAuthStore()
  const { reset, setSolicitante, setUbicacion, setMemoriaId } = useWizardStore()

  const [projecte, setProjecte] = useState<Projecte | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // Documents per eina
  const [mtds, setMtds] = useState<Memoria[]>([])
  const [esquemes, setEsquemes] = useState<EsquemaUnifilar[]>([])
  const [elec1s, setElec1s] = useState<CertificatElec1[]>([])
  const [elec3s, setElec3s] = useState<Elec3Doc[]>([])
  const [mds, setMds] = useState<MemoriaDescriptiva[]>([])

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      getProjecte(id),
      getMemorias(user.id),
      getEsquemes(user.id),
      getCertificatsElec1(user.id),
      getElec3Docs(user.id),
      getMemoriesDescriptives(user.id),
    ]).then(([pRes, mtdRes, esqRes, e1Res, e3Res, mdRes]) => {
      if (pRes.error || !pRes.data) { toast.error('Projecte no trobat'); navigate('/projectes'); return }
      setProjecte(pRes.data as Projecte)
      // Filtrar per projecte_id
      setMtds(((mtdRes.data ?? []) as Memoria[]).filter((d: Memoria) => (d as Memoria & { projecte_id?: string }).projecte_id === id))
      setEsquemes(((esqRes.data ?? []) as EsquemaUnifilar[]).filter((d) => (d as EsquemaUnifilar & { projecte_id?: string }).projecte_id === id))
      setElec1s(((e1Res.data ?? []) as CertificatElec1[]).filter((d) => (d as CertificatElec1 & { projecte_id?: string }).projecte_id === id))
      setElec3s(((e3Res.data ?? []) as Elec3Doc[]).filter((d) => (d as Elec3Doc & { projecte_id?: string }).projecte_id === id))
      setMds(((mdRes.data ?? []) as MemoriaDescriptiva[]).filter((d) => (d as MemoriaDescriptiva & { projecte_id?: string }).projecte_id === id))
      setLoading(false)
    })
  }, [id, user, navigate])

  const handleEditSave = async (data: Omit<Projecte, 'id' | 'instalador_id' | 'created_at' | 'updated_at'>) => {
    if (!id) return
    await updateProjecte(id, data)
    setProjecte((p) => p ? { ...p, ...data } : p)
    toast.success('Projecte actualitzat')
  }

  // Creació de cada tipus de document
  const handleCreateMTD = async () => {
    if (!user || !projecte) return
    const prefill = prefillMTD(projecte)
    reset()
    setSolicitante(prefill.solicitante)
    setUbicacion(prefill.ubicacion_patch)
    setMemoriaId(null)
    // Crear borrador i obrir wizard amb projecte_id
    const newId = await saveMemoria(user.id, { ...defaultWizardData(), ...useWizardStore.getState().data }, 'borrador', undefined, id)
    setMemoriaId(newId)
    navigate('/wizard')
  }

  const handleCreateEsquema = async () => {
    if (!user || !projecte) return
    const newId = await createEsquemaFromPlantilla(user.id, 'habitatge_basica', projecte.nom, id, projecte)
    navigate(`/unifilar/${newId}`)
  }

  const handleCreateElec1 = async () => {
    if (!user || !projecte) return
    const newId = await createCertificatElec1(user.id, instalador, id, projecte)
    navigate(`/elec1/${newId}`)
  }

  const handleCreateElec3 = async () => {
    if (!user || !projecte) return
    const newId = await createElec3Doc(user.id, id, projecte)
    navigate(`/elec3/${newId}`)
  }

  const handleCreateMD = async () => {
    if (!user || !projecte) return
    const newId = await createMemoriaDescriptiva(user.id, id, projecte)
    navigate(`/memoria-descriptiva/${newId}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )
  if (!projecte) return null

  const adreça = [projecte.inst_nom_via, projecte.inst_numero, projecte.inst_cp, projecte.inst_poblacio]
    .filter(Boolean).join(', ')

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
        {/* Info titular */}
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

        {/* Grid de 5 eines */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="section-sub mb-4">Documents de l'expedient</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard
              icon={<FileText className="w-5 h-5 text-amber-400" />}
              label="Memòria Tècnica Descriptiva"
              sublabel="e-distribució"
              docs={mtds.map((d) => ({ id: d.id, estat: d.estado as 'esborrany' | 'finalitzat', nom: d.referencia_interna || d.wizard_data?.ubicacion?.municipio || 'MTD', route: `/pdf/${d.id}` }))}
              onCreate={handleCreateMTD}
            />
            <DocumentCard
              icon={<Activity className="w-5 h-5 text-amber-400" />}
              label="Esquema Unifilar"
              sublabel="Model ELEC 2"
              docs={esquemes.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/unifilar/${d.id}` }))}
              onCreate={handleCreateEsquema}
            />
            <DocumentCard
              icon={<Calculator className="w-5 h-5 text-amber-400" />}
              label="Memòria Tècnica de càlculs"
              sublabel="ELEC-3 · ITC-BT-19"
              docs={elec3s.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/elec3/${d.id}` }))}
              onCreate={handleCreateElec3}
            />
            <DocumentCard
              icon={<ClipboardCheck className="w-5 h-5 text-amber-400" />}
              label="Certificat d'instal·lació"
              sublabel="ELEC-1 Abril 2024"
              docs={elec1s.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom || d.titular_nom, route: `/elec1/${d.id}` }))}
              onCreate={handleCreateElec1}
            />
            <DocumentCard
              icon={<BookOpen className="w-5 h-5 text-amber-400" />}
              label="Memòria Descriptiva"
              sublabel="Document narratiu"
              docs={mds.map((d) => ({ id: d.id, estat: d.estat as 'esborrany' | 'finalitzat', nom: d.nom, route: `/memoria-descriptiva/${d.id}` }))}
              onCreate={handleCreateMD}
            />
          </div>
        </motion.div>

        <p className="text-[10px] text-slate-700 font-mono mt-10">
          Creat: {formatDate(projecte.created_at)} · Actualitzat: {formatDate(projecte.updated_at)}
        </p>
      </main>

      {editing && (
        <ProjecteForm
          initial={projecte}
          onSave={handleEditSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Possible error: `setMemoriaId` pot no existir al WizardStore — verificar. Si no existeix, usar `useWizardStore.getState().setMemoriaId`. Corregir si cal.

- [ ] **Commit**

```bash
git add src/pages/ProjectePage.tsx
git commit -m "feat(projectes): ProjectePage — hub amb 5 DocumentCards"
```

---

## Task 7: Pàgina `ProjecteList` (nova pantalla principal)

Llista de projectes amb els 5 indicadors d'estat.

**Files:**
- Create: `src/pages/ProjecteList.tsx`

- [ ] **Crear la pàgina**

```typescript
// src/pages/ProjecteList.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Zap, User, LogOut, ChevronRight, Trash2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { formatDate, signOut } from '../lib/supabase'
import {
  getProjectes, createProjecte, deleteProjecte,
  type Projecte, type ProjecteForm,
} from '../lib/supabase-projectes'
import { ProjecteForm as ProjecteFormModal } from '../components/projecte/ProjecteForm'
import toast from 'react-hot-toast'

export function ProjecteList() {
  const navigate = useNavigate()
  const { user, instalador, logout } = useAuthStore()
  const [projectes, setProjectes] = useState<Projecte[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getProjectes(user.id).then(({ data }) => {
      setProjectes((data as Projecte[]) ?? [])
      setLoading(false)
    })
  }, [user])

  const handleCreate = async (data: ProjecteForm) => {
    if (!user) return
    const newId = await createProjecte(user.id, data)
    toast.success('Projecte creat')
    navigate(`/projectes/${newId}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Esborrar aquest projecte? Els documents associats no s\'esborraran.')) return
    setDeleting(id)
    const { error } = await deleteProjecte(id)
    if (error) { toast.error(error.message); setDeleting(null); return }
    setProjectes((prev) => prev.filter((p) => p.id !== id))
    toast.success('Projecte esborrat')
    setDeleting(null)
  }

  const handleLogout = async () => {
    await signOut()
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e2d47] px-6 py-4 flex items-center justify-between bg-[#0a0f1e]/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-ink-900" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-base tracking-widest uppercase text-slate-100">Quadre</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/perfil')} className="btn-ghost">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{instalador?.nombre_completo?.split(' ')[0] ?? 'Perfil'}</span>
          </button>
          <button onClick={handleLogout} className="btn-ghost text-slate-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <p className="section-sub mb-1">Els meus expedients</p>
            <h1 className="font-display font-bold text-4xl tracking-wide uppercase text-slate-100">Projectes</h1>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nou projecte
          </button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-500 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : projectes.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="font-display font-bold text-xl uppercase text-slate-400 mb-2">Cap projecte</h3>
            <p className="text-slate-600 text-sm font-body mb-6">Crea el teu primer expedient per organitzar tots els documents d'una instal·lació.</p>
            <button onClick={() => setShowNew(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Nou projecte
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projectes.map((p, i) => {
              const adreça = [p.inst_nom_via, p.inst_numero, p.inst_cp, p.inst_poblacio].filter(Boolean).join(', ')
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card-hover"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/projectes/${p.id}`)}>
                      <div className="font-body font-semibold text-slate-200 text-[15px] truncate">{p.nom || 'Sense nom'}</div>
                      {adreça && <div className="text-[12px] text-slate-500 font-mono truncate mt-0.5">{adreça}</div>}
                      {p.titular_nom && <div className="text-[11px] text-slate-600 font-body mt-0.5">{p.titular_nom}</div>}
                      <div className="text-[10px] text-slate-700 font-mono mt-1">{formatDate(p.updated_at)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => navigate(`/projectes/${p.id}`)} className="btn-ghost p-2">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="btn-ghost p-2 text-slate-600 hover:text-red-400"
                      >
                        {deleting === p.id
                          ? <span className="w-4 h-4 border border-slate-600 border-t-red-400 rounded-full animate-spin block" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-[#1e2d47]/50 px-6 py-3 text-center">
        <span className="text-[10px] font-mono text-slate-700">Quadre · v {__APP_VERSION__}</span>
      </footer>

      {showNew && (
        <ProjecteFormModal
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit**

```bash
git add src/pages/ProjecteList.tsx
git commit -m "feat(projectes): ProjecteList — llista de projectes amb CRUD"
```

---

## Task 8: Actualitzar App.tsx i Dashboard

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Afegir imports i rutes a `src/App.tsx`**

Afegir imports just sota de `import { Elec1List } from './pages/Elec1List'`:

```typescript
import { ProjecteList } from './pages/ProjecteList'
const ProjectePage = lazy(() => import('./pages/ProjectePage').then((m) => ({ default: m.ProjectePage })))
```

Canviar la ruta `/` perquè apunti a `ProjecteList` (els usuaris nous veuran projectes primer):

```typescript
// Canviar:
<Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
// Per:
<Route path="/" element={<RequireAuth><ProjecteList /></RequireAuth>} />
<Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
```

Afegir les noves rutes just després de `/dashboard`:

```typescript
<Route path="/projectes" element={<RequireAuth><ProjecteList /></RequireAuth>} />
<Route
  path="/projectes/:id"
  element={
    <RequireAuth>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1e2d47] border-t-amber-500 rounded-full animate-spin" /></div>}>
        <ProjectePage />
      </Suspense>
    </RequireAuth>
  }
/>
```

- [ ] **Afegir link "Sense projecte" al Dashboard**

Al `Dashboard.tsx`, afegir un link al capdamunt (sota el header) que permeti tornar als projectes, i canviar "Eines disponibles" per un link discret a la llista de projectes:

```typescript
// Afegir a la capçalera del Dashboard, just sota el botó de LogOut:
<button onClick={() => navigate('/')} className="btn-ghost text-sm">
  ← Projectes
</button>
```

I canviar el títol de la pàgina:

```typescript
// h1 actual: "Memòria Tècnica Descriptiva"
// Mantenir igual però afegir un breadcrumb discret:
<p className="section-sub mb-1">Documents sense projecte · Memòria Tècnica Descriptiva</p>
```

- [ ] **Verificar que compila i fa build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Commit**

```bash
git add src/App.tsx src/pages/Dashboard.tsx
git commit -m "feat(projectes): rutes /projectes i /projectes/:id; Dashboard com a vista de documents sense projecte"
```

---

## Task 9: Breadcrumb als 5 editors

Quan un document pertany a un projecte, la capçalera de l'editor mostra el nom del projecte i permet tornar-hi.

**Files:**
- Modify: `src/pages/EsquemaUnifilarEditor.tsx`
- Modify: `src/pages/Elec1Editor.tsx`
- Modify: `src/pages/Elec3Editor.tsx`
- Modify: `src/pages/MemoriaDescriptivaEditor.tsx`
- Modify: `src/pages/Wizard.tsx`

**Patró** (idèntic als 5 editors):

1. Quan es carrega el document, llegir `projecte_id` de les dades.
2. Si existeix, fer `getProjecte(projecte_id)` per obtenir el nom.
3. Mostrar a la capçalera: `← Nom del projecte` com a botó que navega a `/projectes/:id`.

- [ ] **Modificar `EsquemaUnifilarEditor.tsx`**

Afegir estat i càrrega del projecte just sota de `const [loading, setLoading] = useState(true)`:

```typescript
const [projecteId, setProjecteId] = useState<string | null>(null)
const [projecteNom, setProjecteNom] = useState('')
```

Al `useEffect` que carrega l'esquema, afegir just després de `store.loadFromServer(data)`:

```typescript
const pid = (data as EsquemaUnifilar & { projecte_id?: string }).projecte_id ?? null
setProjecteId(pid)
if (pid) {
  getProjecte(pid).then(({ data: p }) => { if (p) setProjecteNom((p as import('../lib/supabase-projectes').Projecte).nom) })
}
```

Afegir import: `import { getProjecte } from '../lib/supabase-projectes'`

A la capçalera, canviar el botó `ArrowLeft` per:

```typescript
{projecteId ? (
  <button onClick={() => navigate(`/projectes/${projecteId}`)} className="btn-ghost text-sm gap-1.5">
    <ArrowLeft className="w-4 h-4" />
    <span className="hidden sm:inline text-amber-400/80">{projecteNom || 'Projecte'}</span>
  </button>
) : (
  <button onClick={() => navigate('/unifilar')} className="btn-ghost p-2">
    <ArrowLeft className="w-4 h-4" />
  </button>
)}
```

- [ ] **Repetir el mateix patró als altres 4 editors**

Per cada editor, el canvi és idèntic:
- `Elec1Editor.tsx`: `projecte_id` de `CertificatElec1`, navegar a `/elec1` si no hi ha projecte
- `Elec3Editor.tsx`: `projecte_id` de `Elec3Doc`, navegar a `/elec3` si no hi ha projecte
- `MemoriaDescriptivaEditor.tsx`: `projecte_id` de `MemoriaDescriptiva`, navegar a `/memoria-descriptiva` si no hi ha projecte
- `Wizard.tsx` (PDFViewer no cal — el wizard és el que crea la MTD): llegir `projecte_id` del WizardStore. Afegir al WizardStore un camp `projecteId: string | null` i un setter `setProjecteId`. La `ProjectePage` l'hi passa quan crea la MTD.

- [ ] **Verificar que compila**

```bash
npm run build 2>&1 | tail -8
```

Ha de fer build sense errors.

- [ ] **Commit**

```bash
git add src/pages/EsquemaUnifilarEditor.tsx src/pages/Elec1Editor.tsx \
        src/pages/Elec3Editor.tsx src/pages/MemoriaDescriptivaEditor.tsx \
        src/pages/Wizard.tsx src/stores/wizardStore.ts
git commit -m "feat(projectes): breadcrumb als 5 editors"
```

---

## Task 10: Build final, migració i deploy

- [ ] **Executar la migració a Supabase** (si no s'ha fet al Task 1)

```bash
cd "/Users/migueldelolmofuente/Antigravity/memoria eléctrica"
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  supabase db query --linked -f supabase/schema-projectes.sql
```

- [ ] **Build final**

```bash
npm run build 2>&1 | tail -8
```

Resultat esperat: `✓ built in ...ms` sense errors TypeScript.

- [ ] **Push per desplegar**

```bash
git push
```

El GitHub Actions desplegarà a memoria.sinilos.com en ~35s.

- [ ] **Verificar en producció**

Accedir a https://memoria.sinilos.com:
1. La pantalla principal hauria de mostrar "Projectes" (llista buida inicialment)
2. Crear un nou projecte amb nom + adreça + titular
3. Obrir el projecte → veure les 5 cards
4. Crear una MTD des del projecte → verificar que el solicitant i la ubicació es pre-emplenen
5. Tornar al projecte → la MTD apareix a la card corresponent amb el seu estat
6. Crear un ELEC-1 des del projecte → verificar que els camps del titular i adreça es pre-emplenen

---

## Resum de fitxers modificats

| Fitxer | Estat |
|---|---|
| `supabase/schema-projectes.sql` | NOU |
| `src/lib/supabase-projectes.ts` | NOU |
| `src/components/projecte/ProjecteForm.tsx` | NOU |
| `src/components/projecte/DocumentCard.tsx` | NOU |
| `src/pages/ProjecteList.tsx` | NOU |
| `src/pages/ProjectePage.tsx` | NOU |
| `src/lib/supabase-esquemes.ts` | MODIFICAT |
| `src/lib/supabase-elec1.ts` | MODIFICAT |
| `src/lib/supabase-elec3.ts` | MODIFICAT |
| `src/lib/supabase-memoria-descriptiva.ts` | MODIFICAT |
| `src/lib/supabase.ts` | MODIFICAT |
| `src/stores/wizardStore.ts` | MODIFICAT (+ projecteId) |
| `src/pages/EsquemaUnifilarEditor.tsx` | MODIFICAT (breadcrumb) |
| `src/pages/Elec1Editor.tsx` | MODIFICAT (breadcrumb) |
| `src/pages/Elec3Editor.tsx` | MODIFICAT (breadcrumb) |
| `src/pages/MemoriaDescriptivaEditor.tsx` | MODIFICAT (breadcrumb) |
| `src/pages/Wizard.tsx` | MODIFICAT (breadcrumb) |
| `src/pages/Dashboard.tsx` | MODIFICAT (link ← Projectes) |
| `src/App.tsx` | MODIFICAT (rutes noves) |
