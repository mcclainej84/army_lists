# Changelog

Registro de versiones de ListGenerator. La versión se muestra en el header de la app (junto al nombre) y vive en `frontend/src/app/version.ts`.

Convención: empezamos en **0.1**; el decimal sube de 1 en 1 con cada tanda de cambios (0.1 → 0.2 → 0.3 … → 0.10 → 0.11 …), sin saltar nunca a 1.0 hasta que se decida explícitamente.

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
