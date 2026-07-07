# ListGenerator

Generador de listas de ejército para wargames históricos. Empezamos por **Pike & Shotte** (Warlord Games); la estructura está pensada para añadir más juegos después sin rehacer nada.

## Arquitectura

1. **Datos semilla — TypeScript** (`backend/src/db/data`). El catálogo (Juego → Conflicto → Facción oficial o personalizada → Comandantes / Unidades → Opciones) se define como datos TypeScript tipados. Las restricciones de composición de lista (máximos por ejército, ratios entre unidades, etc.) se guardan como objeto `constraints` — así se pueden añadir reglas nuevas sin tocar el esquema.
2. **Generación estática** (`backend/src/scripts/generateStaticCatalog.ts`, `npm run build:static`). Vuelca el catálogo a archivos JSON (uno por idioma/juego/conflicto/facción) en `frontend/public/data/`. Esto es lo que consume la app en producción — **no hay backend en vivo ni base de datos que mantener desplegados**, todo el generador de listas corre en el navegador.
3. **Frontend — Angular** (`frontend/src/app`), con Transloco para el cambio de idioma ES/EN en caliente y Angular CDK para el drag-and-drop de unidades entre battalias.

También existe una API Express + SQLite (`backend/src/server.ts`, `backend/src/db/schema.sql`) que replica el mismo catálogo en una base de datos real, útil si en el futuro se quiere guardar contenido generado por usuarios (por ejemplo, facciones personalizadas persistentes). Hoy el frontend no depende de ella para nada — solo del JSON estático.

Los textos traducibles (nombres, armamento, reglas especiales, opciones) se guardan en campos `_en` / `_es` en los propios datos semilla.

## Estructura

```
backend/
  src/
    db/
      schema.sql              # esquema SQLite (API en vivo, opcional)
      client.ts
      seed.ts                 # carga el catálogo en SQLite (npm run seed)
      types.ts                # tipos de los datos semilla
      data/
        pikeAndShotte.ts       # juego "Pike & Shotte"
        thirtyYearsWar.ts      # conflicto "Guerra de los 30 Años" (Imperio + Suecia)
        thirtyYearsWarFrenchSpanish.ts  # Francia y España
    scripts/
      generateStaticCatalog.ts  # genera frontend/public/data (npm run build:static)
    repositories/ / services/ / routes/ / app.ts / server.ts   # API Express opcional
frontend/
  src/app/
    core/            # CatalogService, modelos, LocaleService
    features/        # game-list, conflict-list, faction-list, faction-detail (el generador)
  public/
    data/            # JSON generado (no se versiona, se regenera con build:static)
    img/
.github/workflows/deploy.yml   # build + despliegue a GitHub Pages
```

## Cómo ejecutarlo en local

```bash
cd backend
npm install
npm run build:static   # genera frontend/public/data desde los datos semilla

cd ../frontend
npm install
npm start               # ng serve, http://localhost:4200
```

Cada vez que cambies datos en `backend/src/db/data/*.ts` (unidades, puntos, facciones nuevas...), vuelve a ejecutar `npm run build:static` y recarga el navegador.

### API Express + SQLite (opcional, no hace falta para usar la app)

Si quieres levantar también la API en vivo (por ejemplo para probar consultas SQL o como base de un futuro guardado de listas):

```bash
cd backend
npm run seed   # crea backend/data/app.db y carga el catálogo
npm run dev    # arranca la API en http://localhost:3000
```

El frontend no la usa — sirve solo como capa alternativa.

## Despliegue en GitHub Pages

`.github/workflows/deploy.yml` genera el catálogo estático y compila Angular en cada push a `main`, y publica el resultado con las Actions oficiales de GitHub Pages (`upload-pages-artifact` / `deploy-pages`).

Pasos únicos de configuración en GitHub, después de subir el repo:

1. Settings → Pages → Source: **GitHub Actions**.
2. Hacer push a `main` (o lanzar el workflow manualmente desde la pestaña Actions).
3. La URL final será `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

El `--base-href` se calcula automáticamente a partir del nombre del repositorio, así que no hay que tocar nada si el repo se llama distinto a `ListGenerator`.

## Datos cargados

Pike & Shotte → Guerra de los Treinta Años → Ejércitos Imperial, Sueco, Francés y Español, con comandantes, unidades con todos sus atributos y las opciones/restricciones de las tablas de referencia.

Puntos a vigilar (transcritos tal cual de las fuentes, con nota en el propio código):

- *Saxon Musketeers* (lista Sueca): el reglamento dice literalmente que están limitados "por cada unidad de Imperial Pikemen en el ejército" aunque pertenecen a otra facción — posible errata de la editorial, no "corregida" a mi criterio.
- Movimiento y Alcance: de momento no se modelan para ninguna unidad (a petición explícita), aunque está previsto añadir ambos campos más adelante para todos los juegos.
- Terminología "Primer Disparo" (Francia/España) vs "Primer Fuego" (Suecia/Alemania): mismo concepto en inglés (*First Fire*), transcrito tal cual aparece en cada fuente.

## Próximos pasos

- Guardar/exportar listas de ejército creadas por el usuario.
- Soporte de facciones personalizadas persistentes (hoy la API Express ya tiene columna `owner_email` / `is_official` preparadas, pero no hay UI para crearlas).
# army_lists
