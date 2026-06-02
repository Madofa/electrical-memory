# Quadre — Formularis oficials com a plantilles

> Spec aprovada 2026-06-02

## Objectiu

Substituir els PDFs personalitzats dels tres documents oficials (ELEC-1, ELEC-2, ELEC-3) per la generació sobre el formulari oficial en blanc de la Generalitat / e-distribució. L'output és el formulari oficial amb les dades de l'usuari omplerts.

---

## ELEC-1 — Certificat d'instal·lació (XFA)

### Plantilla
`public/templates/elec1-blank.pdf` — el formulari oficial `ELEC1CertificatInstalElectricaBT.pdf` copiat tal qual. És un formulari XFA (Adobe LiveCycle). S'obre correctament amb Adobe Reader; el resultat s'imprimeix o signa digitalment des d'Adobe Reader.

### Mecanisme de farciment
El formulari XFA emmagatzema els valors com a XML intern (`/datasets/data`). El procés:
1. Llegir els bytes del PDF (fetch a `public/templates/elec1-blank.pdf`)
2. Localitzar i descomprimir el stream XML de dades (FlateDecode, ~259 KB)
3. Parsejar el XML amb `DOMParser`
4. Establir el valor de cada camp (`<field><value>text</value></field>`)
5. Re-serialitzar, recomprimir amb `pako.deflate` (ja al projecte)
6. Substituir el stream original al PDF i ajustar la longitud de l'objecte
7. Generar blob i descarregar

### Mapeig de camps XFA → model de dades

**Bloc titular** (repetit 3 vegades: titular, empresa instal·ladora, instal·lació):
| Camp XFA | Font de dades |
|---|---|
| `NomCognoms` (titular) | `cert.titular_nom` |
| `NIF` (titular) | `cert.titular_nif` |
| `CBO_TipusVia` (titular) | `cert.titular_tipus_via` |
| `TXT_NomVia` (titular) | `cert.titular_nom_via` |
| `TXT_Num` (titular) | `cert.titular_numero` |
| `TXT_Bloc` (titular) | `cert.titular_bloc` |
| `TXT_Escala` (titular) | `cert.titular_escala` |
| `TXT_Pis` (titular) | `cert.titular_pis` |
| `TXT_Porta` (titular) | `cert.titular_porta` |
| `TXT_CodiPostal` (titular) | `cert.titular_cp` |
| `TXT_Poblacio` (titular) | `cert.titular_poblacio` |
| `TXT_Tel` (titular) | `cert.titular_telefon` |
| `TXT_Correu` (titular) | `cert.titular_correu` |

**Bloc empresa instal·ladora**:
| Camp XFA | Font de dades |
|---|---|
| `NomCognoms` (empresa) | `instalador.empresa_nombre` o `instalador.nombre_completo` |
| `TXT_Rasic` | `instalador.numero_carnet` |
| `NIF` (empresa) | `instalador.empresa_cif` o `instalador.dni_nie` |
| `NomCognomsInstalador` | `instalador.nombre_completo` |
| `TXT_Categoria` | `instalador.tipo` → 'Bàsica' / 'Mitja' |
| `DNIInstallador` | `instalador.dni_nie` |
| `CBO_TipusVia` (empresa) | `instalador.empresa_tipus_via` |
| `TXT_NomVia` (empresa) | `instalador.empresa_nom_via` |
| `TXT_Num` (empresa) | `instalador.empresa_numero` |
| `TXT_CodiPostal` (empresa) | `instalador.empresa_cp` |
| `TXT_Poblacio` (empresa) | `instalador.empresa_poblacio` |
| `TXT_Tel` (empresa) | `instalador.empresa_telefono` |
| `TXT_Correu` (empresa) | `instalador.empresa_email` |

**Bloc instal·lació**:
| Camp XFA | Font de dades |
|---|---|
| `CBO_TipusVia` (instal.) | `cert.inst_tipus_via` |
| `TXT_NomVia` (instal.) | `cert.inst_nom_via` |
| `TXT_Num` (instal.) | `cert.inst_numero` |
| `TXT_Bloc` (instal.) | `cert.inst_bloc` |
| `TXT_Escala` (instal.) | `cert.inst_escala` |
| `TXT_Pis` (instal.) | `cert.inst_pis` |
| `TXT_Porta` (instal.) | `cert.inst_porta` |
| `TXT_CodiPostal` (instal.) | `cert.inst_cp` |
| `TXT_Poblacio` (instal.) | `cert.inst_poblacio` |

