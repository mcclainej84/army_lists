# ListGenerator

Generador de listas de ejército para wargames históricos. Empezamos por **Pike & Shotte** (Warlord Games); la estructura está pensada para añadir más juegos después sin rehacer nada.

## Arquitectura (3 capas)

1. **BBDD — SQLite** (`backend/src/db`). Catálogo relacional: Juego → Conflicto → Facción (oficial o personalizada) → Comandantes / Unidades → Opciones de unidad. Las restricciones de composición de lista (máximos por ejército, ratios entre unidades, etc.), que varían mucho de una unidad a otra, se guardan como JSON en `constraints_json` — así seguimos tu idea de usar JSON para configuración sin tener que crear una tabla nueva por cada tipo de regla.
2. **Capa intermedia — Node.js + Express + TypeScript** (`backend/src`). Expone una API REST de solo lectura sobre el catálogo, con la lógica de traducción y localización (repositorio → servicio → rutas).
3. **Frontend** — pendiente (ver "Próximos pasos"). Se decidió no fijarlo aún; candidatos: Angular, React o Vue.

Los textos traducibles (nombres, armamento, reglas especiales, opciones) se guardan en columnas `_en` / `_es` directamente en las tablas, ya que de momento solo hay dos idiomas — más simple que una tabla de traducciones genérica. Se puede normalizar más adelante si se añaden más idiomas.

## Estructura

```
backend/
  src/
    db/
      schema.sql        # esquema SQLite
      client.ts          # conexión + inicialización
      seed.ts             # carga el catálogo en la BBDD
      types.ts            # tipos de los datos semilla
      data/
        pikeAndShotte.ts   # juego "Pike & Shotte"
        thirtyYearsWar.ts  # conflicto "Guerra de los 30 Años" (Imperio + Suecia)
    repositories/          # acceso a datos (SQL puro)
    services/               # localización y armado de DTOs
    routes/                  # endpoints Express
    app.ts / server.ts
```

## Cómo ejecutarlo

> Nota: en este entorno de trabajo no tengo acceso al registro de npm (bloqueado por la política de red del sandbox), así que no pude instalar dependencias ni probar el servidor aquí. El código sigue patrones estándar de Express/better-sqlite3, pero conviene que lo ejecutes tú una vez para confirmar que todo corre limpio.

```bash
cd backend
npm install
npm run seed   # crea backend/data/app.db y carga el catálogo
npm run dev    # arranca la API en http://localhost:3000
```

### Endpoints disponibles

Todos aceptan `?lang=es` (por defecto) o `?lang=en`.

- `GET /api/games`
- `GET /api/games/:gameCode/conflicts`
- `GET /api/games/:gameCode/conflicts/:conflictCode/factions` (filtro opcional `?official=true|false`)
- `GET /api/games/:gameCode/conflicts/:conflictCode/factions/:factionCode` → detalle completo: comandantes, unidades con atributos, puntos y opciones juntos, tal como pediste.

Ejemplo:

```
GET /api/games/pike_and_shotte/conflicts/thirty_years_war/factions/imperial?lang=es
```

## Datos cargados

Pike & Shotte → Guerra de los Treinta Años → Ejército Imperial y Ejército Sueco, con comandantes, todas las unidades de la tabla de referencia y las opciones/restricciones del texto que pasaste (contrastadas contra el reglamento en `epic_ps.md` que subiste — por ejemplo, confirmé que la regla de Caracola automática es solo para los Harquebusiers Imperiales, no los Suecos).

Un punto a vigilar: el reglamento dice literalmente que los *Saxon Musketeers* están limitados "por cada unidad de Imperial Pikemen en el ejército", aunque pertenecen a la lista Sueca. Lo transcribí tal cual (con una nota en `constraints_json.sourceNote`) en vez de "corregirlo" a mi criterio — merece una revisión si tienes una fe de erratas oficial.

## Próximos pasos

- Elegir y montar el frontend (mi recomendación, dado que ya usaremos TypeScript en el backend: **Angular**, por el flujo tipo asistente Juego→Conflicto→Facción→Unidad y sus formularios; con Transloco o ngx-translate para el cambio de idioma en caliente, ya que el i18n nativo de Angular es en tiempo de compilación).
- Guardar/exportar listas de ejército creadas por el usuario (nueva tabla `army_lists` + `army_list_units`).
- Soporte de facciones personalizadas (ya hay columna `owner_email` e `is_official` preparadas).
- Despliegue: vas a alojar en GitHub. GitHub Pages solo sirve contenido estático, así que serviría para el frontend compilado, pero no puede ejecutar este backend Node. Opciones sencillas y con capa gratuita para la API: Render, Railway o Fly.io, desplegando desde el mismo repo con GitHub Actions.
