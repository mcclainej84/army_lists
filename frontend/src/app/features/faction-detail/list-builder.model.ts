import { CommanderDTO, UnitDTO } from '../../core/models';

export interface Battalia {
  id: string;
  name: string;
}

export const UNASSIGNED_BATTALIA_ID = 'unassigned';

export interface ListCommanderEntry {
  instanceId: string;
  commander: CommanderDTO;
  battaliaId: string; // UNASSIGNED_BATTALIA_ID si no se ha arrastrado a ninguna battalia todavia
}

export interface ListUnitEntry {
  instanceId: string;
  unit: UnitDTO;
  selectedOptionCodes: string[];
  battaliaId: string; // UNASSIGNED_BATTALIA_ID si no se ha arrastrado a ninguna battalia todavia
}

export interface UnitConstraints {
  maxUnitsPerArmy?: number;
  /** Tope por battalia solo para este codigo de unidad (p.ej. maximo 1 Galloper Gun por battalia). */
  maxPerBattalia?: number;
  /** Tope por battalia compartido entre varios codigos de unidad (p.ej. maximo de baterias de artilleria en total, sean del tipo que sean). */
  maxPerBattaliaGroup?: { key: string; max: number };
  maxRatioTo?: { unitCode: string; ratio: number };
  cannotOutnumber?: string;
  maxRatioToOwnLightOrdnance?: string; // formato "N:M", p.ej. "1:3"
  sourceNote?: string;
}

export interface OptionConstraints {
  maxUnitsPerArmy?: number;
  maxPerBattalia?: number;
  maxRatioToOwnLightOrdnance?: string;
}

let counter = 0;
export function nextInstanceId(prefix = 'instance'): string {
  counter += 1;
  return `${prefix}-${counter}-${Date.now()}`;
}
