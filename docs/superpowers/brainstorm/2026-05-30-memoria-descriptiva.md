# Memòria Descriptiva — document narratiu

**Data**: 2026-05-30
**Estat**: brainstorming inicial — sense spec aprovada

## Què és

Document narratiu **lliure**, no plantilla oficial. Explica en llenguatge planer:
- Què és l'inmoble
- Com és la instal·lació elèctrica
- Quines decisions tècniques s'han pres i per què

És el complement humà a l'expedient: mentre MTD/ELEC-3/ELEC-1 són formularis i taules, la Memòria Descriptiva justifica les decisions.

## Estructura del document de referència

(Font: `Memória descriptiva Can Manel.pdf`)

Exemple:
> Can Manel és una antiga masia situada als afores de Centelles que ha estat totalment remodelada per a convertir-la en un habitatge unifamiliar no adossat de dues plantes i zona exterior.
> Rep l'electricitat a una Caixa de Protecció i Mesura situada a l'entrada de la finca, i mitjançant una derivació individual subterrània de 10 mm² de secció i 10 metres de longitud, arribem al quadre de distribució de la casa.
> [...]
> Al tractar-se d'una electrificació elevada (tant per superfície com per la quantitat d'elements instal·lats) hem triplicat els circuits C1 i C2 [...]

Seccions típiques:
1. **Descripció de l'immoble** — què és, ubicació, ús.
2. **Escomesa i derivació individual** — com arriba l'electricitat, secció, longitud.
3. **Quadre de distribució** — on és, què conté.
4. **Treballs realitzats** — què va fer l'instal·lador.
5. **Justificacions tècniques** — per què s'han triplicat circuits, subdividit, etc.
6. **Signatura del redactor** — nom, RASIC, adreça.

## Enfocament escollit

**Opció A pura — editor de text lliure amb plantilla** (decidit 2026-05-30).

L'usuari escriu lliure dins de seccions predefinides (com un Notion/Google Docs minimalista). Plantilla buida amb títols. Cap LLM ni generació automàtica de text.

Motivació: cap altra eina de la suite usa IA. Mantenir Memòria Descriptiva sense LLM evita dependència externa, costos per token i prompts a mantenir; conserva la coherència del producte.

## Dades reutilitzables

De la MTD i el Unifilar es poden **prefilar** algunes dades:
- Tipus d'instal·lació (habitatge unifamiliar, local...) → primera frase
- Secció i tipus de derivació individual → segon paràgraf
- Tipus d'electrificació (bàsica/elevada) → justificació tècnica
- Nom + RASIC + adreça del redactor → signatura

## Decisions preses

- **Adjunts amb fotos (2026-05-30)**: sí, opcionals. Si l'usuari no n'aporta, la secció de fotos no apareix al PDF (no deixa hueco buit). Reutilitzar el mòdul de fotos de la MTD.

## Decisions obertes

1. **Format del PDF**: A4 amb un sol estil tipogràfic, sense logos? O permetre logo de l'instal·lador a la capçalera (com a la MTD)?
2. **Signatura**: imatge de signatura digital al final (com la MTD) o només nom + RASIC mecanografiat?
3. **Persistència**: cada memòria descriptiva s'associa a un projecte/instal·lació o és un document independent (com els altres)?

## Riscos

- **Sobrespecificació**: si la fem massa estructurada perd la flexibilitat narrativa que defineix el document.
- **Validació**: cap administració valida el contingut d'aquesta memòria; el risc és que sigui útil o no a l'usuari, no que sigui rebutjada.

## Fora d'abast d'aquesta fase

- Generació automàtica amb LLM (descartat — vegeu "Enfocament escollit").
- Sistema de plantilles per tipus d'obra (només una plantilla genèrica inicial).
