import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { GameDTO } from '../../core/models';

const GAME_LOGOS: Record<string, string> = {
  pike_and_shotte: 'img/PSlogo.png',
  black_powder: 'img/BPlogo.png',
};

@Component({
  selector: 'app-game-list',
  imports: [AsyncPipe, RouterLink, TranslocoModule],
  templateUrl: './game-list.html',
  styleUrl: './game-list.scss',
})
export class GameList {
  private catalogService = inject(CatalogService);
  games$: Observable<GameDTO[]> = this.catalogService.listGames();

  logoFor(game: GameDTO): string | null {
    return GAME_LOGOS[game.code] ?? null;
  }
}
