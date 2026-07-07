import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  includeCustom = signal(false);

  // Sin filtro official: trae oficiales y personalizadas juntas; cual se muestra se decide
  // en la plantilla segun el checkbox, no repitiendo la llamada a la API.
  factions$: Observable<FactionSummaryDTO[]> = this.route.paramMap.pipe(
    switchMap((params) => {
      this.gameCode = params.get('gameCode') ?? '';
      this.conflictCode = params.get('conflictCode') ?? '';
      return this.catalogService.listFactions(this.gameCode, this.conflictCode);
    })
  );

  visibleFactions(factions: FactionSummaryDTO[]): FactionSummaryDTO[] {
    return this.includeCustom() ? factions : factions.filter((f) => f.isOfficial);
  }

  iconFor(faction: FactionSummaryDTO): string | null {
    return FACTION_ICONS[faction.code] ?? null;
  }
}
