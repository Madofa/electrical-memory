# Projectes — Hub central d'expedients

**Data**: 2026-06-01
**Estat**: Aprovat — pendent de pla d'implementació

## Context

Quadre té 5 eines per generar documents elèctrics. Fins ara cada eina és independent: l'usuari entra a `/unifilar`, crea un esquema, després va a `/elec1` i torna a escriure el mateix titular i adreça. No hi ha cap concepte d'instal·lació que agrupe tots els documents d'un mateix expedient.

## Objectiu

Afegir un **Projecte** com a entitat organitzadora. Un projecte representa una instal·lació (p.ex. "Can Manel") i pot contenir un document de cada tipus. Des del projecte es creen i accedeixen tots els documents, amb pre-relleno automàtic de les dades compartides.

## Model de dades

### Nova taula `projectes`

```sql
create table public.projectes (
  id              uuid primary key default gen_random_uuid(),
  instalador_id   uuid not null references public.instaladores(id) on delete cascade,
  nom             text not null default '',
  estat           text not null default 'actiu' check (estat in ('actiu','tancat')),

  -- Titular del futur contracte de subministrament
  titular_nom     text not null default '',
  titular_nif     text not null default '',
  titular_telefon text not null default '',
  titular_correu  text not null default '',

  -- Adreça de la instal·lació
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

-- RLS: cada instal·lador veu i gestiona els seus projectes
alter table public.projectes enable row level security;
create policy "select" on public.projectes for select using (instalador_id = auth.uid());
create policy "insert" on public.projectes for insert with check (instalador_id = auth.uid());
create policy "update" on public.projectes for update using (instalador_id = auth.uid());
create policy "delete" on public.projectes for delete using (instalador_id = auth.uid());
```

### Columna `projecte_id` als 5 tipus de document

```sql
alter table public.memorias              add column projecte_id uuid references public.projectes(id) on delete set null;
alter table public.esquemes_unifilars    add column projecte_id uuid references public.projectes(id) on delete set null;
alter table public.certificats_elec1     add column projecte_id uuid references public.projectes(id) on delete set null;
alter table public.calculs_elec3         add column projecte_id uuid references public.projectes(id) on delete set null;
alter table public.memories_descriptives add column projecte_id uuid references public.projectes(id) on delete set null;
```

`projecte_id` és opcional (`NULL` = document sense projecte). Tots els documents existents continuen funcionant sense canvis.

## Navegació

### Dashboard (redisseny)

- **Secció principal**: llista de projectes amb nom, adreça i 5 indicadors d'estat (✓ finalitzat / ○ esborrany / – no creat)
- **Botó "Nou projecte"**: formulari amb `nom`, adreça de la instal·lació i dades del titular
- **Secció "Sense projecte"** (colapsable al final): documents existents sense `projecte_id`. Des d'aquí es poden assignar a un projecte o crear-ne un de nou a partir d'ells

### Pàgina del projecte (`/projectes/:id`)

**Capçalera:**
- Nom del projecte (editable inline)
- Titular (nom, NIF, telèfon, correu)
- Adreça de la instal·lació
- Botó "Editar dades del projecte"

**Grid de 5 eines:**

Cada card mostra el tipus de document i el seu estat:
- **Creat (finalitzat)**: badge ✓ + botó "Obrir"
- **Creat (esborrany)**: badge ○ + botó "Obrir"
- **No creat**: botó "Crear" → crea el document pre-rellenat i redirigeix a l'editor

Si hi ha múltiples documents d'un mateix tipus (permès), la card mostra una llista petita de tots.

**Des de qualsevol editor:**
- La capçalera mostra el nom del projecte com a breadcrumb amb link de tornada a `/projectes/:id`

## Pre-relleno en crear

Còpia estàtica en el moment de creació. Canvis posteriors al projecte no propaguen als documents ja creats.

| Camp del Projecte | MTD | Esquema Unif. | ELEC-1 | ELEC-3 | Mem. Desc. |
|---|---|---|---|---|---|
| `nom` | referencia_interna | nom | nom | nom | nom |
| `titular_nom` | solicitante.razon_social | capcalera.titular | titular_nom | — | — |
| `titular_nif` | solicitante.cif_nif | — | titular_nif | — | — |
| `titular_telefon` | solicitante.telefono | — | titular_telefon | — | — |
| `titular_correu` | solicitante.email | — | titular_correu | — | — |
| `inst_nom_via` | ubicacion.direccion | capcalera.emplacament* | inst_nom_via | — | — |
| `inst_numero` | ubicacion.numero | — | inst_numero | — | — |
| `inst_cp` | ubicacion.cp | — | inst_cp | — | — |
| `inst_poblacio` | ubicacion.municipio | — | inst_poblacio | — | — |

*Esquema Unifilar: `emplacament` = `inst_nom_via + ' ' + inst_numero + ', ' + inst_poblacio`

## Migració de documents existents

- Documents sense `projecte_id` → apareixen a "Sense projecte" al dashboard
- **Assignar a projecte existent**: dropdown de projectes disponibles
- **Crear projecte des d'un document**: extreu titular i adreça del document i crea el projecte

No és obligatori migrar. Els documents sense projecte funcionen igual que ara.

## Rutes noves

| Ruta | Component | Descripció |
|---|---|---|
| `/projectes` | ProjecteList | Llista de projectes (nova pantalla principal) |
| `/projectes/nou` | ProjecteForm (modal o pàgina) | Formulari de nou projecte |
| `/projectes/:id` | ProjectePage | Hub del projecte amb els 5 documents |

## Fora d'abast

- Sincronització bidireccional de dades entre documents (làs dades es copien una vegada)
- Compartir projectes entre instal·ladors
- Plantilles de projecte predefinides
- Estats avançats d'expedient (p. ex. integració amb OVT/RITSIC)
