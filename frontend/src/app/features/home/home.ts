import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CatalogService } from '../../core/catalog.service';
import { ConflictDTO, FactionSummaryDTO, GameDTO } from '../../core/models';

// Selector unificado Juego -> Conflicto -> Facción en una sola página: cada paso se
// resuelve con datos ya cargados por el paso anterior, sin recargar ni navegar hasta
// que se elige la facción final (que sí abre el generador de listas en su propia ruta).

const GAME_LOGOS: Record<string, string> = {
  epic_pike_and_shotte: 'img/EpicPSlogo.png',
  black_powder: 'img/BPlogo.png',
  french_indian_war: 'img/FIWLogo.png',
};

// Nota: las claves son codigos de faccion. Como distintos conflictos pueden tener
// facciones con nombres parecidos, los codigos de las napoleonicas usan sufijo propio
// (french_custom, no "french") para no chocar con los de Guerra de los 30 Años.
const FACTION_ICONS: Record<string, string> = {
  imperial: 'img/factions/imperial.png',
  swedish: 'img/factions/swedish.png',
  french: 'img/factions/french.png',
  spanish: 'img/factions/spanish.png',
  portugal: 'img/factions/nap-portugal.png',
  // Facciones personalizadas de Black Powder Napoleonicas.
  british_custom: 'img/factions/nap-great-britain.png',
  french_custom: 'img/factions/nap-imperial-france.png',
  prussian_custom: 'img/factions/nap-prussia.png',
  austrian_custom: 'img/factions/nap-austria.png',
  russian_custom: 'img/factions/nap-russia.png',
  // French Indian War: codigos con prefijo propio para no chocar con los "french"/"british"
  // de otros conflictos.
  fiw_british: 'img/factions/fiw-british.png',
  fiw_french: 'img/factions/fiw-french.png',
};

// French Indian War no tiene distincion oficial/personalizada: cada faccion tiene una
// unica lista, asi que al elegir facción se pasa directo al generador, sin pedir ademas
// que reglamento usar (paso 4, ver mas abajo).
const GAMES_WITHOUT_RULESET_STEP = ['french_indian_war'];

@Component({
  selector: 'app-home',
  imports: [TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private catalogService = inject(CatalogService);
  private router = inject(Router);

  games = signal<GameDTO[] | null>(null);
  conflicts = signal<ConflictDTO[] | null>(null);
  factions = signal<FactionSummaryDTO[] | null>(null);

  selectedGame = signal<GameDTO | null>(null);
  selectedConflict = signal<ConflictDTO | null>(null);
  // Facción ya elegida, a la espera de que el usuario confirme que reglamento usar (paso 4).
  // En French Indian War este paso no existe: chooseFaction navega directo al generador.
  selectedFaction = signal<FactionSummaryDTO | null>(null);

  constructor() {
    this.catalogService.listGames().subscribe((games) => this.games.set(games));
  }

  logoFor(game: GameDTO): string | null {
    return GAME_LOGOS[game.code] ?? null;
  }

  iconFor(faction: FactionSummaryDTO): string | null {
    return FACTION_ICONS[faction.code] ?? null;
  }

  // Ya no hay checkbox de "incluir personalizadas" ni facciones "anfitrionas": se muestran
  // siempre todas las facciones que devuelva la API tal cual.
  visibleFactions(): FactionSummaryDTO[] {
    return this.factions() ?? [];
  }

  /**
   * En Black Powder queremos las facciones siempre en una sola fila (a diferencia del
   * resto de conflictos, donde se deja que el grid las reparta en varias filas segun el
   * ancho). Las columnas se calculan segun cuantas facciones haya en vez de un numero fijo.
   */
  factionGridStyle(): Record<string, string> | null {
    if (this.selectedGame()?.code !== 'black_powder') return null;
    const count = this.visibleFactions().length;
    if (!count) return null;
    return { 'grid-template-columns': `repeat(${count}, minmax(0, 1fr))` };
  }

  showRulesetStep(): boolean {
    return !GAMES_WITHOUT_RULESET_STEP.includes(this.selectedGame()?.code ?? '');
  }

  /**
   * Texto del reglamento a mostrar en el paso 4. Por ahora cada facción tiene un unico
   * reglamento posible (no hay eleccion real todavia), pero se muestra igualmente como
   * paso propio: deja sitio a que en el futuro una facción pueda tener mas de una opcion,
   * y aqui mismo se resuelve el caso especial de Epic Pike & Shotte (que nombra el
   * reglamento oficial explicitamente, a diferencia del resto de juegos).
   */
  rulesetTitleKey(faction: FactionSummaryDTO): string {
    if (!faction.isOfficial) return 'factions.ruleset.custom';
    return this.selectedGame()?.code === 'epic_pike_and_shotte' ? 'factions.ruleset.officialPikeShotte' : 'factions.ruleset.official';
  }

  chooseGame(game: GameDTO): void {
    this.selectedGame.set(game);
    this.selectedConflict.set(null);
    this.conflicts.set(null);
    this.factions.set(null);
    this.selectedFaction.set(null);
    this.catalogService.listConflicts(game.code).subscribe((conflicts) => {
      this.conflicts.set(conflicts);
      // Si el juego solo tiene un conflicto (p.ej. French Indian War), no tiene sentido
      // pedirle al usuario que lo elija: se selecciona solo y se pasa directo a facciones.
      if (conflicts.length === 1) {
        this.chooseConflict(conflicts[0]);
      }
    });
  }

  chooseConflict(conflict: ConflictDTO): void {
    const game = this.selectedGame();
    if (!game) return;
    this.selectedConflict.set(conflict);
    this.factions.set(null);
    this.selectedFaction.set(null);
    this.catalogService.listFactions(game.code, conflict.code).subscribe((factions) => this.factions.set(factions));
  }

  /**
   * Al elegir facción: en French Indian War (sin paso de reglamento) se navega directo al
   * generador, igual que antes. En el resto, se guarda la facción elegida y se muestra el
   * paso 4 para confirmar el reglamento antes de navegar.
   */
  chooseFaction(faction: FactionSummaryDTO): void {
    if (!this.showRulesetStep()) {
      this.goToFaction(faction);
      return;
    }
    this.selectedFaction.set(faction);
  }

  goToFaction(faction: FactionSummaryDTO): void {
    const game = this.selectedGame();
    const conflict = this.selectedConflict();
    if (!game || !conflict) return;
    this.router.navigate(['/juegos', game.code, 'conflictos', conflict.code, 'facciones', faction.code]);
  }

  changeGame(): void {
    this.selectedGame.set(null);
    this.selectedConflict.set(null);
    this.conflicts.set(null);
    this.factions.set(null);
    this.selectedFaction.set(null);
  }

  changeConflict(): void {
    this.selectedConflict.set(null);
    this.factions.set(null);
    this.selectedFaction.set(null);
  }

  changeFaction(): void {
    this.selectedFaction.set(null);
  }
}
