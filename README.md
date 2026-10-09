# Reasoning & Contractual English Trainer

Aplicación web (HTML + CSS + JavaScript ES6, sin backend) para entrenar razonamiento lógico e inglés contractual.
**Regla de oro: ningún ejercicio se muestra sin haber sido generado, resuelto y validado automáticamente** (`RANDOM → SOLVE → VALIDATE → ACCEPT`).

## 1. Cómo ejecutarla

- **Opción A:** abrir `index.html` con doble clic (funciona desde `file://`: no usa módulos ES ni `fetch`).
- **Opción B:** servidor estático, p. ej. `python3 -m http.server 8080` y abrir <http://localhost:8080>.
- Tailwind se carga desde su CDN como mejora opcional (con `preflight` desactivado). **Toda la interfaz está maquetada en `css/styles.css`**, así que funciona igual sin conexión.

Módulos: **A** Planificación de recursos (álgebra de intervalos) · **B** Restricciones posicionales (5/6/7 elementos) · **C** Lógica de calendario · **D** Inglés contractual y avanzado (vocabulario, concordancia, preposiciones, sinónimos/antónimos, inglés contractual, terminología FIDIC/PM, lectura e inferencia) · **E** Patrones inductivos (figuras de triángulos y cuadrados con casillas vacías / verdes con rayas / azules con puntos; ver §9).

**Idioma:** la aplicación arranca en **inglés** y se puede cambiar a **español** con los botones `EN | ES` de la cabecera (o con `?lang=es`). El cambio afecta a toda la interfaz **y** a los enunciados, reglas y explicaciones de los ejercicios; si se cambia en mitad de un ejercicio se reconstruye el *mismo* ejercicio (misma semilla) en el nuevo idioma, sin perder el cronómetro ni la selección. El módulo D mantiene siempre en inglés la pregunta y las opciones (es un test de inglés); lo que cambia es la instrucción y la explicación. La elección se guarda en `localStorage`.
Niveles: Basic / Advanced / Expert (cambian el algoritmo de generación, no solo el texto). Modos: Entrenamiento (cronómetro ascendente) y Contrarreloj (60/75/90 s; al agotarse cuenta como fallo y se muestra la solución).

Atajos de teclado en un ejercicio: `A`–`E` elige opción, `Enter` comprueba; en el resultado `Enter` pasa al siguiente.

## 2. Estructura

```
index.html
css/styles.css
js/
  lib/       i18n · i18n-en · i18n-es          (librería de idiomas)
             figures · sequences · figures-svg (librería de figuras y secuencias inductivas)
  engines/   random · difficulty · intervals · solver · explanation · validator · generator
  modules/   positional · scheduling · scheduling-kinds · calendar · english · inductive
  data/      vocabulary · grammar · templates · notes-en · pools · fallbacks (autogenerado, por idioma)
  statistics.js  storage.js  timer.js  state.js
  ui/        dom · visuals · dashboard · exercise · result · stats · debug
  app.js
tests/       tests.js (Node + navegador) · index.html
tools/       load-engine.js · build-fallbacks.js
```

## 3. Arquitectura

Capas separadas: **UI** (`js/ui`, solo DOM) → **STATE** (`state.js`, flujo de sesión sin DOM) → **ENGINE** (generación/validación/explicación) → **MODULES** (un generador + un verificador por módulo) → **DATA** (bancos de preguntas, plantillas, fallbacks). Todo cuelga del espacio de nombres `RT` (scripts clásicos, el orden de carga está en `index.html`).

- **Puntuación** (`statistics.js`): `score = BASE × DIFFICULTY_MULTIPLIER × TIME_FACTOR × STREAK_FACTOR` (100 × {1, 1.5, 2.2} × [1, 1.5] × [1, 2]); 0 si falla o hay TIME OUT.
- **Persistencia** (`storage.js`): `localStorage` con try/catch y datos saneados; si no está disponible usa memoria. Botón *Reiniciar estadísticas* con confirmación (conserva los ajustes).
- **Temporizador** (`timer.js`): un único `setInterval` por instancia, tiempo medido con el reloj (no contando ticks); reloj inyectable para tests.

## 4. El generador

`generator.generateFromSeed(módulo, nivel, seed, { lang })` es **determinista**: mismo `(módulo, nivel, seed, idioma)` ⇒ mismo ejercicio, y el idioma **nunca altera los sorteos del PRNG** (mismo seed ⇒ mismas restricciones y respuesta en EN y ES; solo cambia el texto) (PRNG mulberry32 con semilla xmur3). Prueba hasta 300 intentos; cada candidato pasa por `validator.validateExercise`, que **no confía en el generador**: vuelve a resolver el ejercicio desde sus restricciones serializadas y comprueba que

