# Quadre

Suite per a instal·ladors elèctrics de baixa tensió a Catalunya. Genera, signa i exporta cada document oficial en minuts.

## Estat de les eines

| Eina | Estat |
|---|---|
| Memòria Tècnica Descriptiva (e-distribució) | ✅ En producció |
| Esquema Unifilar (Model ELEC 2) | 📝 Spec aprovada — pendent implementar |
| ELEC-3 Memòria Tècnica (taula de càlculs) | 💭 Brainstorming inicial |
| ELEC-1 Certificat d'instal·lació | 💭 Brainstorming inicial |
| Memòria Descriptiva | 💭 Brainstorming inicial |

Detall i decisions: [docs/ROADMAP.md](docs/ROADMAP.md)

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Supabase (auth + Postgres + RLS + Storage)
- @react-pdf/renderer (PDF vectorial real)
- zustand (estat) + react-hook-form + zod
- Deploy automàtic a memoria.sinilos.com via GitHub Actions

## Desenvolupament local

```bash
npm install
cp .env.example .env   # i omple les claus de Supabase
npm run dev
```

Open http://localhost:5173

## Build & deploy

`git push origin main` desplega automàticament a memoria.sinilos.com (via GitHub Actions). Es pot disparar manualment amb `npm run deploy` (requereix accés SSH al servidor).
