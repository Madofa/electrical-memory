# ELEC-3 — Memòria Tècnica (taula de càlculs)

**Data**: 2026-05-30
**Estat**: brainstorming inicial — sense spec aprovada

## Què és

Document oficial de la Generalitat amb la **taula de càlcul de caigudes de tensió per tram**. És el suport tècnic numèric de tot l'expedient (l'Esquema Unifilar és la visió gràfica; ELEC-3 és la visió tabular amb números justificats).

## Estructura del PDF de referència

Capçalera amb seccions i columnes fixes (font: `MemoriaTecnicaELEC3 Can Manel.pdf`):

**Columnes per tram**:
- TRAM (identificador: "Derivació individual A-B", "C-D", "E-F", etc.)
- Càrrega simultània %
- Potència kW
- cos φ
- Intensitat A
- Secció per fase mm²
- Longitud m
- Moment elèctric kW·m
- Caiguda tensió parcial %
- Caiguda tensió total %

**Característiques del conductor** (camps per tram):
- Tipus de conductor
- Tensió nominal d'aïllament
- Tipus de canalització: sense tub / sota tub (encastat o no) / conductor enterrat profunditat m
- Aïllament + factor k

## Dades d'entrada

Idealment es reutilitzen les del **Esquema Unifilar**:
- circuits (nom, potència, secció, PIA)
- IGA
- secció de connexió, tensió

Camps **nous** que no estan al Unifilar:
- longitud de cada tram (m)
- cos φ (sovint 0.9-1)
- càrrega simultània % (sovint 100% per circuits domèstics)
- tipus exacte de conductor (RZ1-K, ES07Z1-K, etc.)
- tipus de canalització per tram

## Decisions obertes

1. **Reutilització de dades**: ELEC-3 comparteix model amb Esquema Unifilar (mateixa BD) o és independent?
   - **A favor de compartir**: evita duplicar circuits, propagar canvis automàticament.
   - **En contra**: acobla dues eines que el roadmap declarava "independents".
   - Proposta inicial: crear un "Projecte ELEC" comú només si l'usuari ho activa explícitament (opcional, no obligatori).
2. **Càlcul automàtic vs manual**: l'eina calcula la caiguda de tensió a partir de potència/longitud/secció (`ΔU% = (P × L) / (γ × U × S)`) o l'usuari introdueix els valors a mà?
   - Preferent: càlcul automàtic amb opció d'override per cel·la.
3. **Validacions REBT**: marcar en vermell quan la caiguda total supera els llindars (3% il·luminació, 5% altres usos)?
4. **Format del PDF**: la plantilla oficial té un layout molt rígid (taula amb caselles delimitades). Cal valorar si fem un PDF que imiti el model oficial exactament o un format propi més llegible.

## Riscos

- **Precisió dels càlculs**: error en una fórmula = expedient rebutjat. Cal una bateria de tests amb casos coneguts.
- **Coherència amb el Unifilar**: si l'usuari modifica un circuit a un dels documents, l'altre no s'actualitza automàticament (decisió pendent #1).

## Fora d'abast d'aquesta fase

- Càlcul de seccions òptimes (l'usuari posa la secció i nosaltres validem la caiguda).
- Càlcul de proteccions (intensitats nominals de PIAs/diferencials).
- Suport per a sistemes trifàsics complexos (només monofàsic + trifàsic bàsic).
