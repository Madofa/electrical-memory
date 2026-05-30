# ELEC-1 — Certificat d'instal·lació elèctrica de baixa tensió

**Data**: 2026-05-30
**Estat**: brainstorming inicial — sense spec aprovada

## Què és

**Formulari oficial de la Generalitat de Catalunya** (revisió Abril 2024) que certifica que la instal·lació compleix el REBT. És el document que registra l'instal·lador davant l'administració quan acaba una instal·lació nova o una reforma.

Format: plantilla rígida, casellejada com qualsevol formulari administratiu.

## Estructura del PDF de referència

(Font: `ELEC1CertificatInstalElectricaBT Can Manel.pdf`)

### Titular de la instal·lació
- Raó social / Nom i cognoms
- NIF/DNI
- Adreça: tipus via, nom via, núm., bloc, escala, pis, porta, CP, població
- Telèfon, correu electrònic

### Empresa instal·ladora
- Raó social / Nom i cognoms
- Núm. registre RASIC
- NIF/DNI
- **Persona instal·ladora**: nom, categoria (Bàsica / Especialista), DNI/NIE
- Adreça de l'empresa instal·ladora

### Dades de la instal·lació
- (Pendent llegir la resta del PDF — tipus d'instal·lació, ubicació, potència contractada, etc.)

### Declaracions i signatura
- Declaració responsable de compliment del REBT
- Signatura del titular
- Signatura del professional instal·lador

## Dades d'entrada

Es poden reutilitzar **gairebé totes** de l'expedient previ:
- Titular → mateix que el solicitant de la MTD
- Empresa instal·ladora → mateix instal·lador (Supabase user)
- Ubicació de la instal·lació → ja la tenim a la MTD
- Potència, seccions, circuits → de l'Esquema Unifilar i ELEC-3

L'ELEC-1 hauria de ser **el document més senzill de generar** perquè totes les seves dades ja existeixen als documents anteriors.

## Decisions obertes

1. **Origen de les dades**: l'usuari les ha d'omplir altre cop o se les ofereix prebuides des de la MTD/Unifilar?
   - Proposta: si existeix una MTD o Unifilar per a la mateixa adreça, oferir importar-les.
2. **Categoria de l'instal·lador**: Bàsica vs Especialista — això ja és part del perfil (`tipo` a la BD d'instaladors). Reutilitzar directament.
3. **Signatura digital**: el PDF de referència té una signatura digital amb segell de temps (`Signat digitalment per ... Data: 2025.01.09 19:20:14`). El html2pdf.js no genera signatura digital — només una imatge de signatura. Cal decidir si això és suficient per a presentar el document o si s'ha d'exportar i signar amb Autofirma/AOC fora de l'eina.
4. **Format del PDF**: imitar exactament el model oficial (recomanat per evitar rebuig administratiu) o reescriure'l net.

## Riscos

- **Compliment estricte del format**: la Generalitat tendeix a rebutjar documents amb format diferent del model oficial. Cal verificar que el PDF generat passi com a equivalent.
- **Validació de RASIC**: el número de registre s'hauria de validar (format, no expirat) — no és viable per ara però sí marcar-ho com a millora futura.

## Fora d'abast d'aquesta fase

- Signatura digital real (només imatge de signatura).
- Integració amb OVT / RITSIC per a presentació automàtica.
- Verificació en línia del RASIC.
