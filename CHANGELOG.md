# Changelog

Registro de versiones de ListGenerator. La versión se muestra en el header de la app (junto al nombre) y vive en `frontend/src/app/version.ts`.

Convención: empezamos en **0.1**; el decimal sube de 1 en 1 con cada tanda de cambios (0.1 → 0.2 → 0.3 … → 0.10 → 0.11 …), sin saltar nunca a 1.0 hasta que se decida explícitamente.

## 0.29 — 2026-07-08 (rama `feature/firebase-lists`)

- Reducida la fila de idioma de la cabecera (menos padding, banderas más pequeñas) y algo menos de aire en la fila principal: se veía demasiado grande.

## 0.28 — 2026-07-08 (rama `feature/firebase-lists`)

- Cabecera reorganizada en un único marco: fila fina arriba a la derecha solo con el idioma, y fila principal en grid de 3 columnas (marca a la izquierda, banner realmente centrado, botones de cuenta a la derecha) en vez de flexbox de space-between.
- "Mis Listas", "Iniciar sesión" y "Cerrar sesión" comparten ahora exactamente el mismo tamaño de botón (mismo padding/alto/tipografía), antes no coincidían.

## 0.27 — 2026-07-08 (rama `feature/firebase-lists`)

- Rediseñada la cabecera en 2 franjas: una tira fina superior de "utilidad" (idioma a la izquierda, "Mis Listas" + sesión a la derecha) separada de la barra principal (marca + banner ilustrado), en vez de intentar meter todo en una sola fila. "Mis Listas" ahora tiene tratamiento de botón sólido para destacar más.
- Arreglada "Mis Listas": la tabla usaba una fila de CSS grid independiente por fila, así que la cabecera y los datos podían desalinearse según el contenido (los botones de Cargar/Eliminar). Ahora es una tabla HTML real, con columnas siempre alineadas.

## 0.26 — 2026-07-08 (rama `feature/firebase-lists`)

- Arreglado "Mis Listas" al no cargar nada: la consulta a Firestore combinaba `where` + `orderBy` sobre campos distintos, lo que exige un índice compuesto que un proyecto nuevo no tiene creado. Se ordena ahora en el propio código en vez de pedírselo a Firestore.
- `frontend/src/environments/firebase-config.ts` reescrito con la configuración real del proyecto (`army-list-generator`), con la estructura correcta (exports) en vez del snippet en bruto de la consola de Firebase.
- `package.json` fijado en las versiones compatibles conocidas (`@angular/build` en línea con el resto de Angular 22, `jspdf`/`jspdf-autotable` en el par verificado) tras varias idas y vueltas con `npm audit fix --force`.

## 0.25 — 2026-07-08 (rama `feature/firebase-lists`)

- Añadido inicio de sesión con Google (Firebase Authentication) y guardado/carga/edición/borrado de listas (Firebase Firestore). Se puede seguir navegando y construyendo listas sin iniciar sesión; solo guardar requiere sesión (aviso visible en la pantalla de facción cuando no has iniciado sesión).
- Nuevo botón "Guardar lista" junto a "Exportar a PDF" en la pantalla de facción (mismo bloqueo que el PDF si quedan unidades sin asignar a battalia/brigada). Guardar una lista ya guardada la actualiza en vez de duplicarla.
- Nueva página "Mis Listas" (enlace en la cabecera): lista tus listas guardadas con puntos/facción/fecha, y permite cargarlas para seguir editándolas o eliminarlas.
- Reglas de seguridad de Firestore (`firestore.rules`) para que cada usuario solo pueda leer/editar/borrar sus propias listas.
- Requiere configuración manual de un proyecto de Firebase (no se puede hacer desde aquí): ver `FIREBASE_SETUP.md` en la raíz del repo para los pasos completos. Hasta que se complete esa configuración, la app funciona igual que antes pero sin guardado.
- Este trabajo vive en la rama `feature/firebase-lists`, no en `main`. `main` sigue en la versión 0.24 (con etiqueta `v0.24`) para poder volver atrás sin más que cambiar de rama si esto no convence.

## 0.24 — 2026-07-08

