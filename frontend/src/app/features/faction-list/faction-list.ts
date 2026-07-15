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

// NOTA: este componente no esta enrutado (ver app.routes.ts, que usa el selector
// unificado de home.ts). Se deja sin las 2 fases Facción->Reglamento de home.ts para no
// invertir esfuerzo en una pantalla que nadie ve; solo se mantiene simple y sin errores.
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
}
