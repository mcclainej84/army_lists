export type Category = "HORSE" | "FOOT" | "ORDNANCE";

export interface UnitOptionSeed {
  code: string;
  description_en: string;
  description_es: string;
  point_delta: number;
  constraints?: Record<string, unknown>;
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

export interface CommanderSeed {
  code: string;
  name_en: string;
  name_es: string;
  command_rating: number;
  points: number;
}

export interface FactionSeed {
  code: string;
  name_en: string;
  name_es: string;
  is_official: boolean;
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
