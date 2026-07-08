-- ListGenerator: esquema base (v1)
-- Catalogo: Juego -> Conflicto -> Faccion (oficial o personalizada) -> Comandantes / Unidades -> Opciones de unidad
-- Los textos traducibles (name, armament, special_rules, description) se guardan en columnas _en / _es.
-- Las restricciones de composicion de lista (maximos, ratios entre unidades, etc.) que varian mucho de
-- unidad a unidad se guardan como JSON en constraints_json, tal y como propuso el usuario para la
-- configuracion: nos da flexibilidad sin tener que modelar una tabla distinta por cada tipo de regla.

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  UNIQUE(game_id, code)
);

CREATE TABLE IF NOT EXISTS factions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conflict_id INTEGER NOT NULL REFERENCES conflicts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  is_official INTEGER NOT NULL DEFAULT 1, -- 1 = oficial, 0 = personalizado
  owner_email TEXT,                       -- NULL para facciones oficiales
  UNIQUE(conflict_id, code)
);

CREATE TABLE IF NOT EXISTS commanders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  command_rating INTEGER,
  points INTEGER NOT NULL,
  role TEXT CHECK (role IN ('army_general', 'battalia_leader')), -- NULL = sin restriccion especial
  UNIQUE(faction_id, code)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faction_id INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('HORSE', 'FOOT', 'ORDNANCE')),
  unit_type_en TEXT,      -- p.ej. "Heavy Horse", "Battle Line", "Pike Block"
  unit_type_es TEXT,
  bases INTEGER,
  armament_en TEXT,
  armament_es TEXT,
  hand_to_hand TEXT,
  shooting TEXT,
  morale TEXT,
  stamina INTEGER,
  special_rules_en TEXT,
  special_rules_es TEXT,
  base_points INTEGER NOT NULL,
  constraints_json TEXT,  -- JSON: maxPerArmy, maxPerBattalia, ratioTo, cannotOutnumber, notes...
  UNIQUE(faction_id, code)
);

CREATE TABLE IF NOT EXISTS unit_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  point_delta INTEGER NOT NULL,
  constraints_json TEXT,  -- JSON: maxUnits, replacesRule, addsRule, notes...
  UNIQUE(unit_id, code)
);
