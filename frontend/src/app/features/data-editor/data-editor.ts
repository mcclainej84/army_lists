import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CatalogOverridesService } from '../../core/catalog-overrides.service';
import { CatalogService } from '../../core/catalog.service';
import { LocaleService } from '../../core/locale.service';
import {
  CommanderDTO,
  ConflictDTO,
  FactionDetailDTO,
  FactionSummaryDTO,
  GameDTO,
  UnitDTO,
  UnitOptionDTO,
} from '../../core/models';

// Vistas editables: igual que los DTO, mas el texto JSON de "constraints" (campo avanzado:
// reglas de maximos/proporciones) mientras se edita. Al guardar se vuelve a parsear.
type EditableOption = UnitOptionDTO & { constraintsText: string };
type EditableUnit = Omit<UnitDTO, 'options'> & { constraintsText: string; options: EditableOption[] };
type EditableDetail = Omit<FactionDetailDTO, 'units'> & { units: EditableUnit[] };

const ROLES: Array<CommanderDTO['role']> = [null, 'army_general', 'battalia_leader'];

function toText(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : '';
}

/**
 * Editor de datos maestros: permite cambiar comandantes, unidades y opciones de cualquier
 * ejercito de cualquier juego. Los cambios se guardan en Firestore como una version
 * editada de esa faccion e idioma (ver CatalogOverridesService) y solo afectan a los
 * ejercitos NUEVOS que se creen a partir de ahora: las listas ya guardadas llevan su
 * propia copia de las unidades y no se tocan.
 */
@Component({
  selector: 'app-data-editor',
  imports: [FormsModule, RouterLink, TranslocoModule],
  templateUrl: './data-editor.html',
  styleUrl: './data-editor.scss',
})
export class DataEditor {
  authService = inject(AuthService);
  localeService = inject(LocaleService);
  private catalog = inject(CatalogService);
  private overrides = inject(CatalogOverridesService);

  readonly roles = ROLES;

  games = signal<GameDTO[]>([]);
  conflicts = signal<ConflictDTO[]>([]);
  factions = signal<FactionSummaryDTO[]>([]);

  gameCode = signal('');
  conflictCode = signal('');
  factionCode = signal('');

