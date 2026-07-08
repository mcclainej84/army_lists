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
  spain: 'img/factions/nap-spain.png',
  austria: 'img/factions/nap-austria.png',
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
    return this.includeCustom() ? list : list.filter((f) => f.isOfficial);
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
