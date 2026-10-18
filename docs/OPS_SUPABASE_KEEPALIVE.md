# Supabase keep-alive

## Per què existeix

El projecte de Supabase (pla gratuït) es pausa automàticament després de dies sense activitat. Com que no tots els usuaris entren cada setmana, `memoria-electrica` s'ha pausat diverses vegades, deixant l'app sense base de dades (errors 500 / timeouts).

Dada clau, mesurada el 2026-08-13: **el projecte rep exactament 1 petició al dia i cap més** — la del propi keep-alive. No hi ha trànsit real d'usuaris entre sessions d'en Xesco.

## Solució vigent (des del 2026-08-13)

Heartbeat **d'escriptura** cada 6 hores, no una lectura diària.

A la base de dades:

- Taula `public.keep_alive`: una sola fila (`id = 1`, amb un `CHECK` que ho garanteix), columnes `last_ping timestamptz` i `pings bigint`.
- Funció `public.keep_alive_ping()` — `SECURITY DEFINER`, `search_path = public` — que fa `UPDATE ... SET last_ping = now(), pings = pings + 1` i retorna el timestamp.
- **La taula està tancada a `anon`**: RLS activat i sense cap `GRANT`. La clau anònima (que és pública, va al bundle) només té `EXECUTE` sobre la funció. Així el keep-alive no obre cap porta a les dades de l'app: el màxim que pot fer un tercer amb la clau és incrementar un comptador.

Al workflow `.github/workflows/supabase-keep-alive.yml`:

```yaml
on:
  schedule:
    - cron: '17 */6 * * *'   # 4 cops al dia
  workflow_dispatch:
```

Fa dues coses a cada execució:

1. `POST /rest/v1/rpc/keep_alive_ping` — l'escriptura real. El pas falla si la resposta no és un timestamp.
2. `GET /rest/v1/projectes?select=id&limit=1` — una lectura sobre una taula real de l'app, perquè el trànsit s'assembli a ús normal i no a un ping sintètic.

Es pot disparar a mà des de la pestanya *Actions* (`workflow_dispatch`).

3. Últim pas del workflow: es **re-habilita a si mateix** (`gh api -X PUT .../actions/workflows/supabase-keep-alive.yml/enable`, amb `permissions: actions: write`). Vegeu l'incident del 2026-10-18: sense això, GitHub desactiva el cron als 60 dies sense commits.

## Historial d'incidents

- **2026-07-17**: primer incident. Es crea el workflow amb cron **setmanal** (`0 8 * * 1`).
- **2026-07-24**: es torna a pausar tot i que el ping setmanal havia corregut bé 4 dies abans. El cron només havia corregut **una vegada** des que es va crear. Es passa a **diari**.
- **2026-08-13**: arriba avís de Supabase per "activitat insuficient en més de 7 dies". **El cron no estava trencat**: havia corregut cada dia i en verd del 25/07 al 12/08, sense cap fallada, i les peticions arribaven al projecte correcte (verificat als logs). El projecte no va arribar a pausar-se (`ACTIVE_HEALTHY`).

  **Causa arrel**: un sol `GET` diari que a més retornava `[]` (la taula `memorias` és buida) no mou el detector d'auto-pausa de Supabase. És el senyal més feble possible: una lectura, sense escriptura, un cop cada 24 h. D'aquí el canvi a heartbeat d'escriptura cada 6 h.

- **2026-10-18**: el projecte es va **pausar de debò** (`INACTIVE`). Cap relació amb Supabase ni amb el heartbeat: GitHub va posar el workflow en estat `disabled_inactivity` el 2026-10-12 (60 dies sense commits al repo; l'últim era del 2026-08-13). L'última execució del cron va ser el 12/10 i 7 dies després Supabase va pausar.

  **Resolució**: `gh workflow enable 315018329`; reactivació per API (`POST /v1/projects/{ref}/restore`, ~3 min fins a `ACTIVE_HEALTHY`, dades intactes); i el pas d'auto-reactivació al workflow (commit `c8bacf7`).

  **Lliçó**: el primer que cal mirar és `gh workflow list --all` (¿`disabled_inactivity`?), no el codi del cron.

## Diagnòstic sense navegador (Management API)

`.env.supabase` (a l'arrel del projecte, fora de git) conté `SUPABASE_ACCESS_TOKEN` i `SUPABASE_PROJECT_REF`. Amb això es pot diagnosticar tot des del terminal, molt més ràpid i fiable que mirar el dashboard:

```bash
set -a && . ./.env.supabase && set +a

# Estat real del projecte (ACTIVE_HEALTHY / INACTIVE / PAUSING...)
curl -s https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# SQL arbitrari (p. ex. comprovar que el heartbeat escriu de veritat)
curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"select * from public.keep_alive"}'
```

Logs de peticions (`/v1/projects/{ref}/analytics/endpoints/logs.all?sql=...`): serveixen per veure **quantes peticions reals rep el projecte**. Dos paranys:

- Cal passar `iso_timestamp_start` **i** `iso_timestamp_end`; amb només `start` retorna 0 files i sembla que no hi ha trànsit.
- La retenció al pla gratuït és d'aproximadament **1 dia**, així que no serveix per a anàlisis històriques.

Alternativa ràpida per saber si està pausat:

```bash
dig @8.8.8.8 moctmdicimxivthkrzhs.supabase.co +short
```

Sense IP (NXDOMAIN) → pausat. Amb IPs → actiu.

## Com reactivar-lo manualment

El ping automàtic **no** pot reactivar un projecte ja pausat (una BD pausada no respon a la REST API). Es pot fer **sense navegador** per la Management API (`POST /v1/projects/$SUPABASE_PROJECT_REF/restore` amb el mateix token; sondejar `GET /v1/projects` fins a `ACTIVE_HEALTHY`), o bé des del dashboard:

1. https://supabase.com/dashboard/project/moctmdicimxivthkrzhs
2. Al banner "El proyecto está en pausa", clicar **"Proyecto de currículum"** — és una traducció trencada de Supabase per a "Resume project" (no té res a veure amb un currículum).
3. Confirmar "Reanudar" al modal.
4. La restauració pot trigar de minuts a hores.

## Si torna a passar

Comprovar en aquest ordre, **abans** d'especular:

```bash
gh workflow list --all                                      # 0. està 'disabled_inactivity'?
gh run list --workflow=supabase-keep-alive.yml --limit 15   # 1. corre el cron?
# 2. escriu de veritat? -> select * from keep_alive (veure Management API a dalt);
#    'pings' ha de pujar 4 cops al dia
# 3. estat real del projecte -> GET /v1/projects
```

Si el heartbeat d'escriptura cada 6 h tampoc no és suficient, **la següent passa ja no és tocar el cron**: cap quantitat de pings artificials garanteix el pla gratuït si l'heurística de Supabase busca ús real. Tocaria valorar el pla **Pro**.
