import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Observable, switchMap } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { CommanderDTO, FactionDetailDTO, UnitDTO, UnitOptionDTO } from '../../core/models';
import { BattaliaWarning, canAddUnit, canSelectOption, getBattaliaWarnings, ValidationResult } from './constraints';
import { Battalia, ListCommanderEntry, ListUnitEntry, nextInstanceId, UNASSIGNED_BATTALIA_ID } from './list-builder.model';

type Category = 'HORSE' | 'FOOT' | 'ORDNANCE';
// Orden pedido para el catalogo: Mando (aparte, son comandantes) / Infanteria / Caballeria / Artilleria.
const CATEGORY_ORDER: Category[] = ['FOOT', 'HORSE', 'ORDNANCE'];

@Component({
  selector: 'app-faction-detail',
  imports: [AsyncPipe, DragDropModule, FormsModule, RouterLink, TranslocoModule],
  templateUrl: './faction-detail.html',
  styleUrl: './faction-detail.scss',
})
export class FactionDetail {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private transloco = inject(TranslocoService);

  gameCode = '';
  conflictCode = '';
  categoryOrder = CATEGORY_ORDER;
  unassignedId = UNASSIGNED_BATTALIA_ID;

  faction$: Observable<FactionDetailDTO> = this.route.paramMap.pipe(
    switchMap((params) => {
      this.gameCode = params.get('gameCode') ?? '';
      this.conflictCode = params.get('conflictCode') ?? '';
      const factionCode = params.get('factionCode') ?? '';
      // Nueva faccion: empezamos la lista de cero.
      this.listCommanders.set([]);
      this.listUnits.set([]);
      this.battalias.set([]);
      this.pendingSelections.set({});
      this.activeBattaliaId.set(UNASSIGNED_BATTALIA_ID);
      return this.catalogService.getFactionDetail(this.gameCode, this.conflictCode, factionCode);
    })
  );

  // --- Estado del constructor de listas ---
  pointsLimit = signal(600);
  listCommanders = signal<ListCommanderEntry[]>([]);
  listUnits = signal<ListUnitEntry[]>([]);
  battalias = signal<Battalia[]>([]);
  /** Battalia "en foco": donde aterrizan las nuevas unidades/comandantes al pulsar Anadir. */
  activeBattaliaId = signal<string>(UNASSIGNED_BATTALIA_ID);
  /** Opciones marcadas (pero aun no confirmadas) en el catalogo, antes de pulsar "Anadir". Clave: unit.code */
  pendingSelections = signal<Record<string, string[]>>({});

  totalPoints = computed(() => {
    const commanderPoints = this.listCommanders().reduce((sum, c) => sum + c.commander.points, 0);
    const unitPoints = this.listUnits().reduce((sum, entry) => sum + this.entryPoints(entry), 0);
    return commanderPoints + unitPoints;
  });

  remainingPoints = computed(() => this.pointsLimit() - this.totalPoints());

  battaliaWarnings = computed(() => getBattaliaWarnings(this.battalias(), this.listUnits()));

  allDropListIds = computed(() => [this.unassignedId, ...this.battalias().map((b) => b.id)]);
  allCommanderDropListIds = computed(() => this.allDropListIds().map((id) => `cmdr-${id}`));

  /** Columnas a pintar en "Mi Lista": la bolsa de "sin asignar" siempre primero, luego cada battalia. */
  columns = computed(() => [
    { id: this.unassignedId, name: null as string | null, removable: false },
    ...this.battalias().map((b) => ({ id: b.id, name: b.name as string | null, removable: true })),
  ]);

  unitsByCategory(units: UnitDTO[], category: Category): UnitDTO[] {
    return units.filter((u) => u.category === category);
  }

  unitsInBattalia(battaliaId: string): ListUnitEntry[] {
    return this.listUnits().filter((u) => u.battaliaId === battaliaId);
  }

  commandersInBattalia(battaliaId: string): ListCommanderEntry[] {
    return this.listCommanders().filter((c) => c.battaliaId === battaliaId);
  }

  warningsForBattalia(battaliaId: string): BattaliaWarning[] {
    return this.battaliaWarnings().filter((w) => w.battaliaId === battaliaId);
  }

  warningMessage(warning: BattaliaWarning): string {
    if (warning.kind === 'group') {
      const groupLabel = this.transloco.translate(`factionDetail.groups.${warning.name}`);
      return this.transloco.translate('factionDetail.warnings.battaliaMaxGroup', { max: warning.max, name: groupLabel });
    }
    const key = warning.kind === 'unit' ? 'factionDetail.warnings.battaliaMaxUnit' : 'factionDetail.warnings.battaliaMaxOption';
    return this.transloco.translate(key, { max: warning.max, name: warning.name });
  }