- hay solución (y exactamente una cuando la pregunta lo exige);
- `correctAnswer` coincide con la del solver y las opciones incorrectas no son válidas por accidente;
- el texto de reglas, la pregunta y la explicación coinciden con los datos (se regeneran y se comparan);
- la dificultad es coherente con la complejidad real (nº de reglas y tipos de regla exigidos por nivel).

Verificación independiente por módulo: inductivo por enumeración exhaustiva de hipótesis (ver §9); planificación contra una malla de 5 minutos; calendario contra un solver con `Date` real; posicional por fuerza bruta de permutaciones; inglés con linter (una opción correcta, razón escrita para cada distractor) y motor de concordancia que *calcula* la forma correcta.
Si 6 semillas seguidas fallan se usa un ejercicio de `RT.fallbacks[idioma]` (validado); si tampoco hay: «Unable to generate exercise. Please try again.» No se repite un ejercicio inmediatamente (firma de los últimos 12).

## 5. Añadir preguntas (módulo de inglés)

Edita `js/data/vocabulary.js` (vocabulary, synonyms, contractual, fidic) o `grammar.js` (preposiciones). Formato:

```js
it('voc-17', 2, 'The Contractor shall ____ the Works by the Completion Date.',
   ['complete', 'completes', 'completing', 'completed'],   // la correcta SIEMPRE en el índice 0 (se baraja al generar)
   0,
   ['Correcta: ...', 'Incorrecta: ...', 'Incorrecta: ...', 'Incorrecta: ...'],  // una razón por opción, en español
   { rule: 'Regla opcional' })
```
La versión inglesa de las razones va en `js/data/notes-en.js`: `add('voc-17', ['Correct: ...', 'Wrong: ...', ...], { rule: 'Optional rule' })` (mismo id, mismo orden de opciones; `rule`/`diff` solo si el ítem los tiene). Para las lecturas, añade en `claims['rd-07']` una justificación en inglés por cada `claim`, en el mismo orden. El linter falla si falta alguna.
Textos de lectura: `js/data/templates.js` → `readings` (100–250 palabras, `facts` con fechas y `claims` etiquetadas `supported | contradicted | unsupported`). Después ejecuta los tests: el linter rechaza opciones duplicadas, razones ausentes o textos fuera de rango. Usa solo terminología FIDIC/PM de uso general; no inventes cláusulas.

## 6. Añadir un módulo

1. Crea `js/modules/mimodulo.js` y regístralo con `RT.registerModule({ id, label, answerType: 'option' | 'dates', generate(rng, level), verify(ex) })`.
2. `generate` devuelve el ejercicio (`question, data, constraints, options, correctAnswer, explanation, meta`) o `null` si descarta el candidato; `verify` **re-resuelve desde `ex.constraints`/`ex.data`** y devuelve `{ errors, solutionCount, solverAnswer, optionValidity }`.
3. Todo texto que vea el usuario (reglas, pregunta, explicación) debe salir en ambos idiomas: usa `RT.t('clave')` para la interfaz y `RT.i18n.pick(en, es)` para el texto montado a partir de datos, y **construye el texto después de los sorteos del PRNG** para que el idioma no cambie el ejercicio.
4. Añade su configuración por nivel en `RT.difficulty.MODULE_CONFIG` y su tarjeta en `ui/dashboard.js` (más las claves `module.*` en los diccionarios); incluye el `<script>` en `index.html`, `tests/index.html` y `tools/load-engine.js`; ejecuta `node tools/build-fallbacks.js`.

## 7. Modo debug

Casilla «Modo debug» en el panel, o `index.html?debug=1`. Muestra ID, seed, restricciones (JSON), nº de soluciones, resultado del solver, respuesta esperada, intentos y candidatos rechazados. Para reproducir un ejercicio: `index.html?module=positional&level=2&seed=abc123` (añade `&lang=es` para verlo en español).

## 8. Tests

```
node tests/tests.js            # 100 ejercicios por módulo y nivel (1500 en total)
QUICK=1 node tests/tests.js    # 20 por módulo y nivel
N=300 node tests/tests.js      # más intensivo
```
En el navegador: `tests/index.html?QUICK=1` (o `?N=100`) y pulsar *Run tests*. 21 tests (la mitad de los ejercicios de cada prueba se generan en inglés y la otra mitad en español): resolubilidad, ausencia de contradicciones, unicidad, `correctAnswer == solver`, opciones incorrectas realmente incorrectas, temporizador, matemáticas de estadísticas, persistencia, texto de reglas == datos (con mutaciones que deben rechazarse), rechazo de ejercicios inválidos, reproducibilidad por seed, igualdad exacta de conjuntos en calendario, linter de inglés, flujo de sesión/TIME OUT/fallbacks (por idioma) y fórmula de puntuación; además, **inductivo** (predicción única, nivel = complejidad mínima de la regla, distractores nunca predichos), **i18n** (mismas claves y marcadores en EN y ES), **paridad EN/ES** (mismo seed ⇒ mismas restricciones y respuesta), ausencia de texto español en ejercicios ingleses, cambio de idioma en caliente con persistencia, y corrección de respuestas de pintura libre.
Para regenerar los fallbacks tras cambiar un generador: `node tools/build-fallbacks.js`.


