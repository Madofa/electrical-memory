# Quadre — Roadmap de la suite

## Objectiu

Cobrir el conjunt complet de documents que un instal·lador autoritzat necessita per legalitzar una instal·lació elèctrica de baixa tensió a Catalunya. Cinc eines independents (arquitectura tipus C, sense projecte compartit entre documents).

## Estat de les eines

| # | Eina | Estat | Documentació | Referència visual |
|---|------|-------|--------------|---------------------|
| 1 | **Memòria Tècnica Descriptiva** (MTD e-distribució) | ✅ En producció | [PDF_SPEC.md](../PDF_SPEC.md) | — |
| 2 | **Esquema Unifilar** (Model ELEC 2) | 📝 Spec aprovada — pendent implementar | [spec](superpowers/specs/2026-05-30-esquema-unifilar-design.md) | `Esquema unifilar Can Manel.pdf` |
| 3 | **ELEC-3 Memòria Tècnica** (taula de càlculs) | 💭 Brainstorming inicial | [brainstorm](superpowers/brainstorm/2026-05-30-elec3-calculos.md) | `MemoriaTecnicaELEC3 Can Manel.pdf` |
| 4 | **ELEC-1 Certificat d'instal·lació** | 💭 Brainstorming inicial | [brainstorm](superpowers/brainstorm/2026-05-30-elec1-certificat.md) | `ELEC1CertificatInstalElectricaBT Can Manel.pdf` |
| 5 | **Memòria Descriptiva** (narrativa) | 💭 Brainstorming inicial | [brainstorm](superpowers/brainstorm/2026-05-30-memoria-descriptiva.md) | `Memória descriptiva Can Manel.pdf` |

## Referències visuals (locals)

La carpeta `Referencias nuevas Herramietnas/` conté els PDFs reals de l'expedient "Can Manel" com a exemple del que ha de produir cada eina. **No es publiquen al repositori** perquè contenen dades personals (DNI, NIF, telèfon, adreça) — estan a `.gitignore`.

## Decisions globals

- **Arquitectura independent (tipus C)**: cada eina és una app independent dins de la mateixa SPA. No hi ha "projecte" compartit que aglutini les cinc.
- **Stack comú**: React 19 + TypeScript + Vite + Supabase (auth + Postgres + RLS) + html2pdf.js per a l'export.
- **Plantilles d'instal·lació**: el conjunt de tipus (habitatge bàsica/elevada, local comercial, taller, etc.) es comparteix entre la MTD i l'Esquema Unifilar (a `src/lib/plantilles-installacio.ts` quan es creï).
- **Idioma de la UI**: català, ja que totes les eines són per a la Generalitat de Catalunya (l'única excepció és la MTD per a e-distribució que admet castellà).

## Ordre suggerit

1. (Fet) MTD
2. **Esquema Unifilar** — pròxima a implementar; la més diferenciada visualment (SVG) i la que aporta més valor a curt termini.
3. **ELEC-3** — depèn dels mateixos circuits que el Unifilar; convé compartir el model de dades.
4. **ELEC-1** — formulari oficial relativament estàtic; un cop ELEC-3 calcula les seccions, ELEC-1 només els recull.
5. **Memòria Descriptiva** — l'última perquè és majoritàriament redacció lliure; pot reutilitzar dades dels passos previs i en el seu defecte demanar text al redactor.