- Arreglado que en móvil las facciones de Black Powder (forzadas a una sola fila en escritorio) se amontonaran unas encima de otras: por debajo de 640px de ancho vuelven a repartirse en varias filas, igual que el resto de conflictos.
- Arreglado el arrastre de unidades/comandantes entre brigadas en móvil: antes cualquier toque sobre la fila se interpretaba como un intento de arrastre y bloqueaba el scroll normal. Ahora el arrastre solo se activa tocando el icono "⠿" (drag handle), así el resto de la fila deja pasar el scroll táctil con normalidad.

## 0.23 — 2026-07-08

- Facciones de Black Powder ahora siempre en una sola fila (antes se repartían en dos según el ancho), tanto con 5 facciones oficiales como con las 6 que aparecen al incluir personalizadas.

## 0.22 — 2026-07-08

- French Indian War ahora usa "Brigada" en vez de "Battalia" para su unidad de mando (igual que Black Powder).

## 0.21 — 2026-07-08

- French Indian War: primer contenido jugable. Guerra Franco-India cargada como conflicto único (el juego lo selecciona solo, sin pedírselo al usuario) con dos facciones independientes, Ingleses y Franceses, cada una con las 10 unidades de la tabla aportada (Infantería Regular/Ligera/de Élite, Milicia, Colonos, Hombres de Frontera, Partida de Guerra India, Caballería Regular, Milicia a Caballo, Artillería) y un Oficial genérico (Valor de Mando 8, 0 puntos) para poder liderar la fuerza.
- Este juego no tiene "varias battalias": se crea una única automáticamente y las unidades añadidas van directas ahí, sin que haga falta crearla ni seleccionarla a mano (solo aplica a French Indian War).
- Ampliado el selector de tamaño de unidad: ahora una unidad puede cambiar también sus estadísticas de combate (peanas, C. a C., Disparo, Aguante) al elegir un tamaño más pequeño, no solo los puntos (hasta ahora solo cambiaban los puntos, como en Black Powder). Se ve reflejado en el catálogo, en "Mi Lista" y en el PDF exportado. Añadido también un tercer tamaño "Mediana" para unidades con tres variantes.
- Iconos de facción para Ingleses/Franceses de French Indian War añadidos al selector.

- Logo principal recortado en origen (eliminado el margen transparente sobrante, sobre todo abajo) y fijado en la pantalla de inicio por altura (150px) en vez de por ancho, para que ocupe menos espacio vertical.
- Reducido el hueco entre el logo y la frase "Elige tu juego, conflicto y facción..." y compactados los espaciados de toda la pantalla de selección (pasos, tarjetas de conflicto/facción, iconos de facción, checkbox de reglas personalizadas) para que la pantalla completa quepa mejor en 1080p.

## 0.19 — 2026-07-08

- Banner de escritorio recortado por arriba y por abajo (se pierde algo de las banderas y sombreros de las puntas) en vez de escalado entero: vuelve a la altura anterior (100px) pero mucho más ancho (724px, aspect-ratio ~7.24:1), con look "cinemático" alargado. La cabecera recupera su altura anterior en escritorio.

## 0.18 — 2026-07-08

- Reprocesado el logo con la nueva versión de fondo transparente subida por el usuario (confirmado a nivel de canal alfa: esquinas totalmente transparentes, solo el emblema opaco).
- Logos de cada juego (Pike & Shotte, Epic P&S, Black Powder, French Indian War) regenerados a mayor resolución (900×600 → 1200×800) para que no se vean borrosos en pantallas de alta densidad (Retina/HiDPI).

## 0.17 — 2026-07-08

- Banner de escritorio ensanchado de 420px a 760px (se veía muy vacío en pantallas de ordenador). Al mantener el aspect-ratio real de la imagen, también crece de alto (100px → 180px), así que la cabecera es algo más alta en escritorio. Añadido un escalón intermedio (420px) entre 640-900px de ancho de ventana para no pasar bruscamente del banner grande al de móvil.
- El banner de móvil ahora usa la imagen específica para móvil que subió el usuario (`banner-mobile.png`, recorte propio, no solo el banner de escritorio reducido).

## 0.16 — 2026-07-08

- El logo subido por el usuario (mosquete cruzado + bicornio + laurel + "Army List Generator") sustituye al texto "List Generator" en el centro de la página principal. Se mantiene el `<h1>` semánticamente (con `alt` para accesibilidad/SEO), pero visualmente ahora es la imagen; se quitó la línea decorativa que acompañaba al texto porque el propio logo ya hace ese papel.


## 0.15 — 2026-07-08

