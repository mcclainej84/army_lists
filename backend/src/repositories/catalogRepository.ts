import { db } from "../db/client";

export interface GameRow {
  id: number;
  code: string;
  name_en: string;
  name_es: string;
}

export interface ConflictRow extends GameRow {
  game_id: number;
}

export interface FactionRow extends GameRow {
  conflict_id: number;
  is_official: number;
  owner_email: string | null;
}

export interface CommanderRow {
  id: number;
  faction_id: number;
  code: string;
  name_en: string;
  name_es: string;
  command_rating: number | null;
  points: number;
}

export interface UnitRow {
  id: number;
  faction_id: number;
  code: string;
  name_en: string;
  name_es: string;
  category: "HORSE" | "FOOT" | "ORDNANCE";
  unit_type_en: string | null;
  unit_type_es: string | null;
  bases: number | null;
  armament_en: string | null;
  armament_es: string | null;
  hand_to_hand: string | null;
  shooting: string | null;
  morale: string | null;
  stamina: number | null;
  special_rules_en: string | null;
  special_rules_es: string | null;
  base_points: number;
  constraints_json: string | null;
}

export interface UnitOptionRow {
  id: number;
  unit_id: number;
  code: string;
  description_en: string;
  description_es: string;
  point_delta: number;
  constraints_json: string | null;
}

export const catalogRepository = {
  listGames(): GameRow[] {
    return db.prepare("SELECT * FROM games ORDER BY id").all() as GameRow[];
  },

  findGameByCode(code: string): GameRow | undefined {
    return db.prepare("SELECT * FROM games WHERE code = ?").get(code) as GameRow | undefined;
  },

  listConflictsByGame(gameId: number): ConflictRow[] {
    return db.prepare("SELECT * FROM conflicts WHERE game_id = ? ORDER BY id").all(gameId) as ConflictRow[];
  },

  findConflictByCode(gameId: number, code: string): ConflictRow | undefined {
    return db
      .prepare("SELECT * FROM conflicts WHERE game_id = ? AND code = ?")
      .get(gameId, code) as ConflictRow | undefined;
  },

  listFactionsByConflict(conflictId: number, officialOnly?: boolean): FactionRow[] {
    if (officialOnly === undefined) {
      return db.prepare("SELECT * FROM factions WHERE conflict_id = ? ORDER BY id").all(conflictId) as FactionRow[];
    }
    return db
      .prepare("SELECT * FROM factions WHERE conflict_id = ? AND is_official = ? ORDER BY id")
      .all(conflictId, officialOnly ? 1 : 0) as FactionRow[];
  },

  findFactionByCode(conflictId: number, code: string): FactionRow | undefined {
    return db
      .prepare("SELECT * FROM factions WHERE conflict_id = ? AND code = ?")
      .get(conflictId, code) as FactionRow | undefined;
  },

  findFactionById(id: number): FactionRow | undefined {
    return db.prepare("SELECT * FROM factions WHERE id = ?").get(id) as FactionRow | undefined;
  },

  listCommandersByFaction(factionId: number): CommanderRow[] {
    return db.prepare("SELECT * FROM commanders WHERE faction_id = ? ORDER BY id").all(factionId) as CommanderRow[];
  },

  listUnitsByFaction(factionId: number): UnitRow[] {
    return db.prepare("SELECT * FROM units WHERE faction_id = ? ORDER BY category, id").all(factionId) as UnitRow[];
  },

  listOptionsByUnit(unitId: number): UnitOptionRow[] {
    return db.prepare("SELECT * FROM unit_options WHERE unit_id = ? ORDER BY id").all(unitId) as UnitOptionRow[];
  },

  listOptionsByUnitIds(unitIds: number[]): UnitOptionRow[] {
    if (unitIds.length === 0) return [];
    const placeholders = unitIds.map(() => "?").join(",");
    return db
      .prepare(`SELECT * FROM unit_options WHERE unit_id IN (${placeholders}) ORDER BY unit_id, id`)
      .all(...unitIds) as UnitOptionRow[];
  },
};
