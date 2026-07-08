import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { CommanderDTO, FactionDetailDTO, UnitDTO, UnitOptionDTO } from '../../core/models';
import { SavedListInput } from '../../core/saved-list.model';
import { SavedListsService } from '../../core/saved-lists.service';
import { BattaliaWarning, canAddUnit, canSelectOption, getBattaliaWarnings, ValidationResult } from './constraints';
import {
  Battalia,
  EffectiveUnitStats,
  effectiveUnitStats,
  ListCommanderEntry,
  ListUnitEntry,
  nextInstanceId,
  UNASSIGNED_BATTALIA_ID,
} from './list-builder.model';
import { exportListToPdf } from './pdf-export';

type Category = 'HORSE' | 'FOOT' | 'ORDNANCE';
// Orden pedido para el catalogo: Mando (aparte, son comandantes) / Infanteria / Caballeria / Artilleria.
const CATEGORY_ORDER: Category[] = ['FOOT', 'HORSE', 'ORDNANCE'];
// Mismo orden, pero como rango numerico: se usa para decidir donde insertar una unidad
// nueva dentro de "Mi Lista" por defecto (comandantes ya van aparte, por encima, asi que
// aqui solo hace falta Infanteria/Caballeria/Artilleria). Dentro de una misma categoria,
// se ordena despues por Aguante (stamina) de menor a mayor.
const CATEGORY_SORT_RANK: Record<Category, number> = { FOOT: 0, HORSE: 1, ORDNANCE: 2 };

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
  authService = inject(AuthService);
  private savedListsService = inject(SavedListsService);

  gameCode = '';
  conflictCode = '';
  categoryOrder = CATEGORY_ORDER;
  unassignedId = UNASSIGNED_BATTALIA_ID;

  /**
   * El nombre de "battalia" cambia segun el reglamento: en Pike & Shotte (epoca de picas y
   * mosquetes) el termino historico es "Battalia"; en Black Powder (Napoleonicas) y en
   * French Indian War la unidad de mando se llama "Brigada". Se resuelve por gameCode en
   * vez de tener un unico termino fijo en las traducciones.
   */
  groupNoun(capitalize: boolean): string {
    const brigadeGames = ['black_powder', 'french_indian_war'];
    const key = brigadeGames.includes(this.gameCode) ? 'factionDetail.groupNoun.brigade' : 'factionDetail.groupNoun.battalia';
    const word = this.transloco.translate(key);
    return capitalize ? word : word.toLowerCase();
  }

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
      this.currentListId.set(null);
      this.saveListName.set('');
      this.saveError.set('');
      return this.catalogService.getFactionDetail(this.gameCode, this.conflictCode, factionCode).pipe(
        tap(() => {
          // French Indian War no tiene el concepto de "varias battalias/brigadas": es una
          // unica fuerza. Se crea automaticamente y las unidades anadidas caen ahi directas,
          // sin que el usuario tenga que crear ni elegir ninguna (solo pasa en este juego).
          if (this.gameCode === 'french_indian_war' && this.battalias().length === 0) {
            this.addBattalia();
          }
          // Si venimos de "Mis Listas" (Cargar/Editar), la ruta lleva ?listId=... y aqui se
          // rellena el constructor con lo que habia guardado, en vez de empezar de cero.
          const listId = this.route.snapshot.queryParamMap.get('listId');
          if (listId) {
            this.loadSavedList(listId);
          }
        })
      );
    })
  );

  private async loadSavedList(listId: string): Promise<void> {
    try {
      const saved = await this.savedListsService.getList(listId);
      if (!saved) return;
      this.battalias.set(saved.battalias);
      this.listCommanders.set(saved.listCommanders);
      this.listUnits.set(saved.listUnits);
      this.pointsLimit.set(saved.pointsLimit);
      this.currentListId.set(saved.id);
      this.saveListName.set(saved.name);
      this.exportListName.set(saved.name);
      this.activeBattaliaId.set(saved.battalias[0]?.id ?? UNASSIGNED_BATTALIA_ID);
    } catch {
      // Lista de otro usuario, borrada, o sin sesion: las reglas de Firestore lo rechazan.
      // Nos quedamos con la lista vacia de siempre en vez de romper la pantalla.
    }
  }

  // --- Estado del constructor de listas ---
  pointsLimit = signal(600);
  listCommanders = signal<ListCommanderEntry[]>([]);
  listUnits = signal<ListUnitEntry[]>([]);
  battalias = signal<Battalia[]>([]);
  /** Battalia "en foco": donde aterrizan las nuevas unidades/comandantes al pulsar Anadir. */
  activeBattaliaId = signal<string>(UNASSIGNED_BATTALIA_ID);
  /** Opciones marcadas (pero aun no confirmadas) en el catalogo, antes de pulsar "Anadir". Clave: unit.code */
  pendingSelections = signal<Record<string, string[]>>({});

  // --- Exportacion a PDF ---
  exportDialogOpen = signal(false);
  exportListName = signal('');
  private exportFactionName = '';

  // --- Guardado de listas (Firebase) ---
  /** Id del documento de Firestore si esta lista ya se guardo/cargo antes; null = todavia no se ha guardado nunca. */
  currentListId = signal<string | null>(null);
  saveDialogOpen = signal(false);
  saveListName = signal('');
  savingInProgress = signal(false);
  saveError = signal('');
  private saveFactionName = '';

  totalPoints = computed(() => {
    const commanderPoints = this.listCommanders().reduce((sum, c) => sum + c.commander.points, 0);
    const unitPoints = this.listUnits().reduce((sum, entry) => sum + this.entryPoints(entry), 0);
    return commanderPoints + unitPoints;
  });

  remainingPoints = computed(() => this.pointsLimit() - this.totalPoints());

  /** Bloquea la exportacion a PDF mientras queden unidades sin asignar a ninguna battalia. */
  hasUnassignedUnits = computed(() => this.listUnits().some((u) => u.battaliaId === UNASSIGNED_BATTALIA_ID));

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

  /** Avisa si esta battalia/brigada ya tiene unidades pero todavia no tiene un lider asignado. */
  missingLeader(battaliaId: string): boolean {
    if (battaliaId === UNASSIGNED_BATTALIA_ID) return false;
    if (this.unitsInBattalia(battaliaId).length === 0) return false;
    return !this.commandersInBattalia(battaliaId).some((c) => c.commander.role === 'battalia_leader');
  }

  warningsForBattalia(battaliaId: string): BattaliaWarning[] {
    return this.battaliaWarnings().filter((w) => w.battaliaId === battaliaId);
  }

  warningMessage(warning: BattaliaWarning): string {
    const groupLower = this.groupNoun(false);
    if (warning.kind === 'group') {
      const groupLabel = this.transloco.translate(`factionDetail.groups.${warning.name}`);
      return this.transloco.translate('factionDetail.warnings.battaliaMaxGroup', {
        max: warning.max,
        name: groupLabel,
        groupLower,
      });
    }
    const key = warning.kind === 'unit' ? 'factionDetail.warnings.battaliaMaxUnit' : 'factionDetail.warnings.battaliaMaxOption';
    return this.transloco.translate(key, { max: warning.max, name: warning.name, groupLower });
  }

  // --- Battalia en foco ---
  setActiveBattalia(id: string): void {
    this.activeBattaliaId.set(id);
  }

  // --- Comandantes ---
  /**
   * Como mucho un lider (role "battalia_leader") por battalia/brigada, sea cual sea su
   * codigo/tarifa exacta (la bolsa "sin asignar" no cuenta). Antes esto solo miraba el
   * codigo literal "battalia_commander", lo que dejaba anadir varios lideres de brigada
   * de Black Powder (codigos "brigade_leader_vm7/8/9") a la misma brigada porque cada
   * tarifa de Valor de Mando es un codigo distinto.
   */
  canAssignCommanderToBattalia(commander: CommanderDTO, battaliaId: string, excludeInstanceId?: string): boolean {
    if (commander.role !== 'battalia_leader') return true;
    if (battaliaId === UNASSIGNED_BATTALIA_ID) return true;
    return !this.listCommanders().some(
      (c) => c.battaliaId === battaliaId && c.commander.role === 'battalia_leader' && c.instanceId !== excludeInstanceId
    );
  }

  /** El Army General es unico en todo el ejercito (cuente o no en una battalia concreta). */
  canAddCommander(commander: CommanderDTO): boolean {
    if (commander.points > this.remainingPoints()) return false;
    if (commander.role === 'army_general') {
      return !this.listCommanders().some((c) => c.commander.role === 'army_general');
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
    this.battalias.update((list) => [...list, { id, name: `${this.groupNoun(true)} ${n}` }]);
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

  // --- Tamaño de unidad (Pequeña/Mediana/Grande): selector excluyente, no checkboxes sueltos ---
  private static readonly SIZE_CODES = ['small', 'medium', 'large'];

  /** Opciones de tamaño de esta unidad (puede tener "Pequeña", "Mediana", "Grande", varias o ninguna). */
  sizeOptions(unit: UnitDTO): UnitOptionDTO[] {
    return unit.options.filter((o) => FactionDetail.SIZE_CODES.includes(o.code));
  }

  /** El resto de opciones de la unidad, excluyendo tamaño (se siguen mostrando como checkboxes). */
  nonSizeOptions(unit: UnitDTO): UnitOptionDTO[] {
    return unit.options.filter((o) => !FactionDetail.SIZE_CODES.includes(o.code));
  }

  /** Código de tamaño marcado ahora mismo ("small"/"medium"/"large"), o null si esta en "Normal". */
  selectedSizeCode(unitCode: string): string | null {
    return this.pendingOptionsFor(unitCode).find((c) => FactionDetail.SIZE_CODES.includes(c)) ?? null;
  }

  /** Selecciona un tamaño (quitando el anterior si estaba marcado) o vuelve a "Normal" con null. */
  setSize(unit: UnitDTO, code: string | null): void {
    if (code) {
      const option = unit.options.find((o) => o.code === code);
      if (!option || !this.canSelectPendingOption(unit, option)) return;
    }
    const withoutSize = this.pendingOptionsFor(unit.code).filter((c) => !FactionDetail.SIZE_CODES.includes(c));
    const updated = code ? [...withoutSize, code] : withoutSize;
    this.pendingSelections.update((map) => ({ ...map, [unit.code]: updated }));
  }

  /** Estadisticas efectivas de la unidad en el catalogo, segun el tamaño marcado (aun sin anadir). */
  previewStats(unit: UnitDTO): EffectiveUnitStats {
    return effectiveUnitStats(unit, this.pendingOptionsFor(unit.code));
  }

  /** Estadisticas efectivas de una entrada ya anadida a "Mi Lista", segun sus opciones elegidas. */
  entryStats(entry: ListUnitEntry): EffectiveUnitStats {
    return effectiveUnitStats(entry.unit, entry.selectedOptionCodes);
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

  /** Rango de orden por defecto: [categoria (Infanteria/Caballeria/Artilleria), Aguante efectivo]. */
  private sortRank(unit: UnitDTO, selectedOptionCodes: string[]): [number, number] {
    return [CATEGORY_SORT_RANK[unit.category] ?? 99, effectiveUnitStats(unit, selectedOptionCodes).stamina ?? 0];
  }

  addUnit(unit: UnitDTO): void {
    if (!this.canAddUnit(unit)) return;
    const selectedOptionCodes = this.pendingOptionsFor(unit.code);
    const battaliaId = this.activeBattaliaId();
    const newEntry: ListUnitEntry = { instanceId: nextInstanceId('unit'), unit, selectedOptionCodes, battaliaId };

    // Insercion por defecto ordenada (categoria, luego Aguante). No se reordena la lista
    // entera en cada render para no pelearse con el reordenado manual por arrastre: solo
    // se decide la posicion de entrada al anadir la unidad.
    this.listUnits.update((list) => {
      const outside = list.filter((e) => e.battaliaId !== battaliaId);
      const within = list.filter((e) => e.battaliaId === battaliaId);

      const [newCategoryRank, newStamina] = this.sortRank(unit, selectedOptionCodes);
      let insertAt = within.length;
      for (let i = 0; i < within.length; i++) {
        const [categoryRank, stamina] = this.sortRank(within[i].unit, within[i].selectedOptionCodes);
        if (newCategoryRank < categoryRank || (newCategoryRank === categoryRank && newStamina < stamina)) {
          insertAt = i;
          break;
        }
      }
      within.splice(insertAt, 0, newEntry);

      return [...outside, ...within];
    });
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

  // --- Exportacion a PDF ---
  openExportDialog(factionName: string): void {
    if (this.hasUnassignedUnits()) return;
    this.exportFactionName = factionName;
    if (!this.exportListName().trim()) {
      this.exportListName.set(factionName);
    }
    this.exportDialogOpen.set(true);
  }

  closeExportDialog(): void {
    this.exportDialogOpen.set(false);
  }

  confirmExport(): void {
    const name = this.exportListName().trim();
    if (!name || this.hasUnassignedUnits()) return;

    exportListToPdf({
      listName: name,
      factionName: this.exportFactionName,
      totalPoints: this.totalPoints(),
      pointsLimit: this.pointsLimit(),
      battalias: this.battalias(),
      listCommanders: this.listCommanders(),
      listUnits: this.listUnits(),
      labels: {
        table: {
          unit: this.transloco.translate('factionDetail.table.unit'),
          type: this.transloco.translate('factionDetail.table.type'),
          bases: this.transloco.translate('factionDetail.table.bases'),
          armament: this.transloco.translate('factionDetail.table.armament'),
          handToHand: this.transloco.translate('factionDetail.export.handToHandAbbr'),
          shooting: this.transloco.translate('factionDetail.table.shooting'),
          morale: this.transloco.translate('factionDetail.table.morale'),
          stamina: this.transloco.translate('factionDetail.table.stamina'),
          specialRules: this.transloco.translate('factionDetail.table.specialRules'),
          points: this.transloco.translate('factionDetail.table.points'),
        },
        faction: this.transloco.translate('factionDetail.export.faction'),
        points: this.transloco.translate('factionDetail.table.points'),
        battalia: this.groupNoun(true),
        commander: this.transloco.translate('factionDetail.export.commander'),
        commandRating: this.transloco.translate('factionDetail.commandRating'),
        unassigned: this.transloco.translate('factionDetail.battalias.unassigned'),
        noUnits: this.transloco.translate('factionDetail.export.noUnits'),
        generatedWith: this.transloco.translate('factionDetail.export.generatedWith'),
        page: this.transloco.translate('factionDetail.export.page'),
      },
    });

    this.exportDialogOpen.set(false);
  }

  // --- Guardado de listas (Firebase) ---
  /** true si se puede intentar guardar ahora mismo: hay sesion iniciada y no quedan unidades sin asignar. */
  canSaveList(): boolean {
    return this.authService.isConfigured && !!this.authService.currentUser() && !this.hasUnassignedUnits();
  }

  /** Motivo por el que el boton de guardar esta desactivado, para el tooltip. */
  saveBlockedReason(): string {
    if (!this.authService.isConfigured) return this.transloco.translate('factionDetail.save.notConfigured');
    if (!this.authService.currentUser()) return this.transloco.translate('factionDetail.save.signInRequired');
    if (this.hasUnassignedUnits()) {
      return this.transloco.translate('factionDetail.export.blockedUnassigned', { group: this.groupNoun(true) });
    }
    return '';
  }

  openSaveDialog(factionName: string): void {
    if (!this.canSaveList()) return;
    this.saveFactionName = factionName;
    if (!this.saveListName().trim()) {
      this.saveListName.set(factionName);
    }
    this.saveError.set('');
    this.saveDialogOpen.set(true);
  }

  closeSaveDialog(): void {
    this.saveDialogOpen.set(false);
  }

  async confirmSave(): Promise<void> {
    const name = this.saveListName().trim();
    if (!name || !this.canSaveList()) return;

    const input: SavedListInput = {
      name,
      gameCode: this.gameCode,
      conflictCode: this.conflictCode,
      factionCode: this.route.snapshot.paramMap.get('factionCode') ?? '',
      factionName: this.saveFactionName,
      pointsLimit: this.pointsLimit(),
      totalPoints: this.totalPoints(),
      battalias: this.battalias(),
      listCommanders: this.listCommanders(),
      listUnits: this.listUnits(),
    };

    this.savingInProgress.set(true);
    this.saveError.set('');
    try {
      const existingId = this.currentListId();
      if (existingId) {
        await this.savedListsService.updateList(existingId, input);
      } else {
        const newId = await this.savedListsService.saveList(input);
        this.currentListId.set(newId);
      }
      this.saveDialogOpen.set(false);
    } catch {
      this.saveError.set(this.transloco.translate('factionDetail.save.error'));
    } finally {
      this.savingInProgress.set(false);
    }
  }
}
