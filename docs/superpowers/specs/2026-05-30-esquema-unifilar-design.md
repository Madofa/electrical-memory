# Esquema Unifilar — Editor i generador (Model ELEC 2)

**Data**: 2026-05-30
**Estat**: Aprovat — pendent d'implementació

## Context

L'aplicació actual (`memoria eléctrica`) genera **Memòries Tècniques Descriptives** (MTD) per a e-distribució. És la primera de cinc eines previstes per cobrir el conjunt complet de documents que un instal·lador autoritzat necessita per legalitzar una instal·lació elèctrica de baixa tensió a Catalunya:

1. ✅ **Memòria Tècnica Descriptiva** (e-distribució) — ja existeix
2. 🆕 **Esquema Unifilar** (Model ELEC 2) — *aquest spec*
3. 🆕 **ELEC-3 Memòria Tècnica** (taula de càlculs) — fase posterior
4. 🆕 **ELEC-1 Certificat d'instal·lació** — fase posterior
5. 🆕 **Memòria Descriptiva** (document narratiu) — fase posterior

Cada eina és independent (decisió aprovada: arquitectura tipus C). No hi ha un "projecte" compartit entre documents en aquesta fase.

## Objectiu

Permetre a l'instal·lador generar el document **Esquema Unifilar Model ELEC 2** de la Generalitat de Catalunya partint d'una plantilla del tipus d'instal·lació, editant els circuits amb una interfície d'arrossegar i deixar caure, i visualitzant el diagrama en temps real abans d'exportar el PDF final.

## Decisions de disseny

### Enfocament UX: Plantilles + llista estructurada (C+B combinats)