- Revertido el zoom al pasar el ratón por los logos de juego (`.game-card:hover .game-logo { transform: scale(...) }`): recortaba/distorsionaba visualmente el logo. Se mantiene el efecto de elevación + sombra de la tarjeta, que no toca la imagen.
- Banner de cabecera colocado: se recortaron los márgenes negros de la ilustración subida por el usuario y se generó en dos tamaños (420×100px escritorio, 300×71px móvil, con versión @2x para pantallas retina), centrado entre el nombre de la app y el selector de idioma.
- Selector de idioma: ahora son dos banderas (España/Reino Unido) en vez de botones de texto "ES"/"EN" — ocupan menos espacio. Mantienen accesibilidad vía `title`/`aria-label`.


## 0.14 — 2026-07-08

- Donde una unidad puede ser Pequeña o Grande, ahora es un selector excluyente (Normal / Pequeña / Grande) en vez de dos checkboxes sueltos: ya no se pueden marcar las dos tallas a la vez. Se aplica automáticamente a cualquier unidad de cualquier ejército/conflicto que tenga esas opciones (se detectan por código, no hace falta configurarlo unidad a unidad). El resto de opciones de la unidad se siguen mostrando como checkboxes normales debajo.

## 0.13 — 2026-07-08

- Arreglado el build ("Could not resolve img/bg-parchment.jpg"): el fondo de hoja envejecida se referenciaba desde `styles.scss` con una ruta que solo existe en los assets ya copiados (`public/img/...`), pero el bundler de Angular resuelve los `url()` de las hojas de estilo globales contra archivos reales en disco relativos al propio `.scss`. Corregido apuntando a la ruta real (`../public/img/bg-parchment.jpg`) para que el build lo encuentre, lo procese y lo sirva bien tanto en local como en GitHub Pages.

## 0.12 — 2026-07-08

- Restaurado el ejército Español de la Guerra de los 30 Años (se había quitado por un malentendido: la petición era sobre España en Black Powder, no en Pike & Shotte).
- Fondo de la app: se sustituye el degradado + ruido SVG sintético por la textura de hoja envejecida real subida por el usuario (`FONDO_HOJA.jpg`), con un ligero tinte encima para mantener el contraste del texto uniforme.
- "List Generator" se escribe ahora separado (antes "ListGenerator") en el título de la cabecera, en la pestaña del navegador (antes decía literalmente "Frontend", sin corregir) y en el pie del PDF exportado.
- Cabecera: reservado un hueco fijo para un futuro banner, centrado entre el nombre de la app y el selector de idioma. Tamaños objetivo de las imágenes (cuando se suban): **480×48px** en escritorio, **320×48px** en móvil (con `flex-wrap`, el banner pasa a su propia fila debajo de marca/idioma en pantallas ≤640px). De momento el hueco está vacío (sin imagen todavía) para no romper el build de producción con una referencia a un archivo inexistente.

## 0.11 — 2026-07-08

- Lavado de cara visual con un aire más histórico: tipografía Cinzel (títulos, estilo "placa/inscripción") + EB Garamond (texto, tipo de imprenta clásico de los siglos XVI-XIX), y un fondo de página tipo papel envejecido (manchas suaves + grano fino, generado con CSS/SVG, sin imágenes externas). Cambio sobrio: misma paleta de colores de siempre, solo se eleva la tipografía y la textura de fondo.
- Añadidas las opciones de reglas nacionales de Black Powder Napoleónicas para las 4 facciones personalizadas con roster completo (Francia, Prusia, Austria, Gran Bretaña), aplicadas unidad por unidad según su categoría (infantería/caballería/artillería) o, cuando así se indicó, a unidades concretas (p.ej. "Tenaces" solo en Vieja y Media Guardia francesas, o las opciones de artillería solo en la Real/KGL británica). Se excluyen automáticamente las opciones que serían redundantes (p.ej. no se ofrece "Élite" a una unidad que ya es Élite de base, ni "Poco Fiables" a una que ya lo es). No se han modelado los rasgos de comandante (p.ej. "Inspirador" francés) porque el modelo de datos actual no soporta opciones sobre comandantes.



## 0.10 — 2026-07-08