  // --- Battalia en foco ---
  setActiveBattalia(id: string): void {
    this.activeBattaliaId.set(id);
  }

  // --- Comandantes ---
  /** Como mucho un Battalia Commander por battalia (la bolsa "sin asignar" no cuenta). */
  canAssignCommanderToBattalia(commander: CommanderDTO, battaliaId: string, excludeInstanceId?: string): boolean {
    if (commander.code !== 'battalia_commander') return true;
    if (battaliaId === UNASSIGNED_BATTALIA_ID) return true;
    return !this.listCommanders().some(
      (c) => c.battaliaId === battaliaId && c.commander.code === 'battalia_commander' && c.instanceId !== excludeInstanceId
    );
  }

  /** El Army General es unico en todo el ejercito (cuente o no en una battalia concreta). */
  canAddCommander(commander: CommanderDTO): boolean {
    if (commander.points > this.remainingPoints()) return false;
    if (commander.code === 'army_general') {
      return !this.listCommanders().some((c) => c.commander.code === 'army_general');
    }
    return this.canAssignCommanderToBattalia(commander, this.activeBattaliaId());
  }

  addCommander(commander: CommanderDTO): void {
    if (!this.canAddCommander(commander)) return;
    this.listCommanders.update((list) => [
      ...list,
      { instanceId: nextInstanceId('cmdr'), commander, battaliaId: this.activeBattaliaId() },
    ]);
  }

  removeCommander(instanceId: string): void {
    this.listCommanders.update((list) => list.filter((c) => c.instanceId !== instanceId));
  }

  // --- Battalias ---
  addBattalia(): void {
    const n = this.battalias().length + 1;
    const id = nextInstanceId('battalia');
    this.battalias.update((list) => [...list, { id, name: `Battalia ${n}` }]);
    this.activeBattaliaId.set(id);
  }

  renameBattalia(id: string, name: string): void {
    this.battalias.update((list) => list.map((b) => (b.id === id ? { ...b, name } : b)));
  }

  removeBattalia(id: string): void {
    this.listUnits.update((list) =>
      list.map((u) => (u.battaliaId === id ? { ...u, battaliaId: UNASSIGNED_BATTALIA_ID } : u))
    );
    this.listCommanders.update((list) =>
      list.map((c) => (c.battaliaId === id ? { ...c, battaliaId: UNASSIGNED_BATTALIA_ID } : c))
    );
    this.battalias.update((list) => list.filter((b) => b.id !== id));
    if (this.activeBattaliaId() === id) {
      this.activeBattaliaId.set(UNASSIGNED_BATTALIA_ID);
    }
  }

  // --- Seleccion de opciones antes de anadir ---
  pendingOptionsFor(unitCode: string): string[] {
    return this.pendingSelections()[unitCode] ?? [];
  }

  isPendingOptionSelected(unitCode: string, optionCode: string): boolean {
    return this.pendingOptionsFor(unitCode).includes(optionCode);
  }

  canSelectPendingOption(unit: UnitDTO, option: UnitOptionDTO): boolean {
    return canSelectOption(unit, option, this.listUnits()).allowed;
  }

  /** Texto explicando por que una opcion esta bloqueada, para el tooltip del checkbox. */
  pendingOptionBlockedReason(unit: UnitDTO, option: UnitOptionDTO, allUnits: UnitDTO[]): string {
    const result = canSelectOption(unit, option, this.listUnits());
    return result.allowed ? '' : this.describeBlockedReason(result, allUnits);
  }

  togglePendingOption(unit: UnitDTO, option: UnitOptionDTO): void {
    const current = this.pendingOptionsFor(unit.code);
    const alreadySelected = current.includes(option.code);
    if (!alreadySelected && !this.canSelectPendingOption(unit, option)) return;

    const updated = alreadySelected ? current.filter((c) => c !== option.code) : [...current, option.code];
    this.pendingSelections.update((map) => ({ ...map, [unit.code]: updated }));
  }

  // --- Unidades ---
  /** Coste de anadir esta unidad ahora mismo, contando las opciones marcadas (aun no confirmadas). */
  costForUnit(unit: UnitDTO): number {
    const optionPoints = this.pendingOptionsFor(unit.code).reduce((s, code) => {
      const option = unit.options.find((o) => o.code === code);
      return s + (option?.pointDelta ?? 0);
    }, 0);
    return unit.basePoints + optionPoints;
  }

  canAddUnit(unit: UnitDTO): boolean {
    if (!canAddUnit(unit, this.listUnits()).allowed) return false;
    return this.costForUnit(unit) <= this.remainingPoints();
  }

