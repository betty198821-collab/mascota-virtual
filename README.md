# Mascota Virtual — Error 404

Sitio web interactivo desarrollado con **HTML, CSS y JavaScript**, centrado en una mascota virtual que ofrece conversaciones, consejos y acompañamiento emocional.

El proyecto combina un sistema de respuestas basado en reglas, reconocimiento de temas y palabras clave, almacenamiento local de conversaciones y diferentes funciones interactivas. Su objetivo es ofrecer un espacio de conversación accesible, con una personalidad propia y herramientas de apoyo emocional.

## Funciones principales

- **Mascota virtual:** conversación interactiva con Error 404, la mascota principal del sitio.
- **Apoyo emocional:** respuestas y consejos relacionados con tristeza, soledad, autoestima, ansiedad, falta de motivación y fracaso.
- **Reconocimiento de situaciones delicadas:** detección de mensajes relacionados con autolesiones, crisis emocionales y situaciones de riesgo.
- **Memoria local:** permite recuperar información de conversaciones anteriores almacenadas en el navegador.
- **Expresiones visuales:** la mascota cambia de apariencia según el contexto de la conversación.
- **Búsqueda en Wikipedia:** consulta información sobre personajes, franquicias y otros temas.
- **Modos especiales:** incluye el modo secreto Verity y funciones relacionadas con JoJo's Bizarre Adventure.
- **Idioma inglés:** permite cambiar el idioma de la interfaz y de las respuestas.
- **Audio y voz:** incorpora sonidos y lectura de respuestas mediante las voces disponibles en el navegador.
- **Configuración:** permite ajustar el idioma, la voz y los sonidos.
- **Persistencia:** conserva determinadas preferencias y datos mediante `localStorage`.

> **Nota:** el sistema de conversación funciona mediante reglas programadas, expresiones regulares, categorías y respuestas predefinidas. No utiliza un modelo de inteligencia artificial generativa para producir sus respuestas.

---

## 1. Estructura del proyecto

El sitio está organizado en páginas HTML, hojas de estilo, archivos JavaScript y recursos multimedia.

### Páginas principales

| Archivo | Función |
|---|---|
| `index.html` | Menú principal y acceso a la configuración. |
| `select.html` | Página de selección de mascotas. |
| `chat.html` | Interfaz principal de conversación. |

### Hojas de estilo

| Archivo | Función |
|---|---|
| `css/style.css` | Estilos de la interfaz del chat. |
| `css/menu.css` | Apariencia del menú principal. |

### Archivos JavaScript

| Archivo | Función |
|---|---|
| `js/pet-brain.js` | Sistema principal de respuestas y comportamiento de la mascota. |
| `js/topics.js` | Categorías y respuestas de apoyo emocional. |
| `js/memory.js` | Memoria local y recuperación de conversaciones. |
| `js/moderation.js` | Moderación de contenido. |
| `js/support.js` | Detección de situaciones de crisis y respuestas de apoyo. |
| `js/web-lookup.js` | Búsqueda de información en Wikipedia y reconocimiento de franquicias. |
| `js/verity-mode.js` | Datos y activación del modo Verity. |
| `js/translate.js` | Diccionario y funciones de traducción al inglés. |
| `js/chat.js` | Conexión entre los módulos y administración del chat. |
| `js/selection.js` | Funcionamiento de la página de selección. |
| `js/personality.js` | Personalidad, historia y reacciones de Error 404. |
| `js/extras.js` | Funciones adicionales, como el resumen de conversación y la cremallera. |
| `js/audio.js` | Sonidos y lectura de respuestas mediante voz. |
| `js/menu.js` | Funcionamiento del menú y sus controles. |
| `js/english-input.js` | Reconocimiento de determinadas expresiones en inglés. |
| `js/advice-more.js` | Consejos adicionales sobre crisis y vacío emocional. |

### Recursos multimedia

- `images/`: imágenes de expresiones, mascotas, animaciones y elementos visuales.
- `audio/`: recursos de sonido y música utilizados por el sitio.

Los nombres de los archivos multimedia deben coincidir exactamente con los indicados en el código, incluyendo mayúsculas, minúsculas y extensión.

---

## 2. Mascotas y modos especiales

### Error 404

Es la mascota principal y la única registrada como mascota seleccionable en la estructura documentada del proyecto.

Su comportamiento se administra principalmente desde `pet-brain.js`, mientras que los demás módulos complementan sus respuestas, personalidad, memoria y funciones.

### Verity

Verity es un modo secreto, no una mascota independiente.

Se activa mediante una instrucción dentro del chat, por ejemplo:

`entra en modo verity`

Al activarse, modifica elementos visuales como el nombre, la apariencia y la descripción. También incorpora música y modifica el comportamiento de las respuestas.

Internamente continúa utilizando el sistema de Error 404. No dispone de un archivo de cerebro independiente.