**Característiques**:
| Camp XFA | Font de dades |
|---|---|
| `CHK_Nova` / `CHK_Ampliacio` / `CHK_Modificacio` | `cert.tipus_actuacio` → checkbox corresponent |
| `TXT_CUPS` | `cert.cups` |
| `OPT_P1` / `OPT_P2` / `OPT_Memoria` | `cert.classificacio` |
| `TXT_Us` | `cert.us_installacio` |

**Dades tècniques**:
| Camp XFA | Font de dades |
|---|---|
| `TXT_PotenciaMax` | `cert.potencia_kw` |
| `TXT_Tensio` | `cert.tensio_v` |
| `TXT_Circuits` | `cert.num_circuits` |
| `TXT_Calibre` | `cert.calibre_fusibles_cgp_a` |
| `TXT_SeccioLGA` | `cert.seccio_lga_mm2` |
| `TXT_MaterialConductor` | `cert.material_conductor` |
| `TXT_ResistenciaConductors` | `cert.resist_aillament_conductors_mt` |
| `TXT_AillamentTerra` | `cert.resist_aillament_mt` |
| `TXT_ResistenciaTerra` | `cert.resist_terra_ohm` |
| `TXT_Interruptor` | `cert.intensitat_iga_a` |
| `TXT_UbicacioComptadors` | `cert.ubicacio_comptadors` ← **camp nou** |
| `OPT_Si` / `OPT_No` | `cert.te_subministrament_complementari` ← **camp nou** |
| `TXT_Observacions` | `cert.observacions` |

### Camps nous a afegir al model `CertificatElec1`
- `ubicacio_comptadors: string` — on estan els comptadors ('Armari', 'Escala', 'Altra', etc.)
- `te_subministrament_complementari: boolean` — Sí/No
- Camps d'adreça de l'empresa per separat (tipus_via, nom_via, numero, cp, poblacio) — ara és un string únic

### Implementació: `src/lib/xfa-fill.ts`
```
fillXfaForm(pdfBytes: Uint8Array, values: Record<string, string>): Uint8Array
```
La funció localitza el stream XFA de dades, el descomprimeix, modifica els valors al XML i el reinjecta. Exportada i usada des del component Elec1Editor al botó de descàrrega.

---

## ELEC-2 — Esquema Unifilar (imatge escanejada)

### Plantilla
`public/templates/elec2-blank.pdf` — el formulari oficial `EsquemaUnifilarELEC2.pdf` copiat tal qual. El PDF conté una imatge escanejada d'alta resolució (9768×13936 px, CCITT Fax).

### Mecanisme de generació
pdf-lib permet embebre una pàgina d'un PDF existent i dibuixar-hi a sobre:
1. `PDFDocument.load(elec2BlankBytes)` — cargar plantilla
2. `doc.embedPdf(elec2BlankBytes, [0])` → `embeddedPage`
3. Crear nova pàgina A4 portrait (595×842 pt)
4. `page.drawPage(embeddedPage, { x:0, y:0, width:595, height:842 })` — fons oficial
5. Dibuixar el diagrama de circuits al damunt (zona superior del formulari) amb `page.drawLine`, `page.drawRectangle`, `page.drawText`
6. Omplir els camps del peu amb `page.drawText` a coordenades mesurades

### Coordenades dels camps del peu (A4 portrait, origen baix-esquerra)
A mesurar durant la implementació sobre el PDF original. Camps a omplir:
- EMPRESA DISTRIBUÏDORA
- SECCIÓ CONNEXIÓ DE SERVEI
- TENSIÓ
- EMPLAÇAMENT
- INSTAL·LADOR AUTORITZAT
- TITULAR
- DATA I SIGNATURA INSTAL·LADOR

### Diagrama de circuits
Zona de dibujo aproximada: franja superior (y ~200–780 pt del formulari A4). Els circuits actuals (array de `Circuit`) es mapegen en ordre als slots C, E, G, I, K, M, O, Q, S, U, W, Y (màxim 12). Per cada circuit:
- Línia vertical des de la fila POTÈNCIA fins al bus
- Valor potència kW a la part superior
- Nom receptor (text horitzontal, truncat si cal)
- Secció mm²
- Símbol PIA amb amperatge
- Connexió al diferencial corresponent
- Símbol IGA al centre
- Caixa ICP amb línia de punts
- Símbol comptador (cercle kWh)
- Símbols de terra

### Implementació: `src/lib/pdf-elec2.ts`
```
generateElec2PDF(
  circuits: Circuit[],
  diferencials: Diferencial[],
  iga: number,
  capcalera: DadesCapcalera
): Promise<Uint8Array>
```

---

## ELEC-3 — Memòria Tècnica de Càlculs

