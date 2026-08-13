-- Keep-alive de Supabase (aplicat en producció el 2026-08-13)
--
-- Evita l'auto-pausa del pla gratuït generant activitat d'ESCRIPTURA real.
-- Un GET diari de només lectura no era suficient: veure
-- docs/OPS_SUPABASE_KEEPALIVE.md, incident del 2026-08-13.
--
-- La taula queda TANCADA a `anon`: RLS activat i cap GRANT sobre la taula.
-- La clau anònima (pública, va al bundle) només pot executar la funció, que
-- toca una única fila. Així el keep-alive no obre cap accés a dades de l'app.

create table if not exists public.keep_alive (
  id        smallint primary key default 1,
  last_ping timestamptz not null default now(),
  pings     bigint      not null default 0,
  constraint keep_alive_single_row check (id = 1)
);

insert into public.keep_alive (id) values (1) on conflict (id) do nothing;

alter table public.keep_alive enable row level security;

create or replace function public.keep_alive_ping()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  update public.keep_alive
     set last_ping = now(), pings = pings + 1
   where id = 1
  returning last_ping;
$$;

revoke all on public.keep_alive from anon, authenticated;
revoke all on function public.keep_alive_ping() from public;
grant execute on function public.keep_alive_ping() to anon, authenticated;

-- Ús des del workflow .github/workflows/supabase-keep-alive.yml:
--   POST <SUPABASE_URL>/rest/v1/rpc/keep_alive_ping
-- Comprovació (Management API, veure el doc):
--   select id, last_ping, pings from public.keep_alive;