### Modo JoJo

Incluye cambios visuales relacionados con *JoJo's Bizarre Adventure*.

Cuando se reconoce el contexto correspondiente, la mascota puede cambiar de expresión. También existe una animación especial para mostrar un Stand, compuesta por tres imágenes iniciales y variantes de color posteriores.

---

## 3. Funcionamiento interno

### Sistema principal de respuestas — `pet-brain.js`

Es el núcleo del comportamiento conversacional.

Contiene el objeto `ERROR404`, las respuestas organizadas en `responses` y la función:

`reply(userText, state)`

Esta función analiza los mensajes mediante un sistema de prioridades. Las reglas se evalúan en orden y se utiliza la primera que coincide con el mensaje recibido.

**El orden de las reglas es importante.** Una condición demasiado general puede interceptar un mensaje antes de que llegue a una regla más específica. Por eso, las nuevas condiciones deben ubicarse teniendo en cuenta las prioridades existentes.

El objeto `state` contiene información como el nombre, los gustos y distintos contadores. Se almacena en `localStorage`.

### Apoyo emocional — `topics.js`

Contiene seis categorías principales:

- Tristeza.
- Soledad.
- Autoestima.
- Ansiedad.
- Falta de motivación.
- Fracaso.

Cada categoría contiene situaciones y respuestas en español e inglés. Las respuestas pueden ampliarse siguiendo la estructura de objetos:

`{ es: 'Respuesta en español', en: 'English response' }`

Los temas de tristeza, soledad y autoestima también cuentan con una secuencia de recomendaciones y referencias a líneas de ayuda.

### Memoria — `memory.js`

Almacena hasta 300 mensajes en el navegador y registra temas importantes de las conversaciones.

Permite reconocer solicitudes como:

- «¿De qué hablábamos?»
- «Volvamos a lo de antes».
- «¿Qué fue lo primero que te dije?»
- «¿Qué te dije de X?»

Incluye las colecciones `RECALL_LINES` y `ABRUPT_SHIFT_LINES`, destinadas a recuperar temas anteriores y responder cuando se cambia bruscamente de una conversación seria a una más ligera.

### Moderación — `moderation.js`

Administra la detección de contenido sexual o explícito.

Utiliza diferentes listas de términos y contempla variaciones de escritura en varios idiomas. También diferencia el contenido explícito de las consultas educativas y de los relatos de abuso, que requieren respuestas distintas.

Este módulo tiene prioridad dentro del procesamiento de mensajes.

### Apoyo en situaciones de crisis — `support.js`

Gestiona la detección de mensajes relacionados con:

- Autolesiones.
- Deseos de morir o no querer vivir.
- Intentos o planes de suicidio.

Las situaciones de crisis tienen prioridad sobre las funciones recreativas y los modos especiales. El sistema busca responder sin juzgar, pregunta por la seguridad de la persona y proporciona referencias de ayuda.

Las líneas de ayuda deben mantenerse actualizadas y verificarse en fuentes oficiales antes de modificar sus números o descripciones.

Los consejos almacenados en el código se basan en materiales de referencia reescritos. No se descargan directamente desde esas páginas durante la conversación.

### Búsqueda de información — `web-lookup.js`

Gestiona las consultas externas y el reconocimiento de franquicias.

Entre sus estructuras principales se encuentran:

- `FRANCHISE_CHARACTERS`
- `FRANCHISE_DISPLAY`
- `matchFranchise()`
- `checkWebIntents()`

La búsqueda se procesa antes de utilizar el sistema normal de respuestas cuando el mensaje requiere información externa.

### Traducción — `translate.js`

Contiene el diccionario `LINE_DICTIONARY` y funciones para traducir respuestas fijas y respuestas construidas dinámicamente.

Las respuestas que incluyen datos variables, como nombres o resultados matemáticos, necesitan un tratamiento distinto al de las frases predefinidas.

### Conexión del sistema — `chat.js`

Coordina los distintos módulos y administra:

- Envío y recepción de mensajes.
- Detección de cambios de idioma y de modo.
- Consultas externas.
- Almacenamiento de conversaciones.
- Activación y desactivación de modos.
- Temporizador de inactividad.
- Animaciones y actualizaciones de la interfaz.

Es uno de los archivos que requiere mayor precaución al realizar modificaciones.

---

## 4. Cómo modificar y ampliar el proyecto

### Preparación

Antes de realizar cambios:

1. Abrir la carpeta completa del proyecto en Visual Studio Code mediante **Archivo → Abrir carpeta**.
2. Crear una copia de seguridad antes de modificar archivos importantes.
3. Identificar el módulo responsable de la función que se desea cambiar.
4. Realizar cambios pequeños y probarlos antes de continuar.

### Cambiar una respuesta