- Arreglado: el Valor de Mando del líder aparecía duplicado en el PDF (el nombre del comandante ya lo incluía como texto, y encima se añadía otra vez en la cabecera). Ahora el nombre no lleva el número de Valor de Mando; se muestra una sola vez, en el campo dedicado.
- No se puede añadir más de un líder de brigada/battalia a la misma brigada/battalia, sea cual sea su tarifa de Valor de Mando (antes solo se comprobaba un código concreto, así que las 3 tarifas de Black Powder —códigos distintos— se colaban como si fueran comandantes diferentes). Se ha introducido un campo `role` en los comandantes (`army_general` / `battalia_leader`) para que esta y otras restricciones futuras no dependan de códigos concretos.
- Reaplicada la bandera de Suecia (30 años) con la imagen actualizada por el usuario.
- Rusia ya tiene bandera propia, y su nombre ya no lleva el sufijo "(Reglas Personalizadas)" (se llama simplemente "Rusia" / "Russia", igual que el resto de facciones).
- Eliminado (de momento) el ejército Español de la Guerra de los 30 Años.
- Al añadir una unidad, se inserta automáticamente en su posición ordenada por defecto dentro de "Mi Lista": primero por tipo (Infantería, luego Caballería, luego Artillería — los comandantes ya iban aparte, por encima), y dentro de cada tipo por Aguante ascendente. El reordenado manual por arrastre sigue funcionando con normalidad después de añadir.
- Nuevo aviso: si una battalia/brigada tiene unidades pero no tiene ningún líder asignado, se muestra un mensaje pidiendo que se le añada uno.

## 0.9 — 2026-07-08

- Arrastrar unidades y comandantes ahora funciona agarrando cualquier punto de la fila, no solo el icono ⠿.
- No se puede exportar a PDF mientras queden unidades sin asignar a una Battalia/Brigada (botón deshabilitado con explicación al pasar el ratón).
- Rediseño de la cabecera del PDF: se quita la caja de color y el borde grueso de la barra de cada Battalia/Brigada (ahora solo texto + una línea fina de separación, más sobrio), se añade el Valor de Mando junto al nombre del comandante, se usa una tipografía serif en toda la hoja para un aire más "manual militar/documento formal", y se reajustan los anchos de columna para que las cabeceras (Unidad, Tipo, Peanas, Armamento, CaC, Disparo, Moral, Aguante, Reglas Especiales, Puntos) quepan en una sola línea — "Cuerpo a Cuerpo" pasa a abreviarse como "CaC" en el PDF.
- La agrupación de unidades ya no se llama "Battalia" en Black Powder: se llama "Brigada" (en Pike & Shotte/Guerra de los 30 Años se mantiene "Battalia", que es el término histórico correcto para esa época). El término se adapta automáticamente según el juego.
- Selector de facciones: cuando una nación tiene versión oficial (vacía) y versión personalizada (Francia, Gran Bretaña, Prusia, Austria), ya no aparecen dos botones casi iguales. Aparece un único botón con el nombre/escudo oficial; si "Incluir facciones personalizadas" está activado, el click lleva directo a las reglas personalizadas, y si no hay personalizada disponible, lleva a la oficial. Rusia (que no tiene versión oficial) se sigue mostrando como su propia entrada.

## 0.8 — 2026-07-08

- Nuevo botón "Exportar a PDF" en la pantalla de construcción de listas. Pide un nombre para la lista (se usa como título del documento y como nombre del archivo descargado) y genera un PDF con una tabla por Battalia (Unidad, Tipo, Peanas, Armamento, Cuerpo a Cuerpo, Disparo, Moral, Aguante, Reglas Especiales, Puntos), con un estilo visual (colores, tipografía) inspirado en la hoja de referencia aportada por el usuario y coherente con la paleta ya usada en la app.
- A petición del usuario, la cabecera del PDF no incluye "Army Commander" ni "Command Rating": en su lugar muestra la Facción y el total de puntos (usado / límite).
- Nueva dependencia: `jspdf` (v2.x) + `jspdf-autotable` (generación de PDF 100% en el navegador, sin backend). Se fija `jspdf` en la rama 2.x porque `jspdf-autotable@3.8.4` todavía exige esa versión como peer dependency (jsPDF 3 daba error ERESOLVE). Hace falta ejecutar `npm install` una vez en `frontend/` para descargarlas antes de compilar.

## 0.7 — 2026-07-08

