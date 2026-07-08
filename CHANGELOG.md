# Changelog

Registro de versiones de ListGenerator. La versión se muestra en el header de la app (junto al nombre) y vive en `frontend/src/app/version.ts`.

Convención: empezamos en **0.1**; el decimal sube de 1 en 1 con cada tanda de cambios (0.1 → 0.2 → 0.3 … → 0.10 → 0.11 …), sin saltar nunca a 1.0 hasta que se decida explícitamente.

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
