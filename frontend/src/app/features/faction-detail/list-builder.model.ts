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

export interface EffectiveUnitStats {
  bases: number | null;
  handToHand: string | null;
  shooting: string | null;
  stamina: number | null;
}

/**
 * Estadisticas "reales" de una unidad segun las opciones seleccionadas: en la mayoria de
 * juegos (p.ej. Black Powder) el tamaño solo cambia puntos y las estadisticas base se
 * mantienen. En otros (p.ej. French Indian War) cada tamaño tiene sus propias peanas,
 * C. a C., Disparo y Aguante (ver UnitOptionDTO.statOverrides): si una de las opciones
 * marcadas trae overrides, se usan esos valores; si no, se mantienen los de la unidad.
 */
export function effectiveUnitStats(unit: UnitDTO, selectedOptionCodes: string[]): EffectiveUnitStats {
  const overrideOption = unit.options.find((o) => selectedOptionCodes.includes(o.code) && o.statOverrides);
  const ov = overrideOption?.statOverrides ?? null;
  return {
    bases: ov?.bases ?? unit.bases,
    handToHand: ov?.handToHand ?? unit.handToHand,
    shooting: ov?.shooting ?? unit.shooting,
    stamina: ov?.stamina ?? unit.stamina,
  };
}