Las respuestas fijas se encuentran principalmente en `pet-brain.js`, dentro de `responses` y de las condiciones de `reply()`.

Para localizar una frase existente, utilizar `Ctrl + F` en Visual Studio Code.

Al modificar una respuesta, conservar la estructura del código: comillas, comas, llaves, paréntesis y demás elementos de sintaxis.

### Agregar una expresión visual

Para reemplazar una imagen existente, colocar la nueva imagen en `images/` utilizando exactamente el mismo nombre.

Para incorporar una expresión nueva:

1. Agregar su referencia en el objeto `images` de `ERROR404`, dentro de `pet-brain.js`.
2. Crear la condición correspondiente en `reply()`.
3. Devolver la expresión mediante `expression: 'nombre_de_la_expresion'`.

### Agregar una franquicia a la búsqueda

En `web-lookup.js`:

1. Incorporar los personajes en `FRANCHISE_CHARACTERS`.
2. Añadir su detección en `matchFranchise()`.
3. Registrar el nombre correspondiente en `FRANCHISE_DISPLAY`.

### Agregar una mascota independiente

Para registrar una mascota seleccionable:

1. Crear un objeto basado en la estructura de `ERROR404`.
2. Modificar su nombre, imágenes y textos.
3. Registrar la nueva mascota en `PETS`, dentro de `pet-brain.js`.
4. Añadir su tarjeta correspondiente en `select.html`.

Verity no requiere este procedimiento porque funciona como un modo visual.

### Agregar traducciones

Las respuestas fijas de `pet-brain.js` utilizan `LINE_DICTIONARY`, ubicado en `translate.js`.

La clave debe coincidir exactamente con el texto en español, carácter por carácter.

Los módulos `personality.js`, `topics.js`, `moderation.js`, `extras.js`, `memory.js`, `support.js` y `advice-more.js` contienen pares de respuestas mediante las propiedades `es` y `en`.

Cuando se modifique una respuesta, también debe revisarse su traducción.

### Modificar el comportamiento de Verity

En `pet-brain.js`, la función `verityGate()` controla el umbral de preguntas y el tiempo de espera.

- `9 + Math.floor(Math.random() * 8)`: establece un umbral aleatorio entre 9 y 16.
- `COOLDOWN_MS`: controla el tiempo de enfriamiento, establecido en dos horas.

La función `verityReply()` también contiene el intervalo de insistencias que determina cuándo aparece la expresión escéptica.

### Modificar la animación del Stand

En `chat.js`:

- `STAND_REVEAL_DURATION_MS`: duración de la animación inicial, establecida en 2500 milisegundos.
- `playStandReveal()`: contiene el intervalo de aproximadamente 6000 milisegundos entre cambios de color.

### Modificar mensajes de inactividad

En `pet-brain.js` se encuentran:

- `casualIdleMessages`
- `checkInMessages`

Estas colecciones contienen los mensajes que aparecen cuando no hay actividad en el chat.

### Modificar la personalidad

En `personality.js` se encuentran:

- `INSULT_WORDS`: palabras utilizadas para reconocer insultos.
- `handleInsult()`: administra las reacciones ante los insultos.
- `LORE_CHAPTERS`: capítulos de la historia de la mascota.
- `VERITY_LORE_LINES`: información y frases relacionadas con Verity.
- `addPersonalityFlavor()`: comentarios espontáneos de personalidad.

### Modificar funciones adicionales

En `extras.js`:

- `MUFFLED_SOUNDS`: sonidos asociados a la boca cerrada.
- `UNZIP_LINES`: respuestas relacionadas con la apertura de la cremallera.

En `web-lookup.js`, la colección `JOJO_STANDS` contiene información de los Stands, como su descripción, parte y usuario.

---

## 5. Reglas importantes de mantenimiento

### Prioridad de las respuestas

Las reglas específicas deben conservar prioridad frente a las condiciones generales. Antes de agregar una nueva condición, revisar las anteriores para evitar coincidencias no deseadas.

### Contextos serios y modos especiales

Los modos especiales deben respetar la detección de situaciones delicadas.

Para bloquear un modo durante un contexto serio, el sistema utiliza:

`if (isSeriousContextActive(state)) return modeBlockedReply(state, 'clave');`

También es necesario registrar el modo en `MODE_LABELS`, dentro de `memory.js`, incluyendo su versión en inglés.

Los temas de crisis bloquean los modos durante 20 mensajes; otros contextos serios utilizan un límite de 8 mensajes.

### Moderación

El sistema de moderación utiliza dos niveles:

- `EXACT_TERMS` y `STEM_TERMS`: detección de términos explícitos.
- `TIER2_TERMS`: identificación de términos relacionados con biología o educación sexual, que requieren un tratamiento educativo y no una reprimenda.

Las nuevas palabras deben revisarse cuidadosamente para evitar falsos positivos.

