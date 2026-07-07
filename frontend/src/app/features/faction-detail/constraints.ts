import { UnitDTO, UnitOptionDTO } from '../../core/models';
import { Battalia, ListUnitEntry, OptionConstraints, UnitConstraints, UNASSIGNED_BATTALIA_ID } from './list-builder.model';

// Validacion de restricciones de composicion de lista (v1).
//
// Las restricciones a nivel de ejercito (maxUnitsPerArmy, maxRatioTo, cannotOutnumber) se comprueban
// al anadir una unidad/opcion, y bloquean la accion si se incumplirian.
//
// Las restricciones "por battalia" (maxPerBattalia, tanto a nivel de unidad como de opcion, p.ej.
// Galloper Gun) dependen de a que battalia se arrastre cada unidad, algo que no se sabe hasta que el
// usuario la coloca. Por eso se comprueban aparte, battalia a battalia, y se muestran como aviso no
// bloqueante en vez de impedir la accion.

export function countUnitCode(units: ListUnitEntry[], code: string): number {
  return units.filter((u) => u.unit.code === code).length;
}

export interface ValidationResult {
  allowed: boolean;
  reasonKey?: string;
  reasonParams?: Record<string, unknown>;
}

export function canAddUnit(unit: UnitDTO, units: ListUnitEntry[]): ValidationResult {
  const constraints = (unit.constraints ?? {}) as UnitConstraints;
  const currentCount = countUnitCode(units, unit.code);

  if (constraints.maxUnitsPerArmy !== undefined && currentCount >= constraints.maxUnitsPerArmy) {
    return { allowed: false, reasonKey: 'maxUnitsPerArmy', reasonParams: { max: constraints.maxUnitsPerArmy } };
  }

  if (constraints.maxRatioTo) {
    const targetCount = countUnitCode(units, constraints.maxRatioTo.unitCode);
    const max = targetCount * constraints.maxRatioTo.ratio;
    if (currentCount >= max) {
      return {
        allowed: false,
        reasonKey: 'maxRatioTo',
        reasonParams: { max, ratio: constraints.maxRatioTo.ratio, unitCode: constraints.maxRatioTo.unitCode },
      };
    }
  }

  if (constraints.cannotOutnumber) {
    const targetCount = countUnitCode(units, constraints.cannotOutnumber);
    if (currentCount >= targetCount) {
      return { allowed: false, reasonKey: 'cannotOutnumber', reasonParams: { unitCode: constraints.cannotOutnumber } };
    }
  }

  return { allowed: true };
}

export function canSelectOption(unit: UnitDTO, option: UnitOptionDTO, units: ListUnitEntry[]): ValidationResult {
  const constraints = (option.constraints ?? {}) as OptionConstraints;

  if (constraints.maxUnitsPerArmy !== undefined) {
    const currentWithOption = units.filter(
      (u) => u.unit.code === unit.code && u.selectedOptionCodes.includes(option.code)
    ).length;
    if (currentWithOption >= constraints.maxUnitsPerArmy) {
      return { allowed: false, reasonKey: 'maxUnitsPerArmy', reasonParams: { max: constraints.maxUnitsPerArmy } };
    }
  }

  if (constraints.maxRatioToOwnLightOrdnance) {
    const [numeratorStr, denominatorStr] = constraints.maxRatioToOwnLightOrdnance.split(':');
    const numerator = Number(numeratorStr);
    const denominator = Number(denominatorStr);
    const totalSameCode = countUnitCode(units, unit.code);
    const currentWithOption = units.filter(
      (u) => u.unit.code === unit.code && u.selectedOptionCodes.includes(option.code)
    ).length;
    const max = Math.floor(totalSameCode / denominator) * numerator;
    if (currentWithOption >= max) {
      return { allowed: false, reasonKey: 'maxRatioToOwnLightOrdnance', reasonParams: { max } };
    }
  }

  return { allowed: true };
}

export interface BattaliaWarning {
  battaliaId: string;
  kind: 'unit' | 'option' | 'group';
  /** Nombre ya traducido (unidad/opcion) o clave de grupo sin traducir (p.ej. "ordnance"). */
  name: string;
  max: number;
}

/** Avisos no bloqueantes de restricciones "por battalia", una vez las unidades ya estan repartidas. */
export function getBattaliaWarnings(battalias: Battalia[], units: ListUnitEntry[]): BattaliaWarning[] {
  const warnings: BattaliaWarning[] = [];
  const realBattalias = battalias.filter((b) => b.id !== UNASSIGNED_BATTALIA_ID);

  for (const battalia of realBattalias) {
    const unitsHere = units.filter((u) => u.battaliaId === battalia.id);

    // Restriccion individual por unidad (p.ej. "Maximo 1 Galloper Gun por battalia").
    const seenUnitCodes = new Set(unitsHere.map((u) => u.unit.code));
    for (const code of seenUnitCodes) {
      const sample = unitsHere.find((u) => u.unit.code === code)!;
      const constraints = (sample.unit.constraints ?? {}) as UnitConstraints;
      if (constraints.maxPerBattalia !== undefined) {
        const count = unitsHere.filter((u) => u.unit.code === code).length;
        if (count > constraints.maxPerBattalia) {
          warnings.push({
            battaliaId: battalia.id,
            kind: 'unit',
            name: sample.unit.name,
            max: constraints.maxPerBattalia,
          });
        }
      }
    }

    // Restriccion compartida entre varios codigos de unidad (p.ej. "Maximo de 2 baterias de
    // artilleria por battalia", contando juntas Ligera/Media/Pesada/Galloper Gun).
    const groupCounts = new Map<string, { count: number; max: number }>();
    for (const entry of unitsHere) {
      const constraints = (entry.unit.constraints ?? {}) as UnitConstraints;
      if (!constraints.maxPerBattaliaGroup) continue;
      const { key, max } = constraints.maxPerBattaliaGroup;
      const existing = groupCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groupCounts.set(key, { count: 1, max });
      }
    }
    for (const [key, { count, max }] of groupCounts) {
      if (count > max) {
        warnings.push({ battaliaId: battalia.id, kind: 'group', name: key, max });
      }
    }

    // Restriccion a nivel de opcion (p.ej. Galloper Gun, max 1 por battalia).
    const optionCounts = new Map<string, { count: number; max: number; label: string }>();
    for (const entry of unitsHere) {
      for (const optionCode of entry.selectedOptionCodes) {
        const option = entry.unit.options.find((o) => o.code === optionCode);
        if (!option) continue;
        const optionConstraints = (option.constraints ?? {}) as OptionConstraints;
        if (optionConstraints.maxPerBattalia === undefined) continue;
        const key = `${entry.unit.code}::${optionCode}`;
        const existing = optionCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          optionCounts.set(key, { count: 1, max: optionConstraints.maxPerBattalia, label: option.description });
        }
      }
    }
    for (const { count, max, label } of optionCounts.values()) {
      if (count > max) {
        warnings.push({ battaliaId: battalia.id, kind: 'option', name: label, max });
      }
    }
  }

  return warnings;
}
