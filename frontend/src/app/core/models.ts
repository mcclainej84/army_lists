export type Locale = 'es' | 'en';

export interface GameDTO {
  id: number;
  code: string;
  name: string;
}

export interface ConflictDTO {
  id: number;
  code: string;
  name: string;
}

export interface FactionSummaryDTO {
  id: number;
  code: string;
  name: string;
  isOfficial: boolean;
}

export type CommanderRole = 'army_general' | 'battalia_leader';

export interface CommanderDTO {
  id: number;
  code: string;
  name: string;
  commandRating: number | null;
  points: number;
  role: CommanderRole | null;
}

export interface UnitOptionStatOverridesDTO {
  bases: number | null;
  handToHand: string | null;
  shooting: string | null;
  stamina: number | null;
}

export interface UnitOptionDTO {
  id: number;
  code: string;
  description: string;
  pointDelta: number;
  constraints: Record<string, unknown> | null;
  statOverrides: UnitOptionStatOverridesDTO | null;
}

export interface UnitDTO {
  id: number;
  code: string;
  name: string;
  category: 'HORSE' | 'FOOT' | 'ORDNANCE';
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

export interface FactionDetailDTO extends FactionSummaryDTO {
  commanders: CommanderDTO[];
  units: UnitDTO[];
}
