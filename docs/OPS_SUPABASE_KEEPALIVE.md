# Supabase keep-alive

## Per què existeix

El projecte de Supabase (pla gratuït) es pausa automàticament després de dies sense activitat a l'API. Com que no tots els usuaris entren cada setmana, el projecte `memoria-electrica` s'ha pausat diverses vegades, deixant `memoria.sinilos.com` sense base de dades (errors 500 / timeouts a l'app).

## Solució

Workflow `.github/workflows/supabase-keep-alive.yml`: fa un `SELECT id LIMIT 1` diari a la taula `memorias` via REST API amb `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (secrets del repo), per mantenir el projecte actiu. També es pot disparar a mà des de la pestanya *Actions* (`workflow_dispatch`).

```yaml
on:
  schedule:
    - cron: '0 8 * * *'   # cada dia a les 8:00 UTC
  workflow_dispatch:
```

## Historial d'incidents

- **2026-07-17**: primer incident detectat, es crea el workflow amb cron **setmanal** (`0 8 * * 1`).
- **2026-07-24**: el projecte torna a pausar-se tot i que el ping setmanal s'havia executat correctament 4 dies abans (2026-07-20). Causa: el cron només havia corregut **una vegada** des que es va crear i el marge setmanal és massa just. Es canvia el cron a **diari**.

## Com comprovar si està pausat

```bash
dig @8.8.8.8 <project-ref>.supabase.co +short
```

Si no torna cap IP (NXDOMAIN), el projecte està pausat. Si torna IPs, l'API respon (encara que sigui amb 401 sense credencials — això és normal i indica que el projecte està actiu).

## Com reactivar-lo manualment

El ping automàtic **no** pot reactivar un projecte ja pausat (una BD pausada no respon a la REST API). Cal entrar al dashboard:

1. https://supabase.com/dashboard/project/moctmdicimxivthkrzhs
2. Al banner "El proyecto está en pausa", clicar **"Proyecto de currículum"** — és una traducció trencada de Supabase per a "Resume project" (no té res a veure amb un currículum).
3. Confirmar "Reanudar" al modal.
4. La restauració pot trigar de minuts a hores; mentrestant `memoria.sinilos.com` no respon.

## Si torna a passar després del fix diari

Comprovar primer que el workflow s'ha estat executant:

```bash
gh run list --workflow=supabase-keep-alive.yml --limit 15
```

Si corre bé i tot i així es pausa, probablement no és per inactivitat (revisar bitllet/límits del pla a Supabase) i caldria valorar passar a Pro.