  detail = signal<EditableDetail | null>(null);
  /** true si lo que se muestra viene de una version editada (no del catalogo original). */
  isEdited = signal(false);
  loading = signal(false);
  saving = signal(false);
  message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);
  dirty = signal(false);

  canEdit = computed(() => !!this.authService.currentUser());

  constructor() {
    firstValueFrom(this.catalog.listGames())
      .then((games) => this.games.set(games))
      .catch(() => this.games.set([]));

    // Al cambiar de idioma en la cabecera, se recarga la seleccion actual en ese idioma.
    effect(() => {
      const lang = this.localeService.current();
      untracked(() => {
        if (lang === this.lastLang) return;
        this.lastLang = lang;
        void this.reloadSelectors();
      });
    });
  }

  private lastLang = this.localeService.current();

  private async reloadSelectors(): Promise<void> {
    const game = this.gameCode();
    if (!game) return;
    try {
      this.games.set(await firstValueFrom(this.catalog.listGames()));
      this.conflicts.set(await firstValueFrom(this.catalog.listConflicts(game)));
      const conflict = this.conflictCode();
      if (conflict) {
        this.factions.set(await firstValueFrom(this.catalog.listFactions(game, conflict)));
        if (this.factionCode()) await this.loadFaction();
      }
    } catch {
      // Sin datos para esa combinacion: se deja la seleccion como estaba.
    }
  }

  async onGameChange(code: string): Promise<void> {
    this.gameCode.set(code);
    this.conflictCode.set('');
    this.factionCode.set('');
    this.factions.set([]);
    this.detail.set(null);
    this.message.set(null);
    try {
      this.conflicts.set(await firstValueFrom(this.catalog.listConflicts(code)));
    } catch {
      this.conflicts.set([]);
    }
  }

  async onConflictChange(code: string): Promise<void> {
    this.conflictCode.set(code);
    this.factionCode.set('');
    this.detail.set(null);
    this.message.set(null);
    try {
      this.factions.set(await firstValueFrom(this.catalog.listFactions(this.gameCode(), code)));
    } catch {
      this.factions.set([]);
    }
  }

  async onFactionChange(code: string): Promise<void> {
    this.factionCode.set(code);
    await this.loadFaction();
  }

  private async loadFaction(): Promise<void> {
    const game = this.gameCode();
    const conflict = this.conflictCode();
    const faction = this.factionCode();
    if (!game || !conflict || !faction) return;
    this.loading.set(true);
    this.message.set(null);
    try {
      const edited = await firstValueFrom(this.catalog.getEditedFactionDetail(game, conflict, faction));
      const source = edited ?? (await firstValueFrom(this.catalog.getBaseFactionDetail(game, conflict, faction)));
      this.isEdited.set(!!edited);
      this.detail.set(this.toEditable(source));
      this.dirty.set(false);
    } catch {
      this.detail.set(null);
      this.message.set({ kind: 'error', text: 'dataEditor.loadError' });
    } finally {
      this.loading.set(false);
    }
  }

  private toEditable(source: FactionDetailDTO): EditableDetail {
    const copy = structuredClone(source);
    return {
      ...copy,
      units: copy.units.map((u) => ({
        ...u,
        constraintsText: toText(u.constraints),
        options: u.options.map((o) => ({ ...o, constraintsText: toText(o.constraints) })),
      })),
    };
  }

  markDirty(): void {
    this.dirty.set(true);
  }

  // --- Comandantes ---
  addCommander(): void {
    const d = this.detail();
    if (!d) return;
    const id = Math.max(0, ...d.commanders.map((c) => c.id)) + 1;
    d.commanders.push({ id, code: `commander_${id}_${Date.now()}`, name: '', commandRating: null, points: 0, role: null, moveRange: null });
    this.markDirty();
  }

  removeCommander(index: number): void {
    this.detail()?.commanders.splice(index, 1);
    this.markDirty();
  }

  // --- Unidades ---
  addUnit(): void {
    const d = this.detail();
    if (!d) return;
    const id = Math.max(0, ...d.units.map((u) => u.id)) + 1;
    d.units.push({
      id,
      code: `unit_${id}_${Date.now()}`,
      name: '',
      category: 'FOOT',
      unitType: null,
      bases: null,
      armament: null,
      handToHand: null,
      shooting: null,
      morale: null,
      stamina: null,
      specialRules: null,
      basePoints: 0,
      constraints: null,
      constraintsText: '',
      options: [],
      moveRange: null,
      weaponRange: null,
    });
    this.markDirty();
  }

  removeUnit(index: number): void {
    this.detail()?.units.splice(index, 1);
    this.markDirty();
  }

  addOption(unit: EditableUnit): void {
    const id = Math.max(0, ...unit.options.map((o) => o.id)) + 1;
    unit.options.push({
      id,
      code: `option_${id}_${Date.now()}`,
      description: '',
      pointDelta: 0,
      constraints: null,
      statOverrides: null,
      constraintsText: '',
    });
    this.markDirty();
  }

  removeOption(unit: EditableUnit, index: number): void {
    unit.options.splice(index, 1);
    this.markDirty();
  }

  /** Activa/desactiva los valores propios de una opcion (p.ej. tamaño que cambia peanas/aguante). */
  toggleOverrides(option: EditableOption, enabled: boolean): void {
    option.statOverrides = enabled ? { bases: null, handToHand: null, shooting: null, stamina: null } : null;
    this.markDirty();
  }

  // --- Guardar / descartar / restaurar ---
  private parseConstraints(text: string, label: string): Record<string, unknown> | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(label);
    }
  }

  private toDto(editable: EditableDetail): FactionDetailDTO {
    const units: UnitDTO[] = editable.units.map((u) => {
      const { constraintsText, options, ...rest } = u;
      const blankToNull = (v: string | null): string | null => (v && v.trim() ? v : null);
      return {
        ...rest,
        unitType: blankToNull(u.unitType),
        armament: blankToNull(u.armament),
        handToHand: blankToNull(u.handToHand),
        shooting: blankToNull(u.shooting),
        morale: blankToNull(u.morale),
        specialRules: blankToNull(u.specialRules),
        basePoints: Number(u.basePoints) || 0,
        constraints: this.parseConstraints(constraintsText, u.name || u.code),
        options: options.map((o) => {
          const { constraintsText: optionText, ...optionRest } = o;
          return {
            ...optionRest,
            pointDelta: Number(o.pointDelta) || 0,
            constraints: this.parseConstraints(optionText, `${u.name || u.code} › ${o.description || o.code}`),
          };
        }),
      };
    });
    const commanders = editable.commanders.map((c) => ({ ...c, points: Number(c.points) || 0 }));
    return { ...editable, commanders, units };
  }

  async save(): Promise<void> {
    const d = this.detail();
    if (!d || !this.canEdit()) return;
    let dto: FactionDetailDTO;
    try {
      dto = this.toDto(d);
    } catch (err) {
      this.jsonErrorDetail.set((err as Error).message);
      this.message.set({ kind: 'error', text: 'dataEditor.invalidJson' });
      return;
    }
    this.jsonErrorDetail.set('');
    this.saving.set(true);
    try {
      await this.overrides.saveOverride(
        this.localeService.current(),
        this.gameCode(),
        this.conflictCode(),
        this.factionCode(),
        dto
      );
      this.isEdited.set(true);
      this.dirty.set(false);
      this.message.set({ kind: 'ok', text: 'dataEditor.saved' });
    } catch {
      this.message.set({ kind: 'error', text: 'dataEditor.saveError' });
    } finally {
      this.saving.set(false);
    }
  }

  jsonErrorDetail = signal('');

  async discard(): Promise<void> {
    await this.loadFaction();
  }

  async restoreOriginal(): Promise<void> {
    if (!this.canEdit() || !this.isEdited()) return;
    this.saving.set(true);
    try {
      await this.overrides.deleteOverride(this.localeService.current(), this.gameCode(), this.conflictCode(), this.factionCode());
      await this.loadFaction();
      this.message.set({ kind: 'ok', text: 'dataEditor.restored' });
    } catch {
      this.message.set({ kind: 'error', text: 'dataEditor.saveError' });
    } finally {
      this.saving.set(false);
    }
  }

  signIn(): void {
    this.authService.signInWithGoogle().catch(() => {
      // Popup cerrado por el usuario: nada que hacer.
    });
  }
}
