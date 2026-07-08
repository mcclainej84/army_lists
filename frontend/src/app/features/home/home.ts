import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog.service';
import { ConflictDTO, FactionSummaryDTO, GameDTO } from '../../core/models';

// Selector unificado Juego -> Conflicto -> Facción en una sola página: cada paso se
// resuelve con datos ya cargados por el paso anterior, sin recargar ni navegar hasta
// que se elige la facción final (que sí abre el generador de listas en su propia ruta).

const GAME_LOGOS: Record<string, string> = {
  epic_pike_and_shotte: 'img/EpicPSlogo.png',
  pike_and_shotte: 'img/PSlogo.png',
  black_powder: 'img/BPlogo.png',
  french_indian_war: 'img/FIWLogo.png',
};

// Nota: las claves son codigos de faccion. Como distintos conflictos pueden tener
// facciones con nombres parecidos, los codigos de las napoleonicas usan sufijo propio
// (imperial_france, no "french") para no chocar con los de Guerra de los 30 Años.
const FACTION_ICONS: Record<string, string> = {
  imperial: 'img/factions/imperial.png',
  swedish: 'img/factions/swedish.png',
  french: 'img/factions/french.png',
  spanish: 'img/factions/spanish.png',
  imperial_france: 'img/factions/nap-imperial-france.png',
  great_britain: 'img/factions/nap-great-britain.png',
  prussia: 'img/factions/nap-prussia.png',
  portugal: 'img/factions/nap-portugal.png',
  austria: 'img/factions/nap-austria.png',
  // Facciones personalizadas de Black Powder Napoleonicas: reutilizan el escudo de la
  // nacion oficial correspondiente. Rusia no tiene escudo todavia (a la espera de que
  // el usuario suba uno), asi que se queda sin entrada aqui a proposito.
  british_custom: 'img/factions/nap-great-britain.png',
  french_custom: 'img/factions/nap-imperial-france.png',
  prussian_custom: 'img/factions/nap-prussia.png',
  austrian_custom: 'img/factions/nap-austria.png',
};

// Cuando una nacion tiene tanto version oficial (de momento vacia) como version
// personalizada con reglas completas, no queremos dos botones casi iguales en el
// selector ("Francia Imperial" y "Francia (Reglas Personalizadas)"). En vez de eso se
// muestra un unico boton (el de la faccion oficial) y, si "Incluir facciones
// personalizadas" esta activado, el click lleva directamente a la version personalizada.
// Rusia no tiene version oficial (solo personalizada), asi que no entra en este mapa: se
// sigue mostrando como una entrada normal en la lista.
const CUSTOM_FACTION_OVERRIDES: Record<string, string> = {
  imperial_france: 'french_custom',
  great_britain: 'british_custom',
  prussia: 'prussian_custom',
  austria: 'austrian_custom',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private catalogService = inject(CatalogService);

  games = signal<GameDTO[] | null>(null);
  conflicts = signal<ConflictDTO[] | null>(null);
  factions = signal<FactionSummaryDTO[] | null>(null);

  selectedGame = signal<GameDTO | null>(null);
  selectedConflict = signal<ConflictDTO | null>(null);
  // Activado por defecto: Francia y España se cargan como facciones personalizadas
  // y queremos que se vean desde el principio sin que el usuario tenga que buscarlas.
  includeCustom = signal(true);

  constructor() {
    this.catalogService.listGames().subscribe((games) => this.games.set(games));
  }

  logoFor(game: GameDTO): string | null {
    return GAME_LOGOS[game.code] ?? null;
  }

  iconFor(faction: FactionSummaryDTO): string | null {
    return FACTION_ICONS[faction.code] ?? null;
  }

  visibleFactions(): FactionSummaryDTO[] {
    const list = this.factions();
    if (!list) return [];
    // Las personalizadas que tienen una oficial "anfitriona" (ver CUSTOM_FACTION_OVERRIDES)
    // nunca aparecen como boton propio: se accede a ellas a traves del boton oficial. Las
    // personalizadas "huerfanas" (sin oficial equivalente, p.ej. Rusia) si son su propia
    // entrada, y respetan el checkbox como siempre.
    const overriddenCodes = new Set(Object.values(CUSTOM_FACTION_OVERRIDES));
    return list.filter((f) => {
      if (overriddenCodes.has(f.code)) return false;
      if (f.isOfficial) return true;
      return this.includeCustom();
    });
  }

  /**
   * Codigo de faccion al que navega el click sobre esta tarjeta: si "Incluir facciones
   * personalizadas" esta activado y esta nacion tiene una version personalizada cargada,
   * vamos directos a esa; si no, a la oficial de siempre.
   */
  targetFactionCode(faction: FactionSummaryDTO): string {
    if (!this.includeCustom()) return faction.code;
    const overrideCode = CUSTOM_FACTION_OVERRIDES[faction.code];
    if (!overrideCode) return faction.code;
    const hasCustom = this.factions()?.some((f) => f.code === overrideCode) ?? false;
    return hasCustom ? overrideCode : faction.code;
  }

  chooseGame(game: GameDTO): void {
    this.selectedGame.set(game);
    this.selectedConflict.set(null);
    this.conflicts.set(null);
    this.factions.set(null);
    this.catalogService.listConflicts(game.code).subscribe((conflicts) => this.conflicts.set(conflicts));
  }

  chooseConflict(conflict: ConflictDTO): void {
    const game = this.selectedGame();
    if (!game) return;
    this.selectedConflict.set(conflict);
    this.factions.set(null);
    this.catalogService.listFactions(game.code, conflict.code).subscribe((factions) => this.factions.set(factions));
  }

  changeGame(): void {
    this.selectedGame.set(null);
    this.selectedConflict.set(null);
    this.conflicts.set(null);
    this.factions.set(null);
  }

  changeConflict(): void {
    this.selectedConflict.set(null);
    this.factions.set(null);
  }
}
