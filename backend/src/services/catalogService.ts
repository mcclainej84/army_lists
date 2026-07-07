import { catalogRepository, FactionRow, UnitOptionRow, UnitRow } from "../repositories/catalogRepository";

export type Locale = "en" | "es";

export function parseLocale(value: unknown): Locale {
  return value === "en" ? "en" : "es"; // español por defecto
}

function pick<T extends object>(row: T, field: string, locale: Locale): unknown {
  return (row as Record<string, unknown>)[`${field}_${locale}`];
}

export interface UnitOptionDTO {
  id: number;
  code: string;
  description: string;
  pointDelta: number;
  constraints: Record<string, unknown> | null;
}

export interface UnitDTO {
  id: number;
  code: string;
  name: string;
  category: string;
  unitType: string | null;
  bases: number | null;
  armament: string | null;
  handToHand: string | null;
  shooting: string | null;
  morale: string | null;
  stamina: number | null;
  specialRules: string | null;
  basePoints: number;
  constraints: Record<string, unknown> | null;
  options: UnitOptionDTO[];
}

export interface CommanderDTO {
  id: number;
  code: string;
  name: string;
  commandRating: number | null;
  points: number;
}

export interface FactionSummaryDTO {
  id: number;
  code: string;
  name: string;
  isOfficial: boolean;
}

export interface FactionDetailDTO extends FactionSummaryDTO {
  commanders: CommanderDTO[];
  units: UnitDTO[];
}

function toOptionDTO(row: UnitOptionRow, locale: Locale): UnitOptionDTO {
  return {
    id: row.id,
    code: row.code,
    description: String(pick(row, "description", locale)),
    pointDelta: row.point_delta,
    constraints: row.constraints_json ? JSON.parse(row.constraints_json) : null,
  };
}

function toUnitDTO(row: UnitRow, options: UnitOptionRow[], locale: Locale): UnitDTO {
  return {
    id: row.id,
    code: row.code,
    name: String(pick(row, "name", locale)),
    category: row.category,
    unitType: (pick(row, "unit_type", locale) as string) ?? null,
    bases: row.bases,
    armament: (pick(row, "armament", locale) as string) ?? null,
    handToHand: row.hand_to_hand,
    shooting: row.shooting,
    morale: row.morale,
    stamina: row.stamina,
    specialRules: (pick(row, "special_rules", locale) as string) ?? null,
    basePoints: row.base_points,
    constraints: row.constraints_json ? JSON.parse(row.constraints_json) : null,
    options: options.filter((o) => o.unit_id === row.id).map((o) => toOptionDTO(o, locale)),
  };
}

function toFactionSummaryDTO(row: FactionRow, locale: Locale): FactionSummaryDTO {
  return {
    id: row.id,
    code: row.code,
    name: String(pick(row, "name", locale)),
    isOfficial: row.is_official === 1,
  };
}

export const catalogService = {
  listGames(locale: Locale) {
    return catalogRepository.listGames().map((g) => ({ id: g.id, code: g.code, name: String(pick(g, "name", locale)) }));
  },

  listConflicts(gameCode: string, locale: Locale) {
    const game = catalogRepository.findGameByCode(gameCode);
    if (!game) return null;
    return catalogRepository.listConflictsByGame(game.id).map((c) => ({
      id: c.id,
      code: c.code,
      name: String(pick(c, "name", locale)),
    }));
  },

  listFactions(gameCode: string, conflictCode: string, locale: Locale, official?: boolean): FactionSummaryDTO[] | null {
    const game = catalogRepository.findGameByCode(gameCode);
    if (!game) return null;
    const conflict = catalogRepository.findConflictByCode(game.id, conflictCode);
    if (!conflict) return null;
    return catalogRepository.listFactionsByConflict(conflict.id, official).map((f) => toFactionSummaryDTO(f, locale));
  },

  getFactionDetail(
    gameCode: string,
    conflictCode: string,
    factionCode: string,
    locale: Locale
  ): FactionDetailDTO | null {
    const game = catalogRepository.findGameByCode(gameCode);
    if (!game) return null;
    const conflict = catalogRepository.findConflictByCode(game.id, conflictCode);
    if (!conflict) return null;
    const faction = catalogRepository.findFactionByCode(conflict.id, factionCode);
    if (!faction) return null;

    const commanders = catalogRepository.listCommandersByFaction(faction.id).map((c) => ({
      id: c.id,
      code: c.code,
      name: String(pick(c, "name", locale)),
      commandRating: c.command_rating,
      points: c.points,
    }));

    const units = catalogRepository.listUnitsByFaction(faction.id);
    const options = catalogRepository.listOptionsByUnitIds(units.map((u) => u.id));

    return {
      ...toFactionSummaryDTO(faction, locale),
      commanders,
      units: units.map((u) => toUnitDTO(u, options, locale)),
    };
  },
};
