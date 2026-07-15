export type Category = "HORSE" | "FOOT" | "ORDNANCE";

export interface UnitOptionSeed {
  code: string;
  description_en: string;
  description_es: string;
  point_delta: number;
  constraints?: Record<string, unknown>;
  /**
   * Para juegos donde el tamaño de una unidad cambia tambien sus estadisticas de combate
   * (no solo el coste en puntos, como en Black Powder) — p.ej. French Indian War, donde
   * cada tamaño tiene su propio numero de peanas, C. a C., Disparo y Aguante. Si un campo
   * no se especifica aqui, se mantiene el valor base de la unidad (UnitStatsSeed) cuando
   * esta opcion esta seleccionada.
   */
  stat_overrides?: {
    bases?: number;
    hand_to_hand?: string;
    shooting?: string;
    stamina?: number;
  };
}

export interface UnitStatsSeed {
  category: Category;
  unit_type_en: string;
  unit_type_es: string;
  // Opcional: algunas fuentes (p.ej. el documento de Black Powder personalizado) no dan
  // un numero de peanas por unidad, a diferencia de las tablas de Pike & Shotte.
  bases?: number;
  armament_en: string;
  armament_es: string;
  hand_to_hand: string;
  shooting: string;
  morale: string;
  stamina: number;
  special_rules_en: string;
  special_rules_es: string;
  // Alcance de movimiento en pulgadas. Opcional: se va rellenando juego a juego (ver
  // CHANGELOG); si falta, el frontend simplemente no muestra la columna para esa unidad.
  move_range?: number;
  // Alcance del arma principal en pulgadas. Mismo criterio que move_range: opcional,
  // ausente = sin dato todavia (p.ej. unidades sin disparo, como picas o espadachines).
  weapon_range?: number;
}

export interface FactionUnitSeed {
  code: string;
  name_en: string;
  name_es: string;
  stats: UnitStatsSeed;
  base_points: number;
  constraints?: Record<string, unknown>;
  options?: UnitOptionSeed[];
}

export type CommanderRole = "army_general" | "battalia_leader";

export interface CommanderSeed {
  code: string;
  name_en: string;
  name_es: string;
  command_rating: number;
  points: number;
  // Alcance de movimiento en pulgadas (a pie o a caballo, segun el comandante). Opcional
  // por la misma razon que en UnitStatsSeed.
  move_range?: number;
  /**
   * Rol del comandante a efectos de restricciones de composicion de lista:
   * - "army_general": unico en todo el ejercito (cuente o no en una battalia concreta).
   * - "battalia_leader": como mucho uno por battalia/brigada, sea cual sea su codigo o
   *   nivel exacto (p.ej. las 3 tarifas de Valor de Mando de Black Powder son 3 codigos
   *   distintos pero ocupan el mismo "puesto" de lider dentro de una brigada).
   * Sin rol (undefined): sin restriccion especial (p.ej. comandantes de apoyo que se
   * puedan repetir libremente).
   */
  role?: CommanderRole;
}

export interface FactionSeed {
  code: string;
  name_en: string;
  name_es: string;
  is_official: boolean;
  // Agrupa varios reglamentos seleccionables de una misma nacion (p.ej. Francia:
  // "french_custom" / "french_clash_of_eagles" / "french_waterloo" comparten
  // group_code "french"). El Paso 3 del selector muestra una sola tarjeta por
  // group_code; el Paso 4 lista todas las variantes de ese grupo para elegir
  // reglamento. Si una faccion no tiene mas variantes, group_code puede coincidir
  // con su propio code (grupo de 1).
  group_code: string;
  // Nombre de ESTE reglamento en concreto (distinto del nombre de la nacion), p.ej.
  // "Reglas Personalizadas", "Clash of Eagles", "Waterloo", "Reglamento Oficial
  // Pike & Shotte". Se muestra tal cual en el Paso 4, ya resuelto por idioma.
  ruleset_name_en: string;
  ruleset_name_es: string;
  // false = reglamento "pendiente de enviar": aparece en el Paso 4 pero
  // deshabilitado, sin comandantes/unidades todavia. Por defecto true.
  available?: boolean;
  commanders: CommanderSeed[];
  units: FactionUnitSeed[];
}

export interface ConflictSeed {
  code: string;
  name_en: string;
  name_es: string;
  factions: FactionSeed[];
}

export interface GameSeed {
  code: string;
  name_en: string;
  name_es: string;
  conflicts: ConflictSeed[];
}