- Quitada (de momento) la facción oficial "España" de Guerras Napoleónicas.
- Añadidas 5 facciones personalizadas de Black Powder Napoleónicas (Gran Bretaña, Francia, Prusia, Austria y Rusia), con roster completo de unidades (armamento, C.C., Disparo, Moral, Resistencia, reglas especiales, puntos), niveles de comandante (Valor de Mando) y opción universal de tamaño Pequeña/Grande por unidad. Se seleccionan junto a las oficiales activando "Incluir facciones personalizadas".
- Rusia se añade solo como facción personalizada (no existe versión oficial) y de momento no tiene escudo — pendiente de que se suba una imagen.
- Alcance reducido conscientemente en esta tanda (se puede ampliar más adelante): no se han incluido los catálogos de mejoras "a la carta" por categoría (Élite/Fiables/Tenaces...), ni rasgos de comandante como "Inspirador" (el modelo de datos actual no soporta opciones a nivel de ejército ni de comandante), ni un número de peanas por unidad (el documento fuente no lo especifica). También se han descartado del roster de Prusia y Austria unas líneas de opciones que mencionaban "artillería real y KGL" (terminología exclusivamente británica), por parecer un error de copiado del bloque de Gran Bretaña en el documento original.
- Cambio de esquema de datos: `bases` pasa a ser opcional en `UnitStatsSeed` (antes era obligatorio), para no inventar números de peanas donde la fuente no los da.

## 0.6 — 2026-07-08

- Arreglado: los textos (i18n) no aparecían en GitHub Pages. El loader de Transloco pedía `/i18n/es.json` con barra inicial, que en una subruta de GitHub Pages se resuelve contra la raíz del dominio en vez de la carpeta del repo. Cambiado a ruta relativa, igual que ya se hizo con los datos del catálogo.

## 0.5 — 2026-07-08

- Escudos nuevos para Guerra de los 30 Años (Imperio, Suecia, Francia, España), sustituyendo los SVG dibujados a mano por las imágenes subidas por el usuario.
- Nuevo conflicto "Guerras Napoleónicas" dentro de Black Powder, con 6 facciones (Francia Imperial, Gran Bretaña, Prusia, Portugal, España, Austria) y sus escudos — de momento sin comandantes ni unidades, a la espera de las tablas de referencia.

## 0.4 — 2026-07-08

- Nuevo juego "French Indian War" (Guerras Franco-Indias) en el selector, como placeholder vacío (igual que Black Powder y Pike & Shotte normal), con el logo aportado por el usuario. Aún sin conflictos ni facciones cargadas.

## 0.3 — 2026-07-08

- El límite de puntos ahora se hace respetar de verdad: no se puede añadir una unidad ni un comandante si su coste supera los puntos restantes (botón deshabilitado, con motivo explicado en el tooltip).
- Francia y España pasan a ser facciones personalizadas (`is_official: false`); el checkbox "Incluir facciones personalizadas" del selector ahora viene activado por defecto para que se vean desde el principio.
- Separado "Pike & Shotte" en dos juegos distintos: **Epic Pike & Shotte** (con todo el contenido actual: Imperio, Suecia, Francia, España) y **Pike & Shotte** normal (placeholder vacío, a la espera de contenido a escala estándar). El selector de juego ahora muestra 3 opciones, con el logo Epic aportado por el usuario.

## 0.2 — 2026-07-08

- Selector Juego → Conflicto → Facción unificado en una sola página (antes eran 3 páginas separadas), con un diseño tipo "línea de tiempo" numerada: cada paso se resuelve inline y se colapsa a un resumen con opción de "Cambiar", revelando el siguiente paso debajo.
- Retoque visual general (fondo con degradado sutil, tarjetas y espaciados más cuidados) para una sensación más profesional y menos vacía.
- Simplificado el rutado: ya no existen páginas intermedias para conflicto/facción; cualquier enlace antiguo redirige al selector.

## 0.1 — 2026-07-08

Estado inicial versionado de la app:

- Pike & Shotte → Guerra de los Treinta Años, con Ejércitos Imperial, Sueco, Francés y Español completos (comandantes, unidades, opciones y restricciones).
- Generador de listas: battalias con drag-and-drop, límite de puntos configurable, validaciones con motivo explicado (máximos por ejército, ratios, no superar en número, etc.).
- Catálogo servido como JSON estático (sin backend en vivo), desplegado en GitHub Pages vía GitHub Actions.
- Selector de facciones con checkbox "Incluir facciones personalizadas".
- i18n ES/EN completo con Transloco.
