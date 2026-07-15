import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable, switchMap } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { FactionSummaryDTO } from '../../core/models';

// Icono por facción. Carpeta pensada para ir creciendo con nuevas facciones/juegos:
// frontend/public/img/factions/<codigo-de-la-faccion>.svg
const FACTION_ICONS: Record<string, string> = {
  imperial: 'img/factions/imperial.svg',
  swedish: 'img/factions/swedish.svg',
};

// French Indian War no tiene distincion oficial/personalizada: cada faccion tiene una
// unica lista, asi que no tiene sentido mostrar la etiqueta de reglamento en sus tarjetas.
const GAMES_WITHOUT_RULESET_BADGE = ['french_indian_war'];

@Component({
  selector: 'app-faction-list',
  imports: [AsyncPipe, RouterLink, TranslocoModule],
  templateUrl: './faction-list.html',
  styleUrl: './faction-list.scss',
})
export class FactionList {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);

  gameCode = '';
  conflictCode = '';

  // Ya no hay checkbox de "incluir personalizadas": se muestran siempre todas las
  // facciones que devuelva la API, cada una con su etiqueta de reglamento (ver
  // showRulesetBadge/rulesetLabelKey) en vez de ocultar unas u otras.
  factions$: Observable<FactionSummaryDTO[]> = this.route.paramMap.pipe(
    switchMap((params) => {
      this.gameCode = params.get('gameCode') ?? '';
      this.conflictCode = params.get('conflictCode') ?? '';
      return this.catalogService.listFactions(this.gameCode, this.conflictCode);
    })
  );

  iconFor(faction: FactionSummaryDTO): string | null {
    return FACTION_ICONS[faction.code] ?? null;
  }

  showRulesetBadge(): boolean {
    return !GAMES_WITHOUT_RULESET_BADGE.includes(this.gameCode);
  }

  rulesetLabelKey(faction: FactionSummaryDTO): string {
    return faction.isOfficial ? 'factions.ruleset.official' : 'factions.ruleset.custom';
  }
}