Es descarta el canvas lliure tipus CAD (massa complex per al cas d'ús). S'implementa:

- **Pas 1**: l'usuari tria el tipus d'instal·lació → es carrega una plantilla amb els circuits típics
- **Pas 2**: l'usuari edita la llista de circuits (taula amb files arrossegables)
- **Pas 3**: el diagrama SVG es genera automàticament a partir de les dades
- **Pas 4**: exportació a PDF

### Format del diagrama: Model ELEC 2 oficial (banda horitzontal)

Format **horitzontal en bandes** amb les etiquetes laterals a l'esquerra. Diferent del clàssic "arbre vertical" que s'usa fora de Catalunya.

Capes (de dalt a baix):
1. **POTÈNCIA kW** — valor numèric per columna
2. **RECEPTORS** — nom del circuit en text diagonal (-60°)
3. **SECCIONS mm²** — secció de cable per circuit (ex: 2×1,5+1,5)
4. **PIA A** — símbol IEC de petit interruptor automàtic amb amperatge
5. **DIFERENCIALS A/mA** — símbol amb rectangle agrupant 1-N PIAs
6. **INT. GENERAL AUTOMÀTIC A** — IGA central
7. **CAIXA PER A ICP** — caixa buida per a comptador ICP
8. **COMPTADORS** — kWh + presa de terra

**Crítica de disseny**: NO és una taula amb divisors de columnes. És un esquema obert amb símbols connectats per línies. La part inferior (IGA → ICP → Comptador) convergeix al centre.

**Alineació vertical**: encara que no hi hagi línies divisòries, els valors de cada capa (potència, receptor, secció, PIA) han d'estar perfectament alineats verticalment amb el seu circuit. Llegibilitat per sobre de l'austeritat visual.

### Layout de pantalla: mixt

- **Editor de circuits** dalt — taula amb columnes: ⠿ (drag), Nom circuit, Potència kW, Secció, PIA (A), Diferencial (grup), ✕ (esborrar)
- **Previsualització** baix — l'SVG del Model ELEC 2 actualitzant-se en viu
- Botó superior dret per canviar plantilla
- Botó inferior dret per generar PDF

### Tipus d'instal·lació amb plantilla

Els mateixos que `UsoFinca` del wizard actual:
- Habitatge unifamiliar (electrificació bàsica) — preset C1-C5
- Habitatge unifamiliar (electrificació elevada) — preset C1-C9
- Local comercial
- Taller
- Magatzem
- Oficina
- Garatge
- Industrial
- Comunitat de veïns
- Altre (sense preset, llista buida)

Les plantilles són estàtiques en codi (no en BD). Defineixen circuits típics amb noms, potències i seccions per defecte segons normativa REBT.

## Arquitectura

### Nou model de dades

**Tipus TypeScript** (a `src/types/esquemaUnifilar.ts`):

```ts
export type TipusInstallacio =
  | 'habitatge_basica'
  | 'habitatge_elevada'
  | 'local_comercial'
  | 'taller'
  | 'magatzem'
  | 'oficina'
  | 'garatge'
  | 'industrial'
  | 'comunitat'
  | 'altre'

export interface Circuit {
  id: string                 // uuid local per a drag-and-drop
  nom: string                // ex: "C1 Llum Dalt"
  potencia_kw: number
  seccio: string             // ex: "2×1,5+1,5"
  pia_amperatge: number      // 10, 16, 25, ...
  diferencial_grup: string   // id del grup de diferencial al qual pertany
}

export interface Diferencial {
  id: string
  amperatge: number          // ex: 40
  sensibilitat_ma: number    // ex: 30
}

export interface DadesCapcalera {
  empresa_distribuidora: string
  seccio_connexio: string    // "10mm²"
  tensio: string             // "230V" o "400V"
  emplacament: string
  titular: string
}

export interface EsquemaUnifilar {
  id: string
  instalador_id: string
  nom: string                // referència del projecte (ex: "Can Manel")
  tipus_installacio: TipusInstallacio
  circuits: Circuit[]
  diferencials: Diferencial[]
  iga_amperatge: number      // ex: 40
  capcalera: DadesCapcalera
  estat: 'esborrany' | 'finalitzat'
  created_at: string
  updated_at: string
}
```

**Esquema Supabase** (`supabase/schema-esquema-unifilar.sql`):

```sql
create table if not exists public.esquemes_unifilars (
  id                  uuid primary key default gen_random_uuid(),
  instalador_id       uuid not null references public.instaladores(id) on delete cascade,
  nom                 text not null default '',
  tipus_installacio   text not null default 'habitatge_basica',
  circuits            jsonb not null default '[]',
  diferencials        jsonb not null default '[]',
  iga_amperatge       integer not null default 40,
  capcalera           jsonb not null default '{}',
  estat               text not null default 'esborrany' check (estat in ('esborrany','finalitzat')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index on public.esquemes_unifilars (instalador_id, updated_at desc);

alter table public.esquemes_unifilars enable row level security;

create policy "Instal·lador veu els seus esquemes"
  on public.esquemes_unifilars for select
  using (instalador_id = auth.uid());

create policy "Instal·lador crea esquemes"
  on public.esquemes_unifilars for insert
  with check (instalador_id = auth.uid());

create policy "Instal·lador actualitza els seus esquemes"
  on public.esquemes_unifilars for update
  using (instalador_id = auth.uid());

create policy "Instal·lador esborra els seus esquemes"
  on public.esquemes_unifilars for delete
  using (instalador_id = auth.uid());
```

### Components nous

```
src/
├── pages/
│   ├── EsquemaUnifilarList.tsx    # llista d'esquemes (similar a Dashboard)
│   └── EsquemaUnifilarEditor.tsx  # editor principal
├── components/
│   └── esquema-unifilar/
│       ├── PlantillaSelector.tsx  # tria tipus instal·lació
│       ├── CircuitTaula.tsx       # taula editable + drag
│       ├── CircuitRow.tsx         # fila d'un circuit
│       ├── DiferencialAgrupador.tsx  # UI per agrupar circuits per diferencial
│       ├── CapcaleraForm.tsx      # dades capçalera (distribuidora, tensió...)
│       └── UnifilarSVG.tsx        # el component que dibuixa l'SVG en viu
├── stores/
│   └── esquemaUnifilarStore.ts    # estat actual de l'esquema en edició
├── lib/
│   ├── plantilles-installacio.ts  # circuits per defecte per tipus
│   └── supabase-esquemes.ts       # CRUD Supabase
└── pdf/
    └── EsquemaUnifilarPDF.tsx     # versió PDF del SVG (sense controls)
```

### Plantilles per tipus

Exemple per `habitatge_basica` (a `lib/plantilles-installacio.ts`):

```ts
export const PLANTILLA_HABITATGE_BASICA: Circuit[] = [
  { nom: 'C1 Il·luminació',         potencia_kw: 2.3,  seccio: '2×1,5+1,5', pia_amperatge: 10, diferencial_grup: 'dif1' },
  { nom: 'C2 Preses generals',       potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16, diferencial_grup: 'dif1' },
  { nom: 'C3 Cuina i forn',          potencia_kw: 5.75, seccio: '2×6+6',     pia_amperatge: 25, diferencial_grup: 'dif2' },
  { nom: 'C4 Rentadora/Rentaplats',  potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 20, diferencial_grup: 'dif2' },
  { nom: 'C5 Bany i auxiliars',      potencia_kw: 3.68, seccio: '2×2,5+2,5', pia_amperatge: 16, diferencial_grup: 'dif2' },
]
```

(Equivalents per electrificació elevada, locals, garatges, etc.)

### Drag-and-drop

S'usa **`@dnd-kit/core` + `@dnd-kit/sortable`** (modern, accessible, lleuger). No s'usa `react-dnd` (pesant i amb backend separat per a tàctil).

### Generació SVG

Component `UnifilarSVG.tsx` rep `circuits[]`, `diferencials[]`, `iga`, `capcalera` i renderitza l'SVG complet. El mateix component s'usa per:
- **Previsualització** al editor (interactiu, amb zoom)
- **PDF** (envoltat per `<div>` per a html2pdf.js)

Layout algorithm:
1. Distribuir els circuits horitzontalment amb separació fixa (90-110px entre columnes)
2. Calcular l'amplada total = num_circuits × 110 + marges
3. Renderitzar PIAs cadascun en la seva columna
4. Per cada diferencial, agrupar els circuits al seu grup amb una línia horitzontal i un símbol de diferencial centrat al grup
5. Tots els diferencials connecten a un bus horitzontal a `y = ~320`
6. Bus → IGA central → ICP → Comptador (tots a `x = total_width/2`)

### Integració amb el Dashboard

Al Dashboard actual s'afegeix una nova targeta "Esquema Unifilar" amb el seu botó "Nou esquema" i una llista dels esquemes existents.

## Fora d'abast (no a aquesta fase)

- ELEC-3, ELEC-1, Memòria Descriptiva (fases posteriors)
- Càlcul automàtic de seccions/caigudes de tensió (això és el que farà ELEC-3)
- Editor visual del diagrama (drag directe sobre l'SVG)
- Símbols personalitzats per receptor (només els del Model ELEC 2)
- Múltiples instal·lacions trifàsiques (només monofàsic en aquesta fase)
- Esquemes amb subdistribució (només quadre principal)

## Riscos i punts d'atenció

1. **Llegibilitat de l'SVG**: els valors numèrics han d'estar perfectament alineats amb els símbols, encara que no hi hagi línies de cuadrícula. Cal proves amb 4-15 circuits.
2. **Format de la secció**: "2×1,5+1,5" és el format normatiu. S'ha de validar que l'usuari escrigui bé (autocompletat amb les seccions estàndard 1,5 / 2,5 / 4 / 6 / 10 / 16 mm²).
3. **Tipografia PDF**: html2pdf.js pot tenir problemes amb símbols Unicode (subíndexs C₁, fletxes). Cal validar amb proves.
4. **Scroll horitzontal**: amb molts circuits l'SVG creix. El PDF haurà d'usar pàgina apaïsada (A3 si cal).
5. **Persistència en edició**: autoguardat cada N segons a Supabase (com fa el wizard actual amb la MTD).
