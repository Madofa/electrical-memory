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

## Enfocaments possibles

### Opció A — editor de text lliure amb plantilla
L'usuari escriu lliure dins de seccions predefinides (com un Notion/Google Docs minimalista). Plantilla buida amb títols.

### Opció B — formulari estructurat → text generat
L'usuari respon a preguntes (tipus d'immoble, escomesa subterrània/aèria, decisions especials...) i nosaltres generem el text narratiu.

### Opció C — IA assistida
L'usuari aporta dades clau i un LLM genera el primer esborrany que després edita.

**Preferit inicialment**: Opció A pura. La narrativa és pràcticament lliure i provar de generar text amb IA aquí pot xocar amb el feedback històric ("no usar IA quan no aporta valor evident"). Comencem manual; afegir IA opcional al final si Miguel ho demana.

## Dades reutilitzables

De la MTD i el Unifilar es poden **prefilar** algunes dades:
- Tipus d'instal·lació (habitatge unifamiliar, local...) → primera frase
- Secció i tipus de derivació individual → segon paràgraf
- Tipus d'electrificació (bàsica/elevada) → justificació tècnica
- Nom + RASIC + adreça del redactor → signatura

## Decisions obertes

1. **Format del PDF**: A4 amb un sol estil tipogràfic, sense logos? O permetre logo de l'instal·lador a la capçalera (com a la MTD)?
2. **Signatura**: imatge de signatura digital al final (com la MTD) o només nom + RASIC mecanografiat?
3. **Persistència**: cada memòria descriptiva s'associa a un projecte/instal·lació o és un document independent (com els altres)?
4. **Adjunts**: la memòria descriptiva del PDF de referència no porta fotos, però seria útil permetre adjuntar fotos de l'obra (com fa la MTD).

## Riscos

- **Sobrespecificació**: si la fem massa estructurada perd la flexibilitat narrativa que defineix el document.
- **Validació**: cap administració valida el contingut d'aquesta memòria; el risc és que sigui útil o no a l'usuari, no que sigui rebutjada.

## Fora d'abast d'aquesta fase

- Generació automàtica amb LLM (només si s'aprova explícitament).
- Sistema de plantilles per tipus d'obra (només una plantilla genèrica inicial).
- Adjunts amb fotos (es pot afegir després copiant el mòdul de la MTD).