## 9. Módulo E — Patrones inductivos (librerías de figuras y secuencias)

Ejercicios genéricos (sin relación con subcontratación) de **inducción de reglas**: se muestran figuras consecutivas y hay que deducir la regla oculta que transforma cada una en la siguiente.

- **Figuras** (`js/lib/figures.js`): teselaciones de triángulos y cuadrados — `diamond` (4 casillas), `quad8` (8) y `frame3` (marco de 12 casillas + cuadrado central). Cada casilla tiene un estado: `0` vacía · `1` verde (rayas) · `2` azul (puntos). Los patrones son texturas, no solo color (accesible para daltonismo); las casillas son operables con teclado.
- **Reglas** (`js/lib/sequences.js`): biblioteca de transformaciones — rotar el dibujo, intercambiar verde/azul, reflejar, crecer/decrecer una casilla por paso en un sentido, ciclar estados, ciclar por forma, rotar color… y combinaciones alternas «regla A en los pasos impares, regla B en los pares». Cada regla tiene un *tier* de complejidad (1–3) que define el nivel: Basic (tier 1) = una regla simple, solo *siguiente figura*, figuras pequeñas; Advanced (tier 2) = reglas de forma/color (`cycShape`, `rotColor`, `rotGB`) o alternancia de dos reglas simples, añade *figura que falta*; Expert (tier 3) = alternancia en la que interviene una regla de tier 2, figuras mayores y *pintar*.
- **Validación** (`solve(figura, visibles, objetivo)`): se enumeran **todas** las hipótesis de la biblioteca compatibles con las figuras visibles; el ejercicio solo se acepta si todas predicen la **misma** figura (respuesta única), si la regla más simple que encaja tiene el tier exigido por el nivel y si ningún distractor es predicho por alguna hipótesis compatible. Los distractores son errores plausibles (repetir la figura anterior, cambiar solo parte, una casilla mal, desplazamiento equivocado, colores cambiados, espejo, ciclo erróneo).
- **Tipos**: *siguiente figura* (A–E), *figura que falta* (hueco en mitad de la secuencia) y *pintar* (solo Expert: se pinta la figura con pinceles vacío/verde/azul; se corrige por igualdad exacta). Atajos: `A`–`E`; en pintar, clic o `Enter`/`Espacio` sobre la casilla con el pincel activo.
- **Explicación**: regla descubierta, comprobación paso a paso sobre cada transición visible, resultado, nº de hipótesis examinadas (prueba de unicidad) y por qué falla cada distractor; con las figuras dibujadas.
- **Ampliar**: nueva regla → añade su generador en `sequences.js`, su texto en ambos diccionarios (`rule.*`) y su tier. Nueva figura → añade su teselación en `figures.js` (celdas, anillo de rotación y simetrías) y permítela en `MODULE_CONFIG.inductive.figures`.

## 10. Librería de idiomas (`js/lib/i18n*.js`)

`RT.i18n` es una librería sin dependencias con diccionarios por idioma (`i18n-en.js`, `i18n-es.js`):

```js
RT.t('result.correct')                          // clave → texto en el idioma activo
RT.t('stats.streak', { count: 3 })              // {param} y plurales «["1 day", "{count} days"]» según count
RT.i18n.pick('Hello', 'Hola')                   // par en línea, para textos montados con datos
RT.i18n.withLang('es', () => ...)               // ejecuta con otro idioma y lo restaura
RT.i18n.setLang('es'); RT.i18n.lang; RT.i18n.keys('en'); RT.i18n.missing()
```
**Añadir un idioma:** crea `js/lib/i18n-xx.js` con `RT.i18n.add('xx', {...})` (todas las claves de `i18n-en.js`), añade `'xx'` a `LANGS`, incluye el script en `index.html`, `tests/index.html` y `tools/load-engine.js`, y aporta en los módulos las ramas `pick`/`L` correspondientes (el test de i18n comprueba que no falte ninguna clave ni marcador). **Añadir/cambiar un texto:** añade la misma clave en ambos diccionarios; el test 17 falla si difieren.
