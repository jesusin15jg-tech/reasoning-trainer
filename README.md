# Reasoning & Contractual English Trainer

Aplicación web (HTML + CSS + JavaScript ES6, sin backend) para entrenar razonamiento lógico e inglés contractual.
**Regla de oro: ningún ejercicio se muestra sin haber sido generado, resuelto y validado automáticamente** (`RANDOM → SOLVE → VALIDATE → ACCEPT`).

## 1. Cómo ejecutarla

- **Opción A:** abrir `index.html` con doble clic (funciona desde `file://`: no usa módulos ES ni `fetch`).
- **Opción B:** servidor estático, p. ej. `python3 -m http.server 8080` y abrir <http://localhost:8080>.
- Tailwind se carga desde su CDN como mejora opcional (con `preflight` desactivado). **Toda la interfaz está maquetada en `css/styles.css`**, así que funciona igual sin conexión.

Módulos: **A** Planificación de recursos (álgebra de intervalos) · **B** Restricciones posicionales (5/6/7 elementos) · **C** Lógica de calendario · **D** Inglés contractual y avanzado (vocabulario, concordancia, preposiciones, sinónimos/antónimos, inglés contractual, terminología FIDIC/PM, lectura e inferencia).
Niveles: Basic / Advanced / Expert (cambian el algoritmo de generación, no solo el texto). Modos: Entrenamiento (cronómetro ascendente) y Contrarreloj (60/75/90 s; al agotarse cuenta como fallo y se muestra la solución).

Atajos de teclado en un ejercicio: `A`–`E` elige opción, `Enter` comprueba; en el resultado `Enter` pasa al siguiente.

## 2. Estructura

```
index.html
css/styles.css
js/
  engines/   random · difficulty · intervals · solver · explanation · validator · generator
  modules/   positional · scheduling · scheduling-kinds · calendar · english
  data/      vocabulary · grammar · templates · pools · fallbacks (autogenerado)
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

`generator.generateFromSeed(módulo, nivel, seed)` es **determinista**: mismo seed ⇒ mismo ejercicio (PRNG mulberry32 con semilla xmur3). Prueba hasta 300 intentos; cada candidato pasa por `validator.validateExercise`, que **no confía en el generador**: vuelve a resolver el ejercicio desde sus restricciones serializadas y comprueba que

- hay solución (y exactamente una cuando la pregunta lo exige);
- `correctAnswer` coincide con la del solver y las opciones incorrectas no son válidas por accidente;
- el texto de reglas, la pregunta y la explicación coinciden con los datos (se regeneran y se comparan);
- la dificultad es coherente con la complejidad real (nº de reglas y tipos de regla exigidos por nivel).

Verificación independiente por módulo: planificación contra una malla de 5 minutos; calendario contra un solver con `Date` real; posicional por fuerza bruta de permutaciones; inglés con linter (una opción correcta, razón escrita para cada distractor) y motor de concordancia que *calcula* la forma correcta.
Si 6 semillas seguidas fallan se usa un ejercicio de `RT.fallbacks` (validado); si tampoco hay: «Unable to generate exercise. Please try again.» No se repite un ejercicio inmediatamente (firma de los últimos 12).

## 5. Añadir preguntas (módulo de inglés)

Edita `js/data/vocabulary.js` (vocabulary, synonyms, contractual, fidic) o `grammar.js` (preposiciones). Formato:

```js
it('voc-17', 2, 'The Contractor shall ____ the Works by the Completion Date.',
   ['complete', 'completes', 'completing', 'completed'],   // la correcta SIEMPRE en el índice 0 (se baraja al generar)
   0,
   ['Correcta: ...', 'Incorrecta: ...', 'Incorrecta: ...', 'Incorrecta: ...'],  // una razón por opción, en español
   { rule: 'Regla opcional' })
```
Textos de lectura: `js/data/templates.js` → `readings` (100–250 palabras, `facts` con fechas y `claims` etiquetadas `supported | contradicted | unsupported`). Después ejecuta los tests: el linter rechaza opciones duplicadas, razones ausentes o textos fuera de rango. Usa solo terminología FIDIC/PM de uso general; no inventes cláusulas.

## 6. Añadir un módulo

1. Crea `js/modules/mimodulo.js` y regístralo con `RT.registerModule({ id, label, answerType: 'option' | 'dates', generate(rng, level), verify(ex) })`.
2. `generate` devuelve el ejercicio (`question, data, constraints, options, correctAnswer, explanation, meta`) o `null` si descarta el candidato; `verify` **re-resuelve desde `ex.constraints`/`ex.data`** y devuelve `{ errors, solutionCount, solverAnswer, optionValidity }`.
3. Añade su configuración por nivel en `RT.difficulty.MODULE_CONFIG` y su tarjeta en `ui/dashboard.js`; incluye el `<script>` en `index.html` y en `tools/load-engine.js`; ejecuta `node tools/build-fallbacks.js`.

## 7. Modo debug

Casilla «Modo debug» en el panel, o `index.html?debug=1`. Muestra ID, seed, restricciones (JSON), nº de soluciones, resultado del solver, respuesta esperada, intentos y candidatos rechazados. Para reproducir un ejercicio: `index.html?module=positional&level=2&seed=abc123`.

## 8. Tests

```
node tests/tests.js            # 100 ejercicios por módulo y nivel (1200 en total)
QUICK=1 node tests/tests.js    # 20 por módulo y nivel
N=300 node tests/tests.js      # más intensivo
```
En el navegador: `tests/index.html?QUICK=1` (o `?N=100`) y pulsar *Run tests*. 15 tests: resolubilidad, ausencia de contradicciones, unicidad, `correctAnswer == solver`, opciones incorrectas realmente incorrectas, temporizador, matemáticas de estadísticas, persistencia, texto de reglas == datos (con mutaciones que deben rechazarse), rechazo de ejercicios inválidos, reproducibilidad por seed, igualdad exacta de conjuntos en calendario, linter de inglés, flujo de sesión/TIME OUT/fallbacks y fórmula de puntuación.
Para regenerar los fallbacks tras cambiar un generador: `node tools/build-fallbacks.js`.