### Cambios en la memoria local

Los datos se almacenan en `localStorage`, no en una base de datos remota.

Si se modifica la estructura de `state`, los datos antiguos del navegador podrían quedar desactualizados. Durante las pruebas, el botón **Reiniciar chat** permite comenzar con el almacenamiento limpio.

### Imágenes y extensiones

Los archivos multimedia deben conservar sus nombres exactos.

En Windows conviene activar la visualización de extensiones de archivo para evitar nombres duplicados como `imagen.png.png`.

### Consultas externas

La búsqueda de Wikipedia no siempre devuelve información específica, especialmente para números exactos de episodios o capítulos.

Cuando no se encuentre información suficiente, el sistema debe indicarlo en lugar de inventar resultados.

---

## 6. Recursos visuales

### Expresiones principales

Los siguientes archivos corresponden a las expresiones básicas:

```text
error404_neutral.png
error404_talking.png
error404_happy.png
error404_worried.png
error404_sad.png
error404_confused.png
verity_face.png
```

### Modo JoJo y Stand

```text
error404_jojo.png
error404_skeptical.png
error404_stand_fade1.png
error404_stand_fade2.png
error404_stand_fade3.png
error404_stand_blue.png
error404_stand_red.png
```

Las imágenes `fade1`, `fade2` y `fade3` forman la animación inicial de aparición del Stand. Las imágenes `blue` y `red` corresponden a sus variantes de color.

### Cremallera

```text
error404_zipped.png
error404_unzip1.png
error404_unzip2.png
error404_unzip3.png
```

Si falta una imagen, el sistema utiliza un círculo con el número 404 como alternativa visual.

### Imagen del menú

El archivo utilizado para el fondo del menú es:

`images/menu_banner.png`

Se recomienda una imagen horizontal de 1920 × 1080 píxeles. La zona inferior central debe dejar espacio para los botones.

---

## 7. Idioma, voz y configuración

El menú permite configurar:

- Idioma.
- Voz de las mascotas.
- Sonidos de los mensajes.
- Prueba de voz.

Las preferencias se almacenan en el navegador y se aplican al sitio.

El módulo `english-input.js` reconoce determinadas expresiones en inglés y las convierte en frases equivalentes que el sistema principal puede procesar.

No se trata de un traductor general. Para ampliar su reconocimiento, se deben agregar nuevas reglas a `ENGLISH_RULES` siguiendo la estructura:

```javascript
[ /expresión en inglés/, 'frase equivalente en español' ]
```

Las expresiones relacionadas con situaciones de crisis se detectan tanto en español como en inglés, independientemente del idioma seleccionado.

---

## 8. Consejos adicionales

El archivo `advice-more.js` incorpora 50 consejos adicionales:

- 25 relacionados con la recuperación después de una crisis o un intento de suicidio.
- 25 relacionados con el vacío emocional.

Se pueden solicitar mediante expresiones como «dame consejos» y «otro consejo». El tema del vacío emocional reconoce frases como «me siento vacío» o «no siento nada».

---

## 9. Pruebas y solución de problemas

Después de modificar el código:

1. Guardar los cambios con `Ctrl + S`.
2. Actualizar el navegador con `Ctrl + F5`.
3. Probar la función modificada.
4. Revisar que las demás funciones sigan funcionando.
5. Si aparece un error, abrir las herramientas del navegador con `F12` y consultar la pestaña **Console**.

Se recomienda probar una modificación a la vez. Esto facilita identificar el origen de los errores.

Al solicitar ayuda técnica sobre el proyecto, es conveniente proporcionar el archivo completo involucrado, describir el mensaje que produce el problema y especificar cuál debería ser el resultado esperado. Las modificaciones deben respetar la estructura y el orden de prioridades existentes, evitando reemplazar módulos completos sin necesidad.

---

## 10. Publicación y actualizaciones

El proyecto puede mantenerse mediante Git y GitHub.

Una vez creado el repositorio:

1. Incorporar la carpeta del proyecto al repositorio local.
2. Registrar los cambios mediante un `commit`.
3. Publicarlos en GitHub mediante `push`.
4. Para actualizar el sitio, realizar nuevos cambios, crear otro `commit` y enviarlo al repositorio.

GitHub Pages permite publicar sitios web estáticos desde un repositorio.

La configuración habitual se encuentra en:

**Repository → Settings → Pages**

Desde allí se selecciona la rama y la carpeta que contienen los archivos del sitio.

---

## 11. Consideraciones de privacidad

La memoria de conversación y determinadas preferencias se almacenan en el navegador mediante `localStorage`.

Esto significa que los datos guardados no se sincronizan automáticamente entre dispositivos ni se almacenan en un servidor mediante el sistema descrito en este proyecto.

El botón **Reiniciar chat** permite borrar los datos de conversación almacenados por el sitio en el navegador.