### Plantilla
`public/templates/elec3-blank.pdf` — conversió manual del `MemoriaTecnicaELEC3.doc` oficial a PDF (Word → Fitxer → Exportar → PDF). **Pas de setup únic** que fa el developer (Miguel: obre el .doc a Word, Fitxer > Exportar > PDF, desa com `elec3-blank.pdf` a `public/templates/`).

Un cop generat el PDF, inspeccionar els noms de camp AcroForm amb:
```
npm run inspect-elec3  # script temporal que llista els camps amb pdf-lib
```

Si la conversió Word conserva els camps FORMTEXT com a AcroForm: omplir amb `form.getTextField(nom).setText(valor)`.  
Si no (PDF pla): omplir amb `page.drawText` a coordenades, igual que ELEC-2.

### Canvis al model de dades `Tram`
El formulari oficial té **files fixes** (no noms lliures) i **19 columnes** (vs. les 10 actuals).

**Files fixes del formulari:**
1. `derivacio_individual` (A — B) — sempre la primera fila
2. `C_D` fins a `Y_Z` — 12 derivacions (C-D, E-F, G-H, I-J, K-L, M-N, O-P, Q-R, S-T, U-V, W-X, Y-Z)

**9 camps nous per `Tram`:**
| Camp | Tipus | Descripció |
|---|---|---|
| `tipus_conductor` | `'Cu' \| 'Al'` | Material conductor |
| `tensio_nominal_aillament` | `string` | Ex: "0,45/0,75" |
| `canal_sense_tub` | `string` | Sistema sense tub (ex: "B") |
| `canal_tub_encastat_mm` | `number \| null` | Ø tub encastat en mm |
| `canal_tub_sense_encas_mm` | `number \| null` | Ø tub sense encastar en mm |
| `canal_enterrat_prof_m` | `number \| null` | Profunditat conductor enterrat en m |
| `aillament_instal_kohm` | `number \| null` | Resistència aïllament en kΩ |
| `conduc_neutre_mm2` | `number \| null` | Secció conductor neutre en mm² |
| `conduc_protec_mm2` | `number \| null` | Secció conductor de protecció en mm² |

**Migració Supabase**: `ALTER TABLE calculs_elec3 ADD COLUMN` per cadascun dels 9 camps.

### Pàgina 2 del formulari
El formulari oficial té una pàgina 2 amb dades resum. Camps a omplir:
- TITULAR (nom)
- ÚS A QUE ES DESTINA LA INSTAL·LACIÓ (ex: "Vivenda Elevada")
- EMPLAÇAMENT (carrer, núm, pis, porta)
- LOCALITAT + NCP (codi postal)
- N/C/P: Nova, Ampliació o Reforma (checkbox)
- EMPRESA DISTRIBUÏDORA
- INTERRUPTOR DIFERENCIAL: fins a 3 files (Circuit, Nombre, In A, Sensibilitat mA)
- SECCIÓ DE LA DERIVACIÓ INDIV. (mm²)
- RESISTÈNCIA TERRA DE PROTEC. (Ω)
- CARACTERÍSTIQUES EDIFICI + SUPERFÍCIE LOCAL (m²)
- Potència màxima admissible (kW)
- TENSIÓ (V)
- Potència a instal·lar (kW)
- INTENSITAT INTERRUPTOR GENERAL AUTOMÀTIC (A)
- DATA I SIGNATURA INSTAL·LADOR

Algunes d'aquestes dades ja estan al model `Elec3Doc` (via projecte associat). Les que falten s'afegiran al formulari de l'editor.

### Implementació: `src/lib/pdf-elec3.ts`
```
generateElec3PDF(
  doc: Elec3Doc,
  instalador: Instalador,
  projecte?: Projecte
): Promise<Uint8Array>
```

---

## Dependències noves
- `pdf-lib` — per a ELEC-2 i ELEC-3 (embedPdf, drawText, drawLine, AcroForm)
- `pako` — ja al projecte, s'usa per a la compressió XFA del ELEC-1

## Arxius a afegir a `public/templates/`
- `elec1-blank.pdf` ← còpia directa de `EsquemaUnifilarELEC2.pdf` (atenció: és l'ELEC-1!)
- `elec2-blank.pdf` ← còpia directa de `EsquemaUnifilarELEC2.pdf`
- `elec3-blank.pdf` ← conversió manual del .doc (pas de setup)

## Arxius que desapareixen
- `src/components/pdf/CertificatElec1PDF.tsx` — reemplaçat per `xfa-fill.ts`
- `src/components/pdf/EsquemaUnifilarPDF.tsx` — reemplaçat per `pdf-elec2.ts`
- `src/components/pdf/Elec3PDF.tsx` — reemplaçat per `pdf-elec3.ts`