  /** Texto explicando por que no se puede anadir la unidad ahora mismo, para el tooltip del boton. */
  addUnitBlockedReason(unit: UnitDTO, allUnits: UnitDTO[]): string {
    const result = canAddUnit(unit, this.listUnits());
    if (!result.allowed) return this.describeBlockedReason(result, allUnits);
    if (this.costForUnit(unit) > this.remainingPoints()) {
      return this.transloco.translate('factionDetail.reasons.notEnoughPoints', {
        cost: this.costForUnit(unit),
        remaining: this.remainingPoints(),
      });
    }
    return '';
  }

  private describeBlockedReason(result: ValidationResult, allUnits: UnitDTO[]): string {
    const params = result.reasonParams ?? {};
    const unitCode = params['unitCode'];
    const targetName = typeof unitCode === 'string' ? allUnits.find((u) => u.code === unitCode)?.name ?? unitCode : '';

    switch (result.reasonKey) {
      case 'maxUnitsPerArmy':
        return this.transloco.translate('factionDetail.reasons.maxUnitsPerArmy', { max: params['max'] });
      case 'maxRatioTo': {
        const ratio = Number(params['ratio']);
        const ratioText = ratio >= 1 ? `${ratio}:1` : `1:${Math.round(1 / ratio)}`;
        return this.transloco.translate('factionDetail.reasons.maxRatioTo', { ratioText, unitName: targetName });
      }
      case 'cannotOutnumber':
        return this.transloco.translate('factionDetail.reasons.cannotOutnumber', { unitName: targetName });
      case 'maxRatioToOwnLightOrdnance':
        return this.transloco.translate('factionDetail.reasons.maxRatioToOwnLightOrdnance', { max: params['max'] });
      default:
        return this.transloco.translate('factionDetail.notAvailable');
    }
  }

  addUnit(unit: UnitDTO): void {
    if (!this.canAddUnit(unit)) return;
    const selectedOptionCodes = this.pendingOptionsFor(unit.code);
    this.listUnits.update((list) => [
      ...list,
      { instanceId: nextInstanceId('unit'), unit, selectedOptionCodes, battaliaId: this.activeBattaliaId() },
    ]);
    this.pendingSelections.update((map) => ({ ...map, [unit.code]: [] }));
  }

  removeUnit(instanceId: string): void {
    this.listUnits.update((list) => list.filter((u) => u.instanceId !== instanceId));
  }

  optionLabels(entry: ListUnitEntry): string {
    if (entry.selectedOptionCodes.length === 0) return '—';
    return entry.selectedOptionCodes
      .map((code) => entry.unit.options.find((o) => o.code === code)?.description ?? code)
      .join(', ');
  }

  entryPoints(entry: ListUnitEntry): number {
    const optionPoints = entry.selectedOptionCodes.reduce((s, code) => {
      const option = entry.unit.options.find((o) => o.code === code);
      return s + (option?.pointDelta ?? 0);
    }, 0);
    return entry.unit.basePoints + optionPoints;
  }

  // --- Drag & drop de unidades ---
  onDrop(event: CdkDragDrop<ListUnitEntry[]>, targetBattaliaId: string): void {
    const movedEntry = event.item.data as ListUnitEntry;

    this.listUnits.update((all) => {
      const withoutMoved = all.filter((u) => u.instanceId !== movedEntry.instanceId);
      const destinationOthers = withoutMoved.filter((u) => u.battaliaId === targetBattaliaId);
      const rest = withoutMoved.filter((u) => u.battaliaId !== targetBattaliaId);

      const updatedMoved: ListUnitEntry = { ...movedEntry, battaliaId: targetBattaliaId };
      const newDestination = [...destinationOthers];
      newDestination.splice(event.currentIndex, 0, updatedMoved);

      return [...rest, ...newDestination];
    });
  }

  // --- Drag & drop de comandantes ---
  onCommanderDrop(event: CdkDragDrop<ListCommanderEntry[]>, targetBattaliaId: string): void {
    const movedEntry = event.item.data as ListCommanderEntry;
    if (!this.canAssignCommanderToBattalia(movedEntry.commander, targetBattaliaId, movedEntry.instanceId)) {
      return; // ya hay un Battalia Commander ahi: no se mueve, se queda donde estaba
    }

    this.listCommanders.update((all) => {
      const withoutMoved = all.filter((c) => c.instanceId !== movedEntry.instanceId);
      const destinationOthers = withoutMoved.filter((c) => c.battaliaId === targetBattaliaId);
      const rest = withoutMoved.filter((c) => c.battaliaId !== targetBattaliaId);

      const updatedMoved: ListCommanderEntry = { ...movedEntry, battaliaId: targetBattaliaId };
      const newDestination = [...destinationOthers];
      newDestination.splice(event.currentIndex, 0, updatedMoved);

      return [...rest, ...newDestination];
    });
  }
}
