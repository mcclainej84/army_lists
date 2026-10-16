import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { CatalogOverridesService } from './catalog-overrides.service';
import { LocaleService } from './locale.service';
import { ConflictDTO, FactionDetailDTO, FactionSummaryDTO, GameDTO } from './models';

// El catálogo (juegos/conflictos/facciones/unidades) se sirve como JSON estático
// pre-generado (ver backend/src/scripts/generateStaticCatalog.ts, "npm run build:static"),
// no desde una API en vivo. Esto permite desplegar toda la app en GitHub Pages sin
// backend ni base de datos: la generación de listas es 100% cliente.
//
// Encima de ese catálogo base se aplican los "datos maestros editados" (ver
// CatalogOverridesService): si una facción se ha editado desde la sección Datos, se usa la
// versión editada en lugar del JSON estático.
//
// Las rutas son relativas (sin "/" inicial) para funcionar tanto en local (ng serve
// en la raíz) como en GitHub Pages (subruta tipo /nombre-repo/), respetando el
// <base href> que configure el build.
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private localeService = inject(LocaleService);
  private overrides = inject(CatalogOverridesService);

  private get lang(): string {
    return this.localeService.current();
  }

  listGames(): Observable<GameDTO[]> {
    return this.http.get<GameDTO[]>(`data/${this.lang}/games.json`);
  }

  listConflicts(gameCode: string): Observable<ConflictDTO[]> {
    return this.http.get<ConflictDTO[]>(`data/${this.lang}/games/${gameCode}/conflicts.json`);
  }

  listFactions(gameCode: string, conflictCode: string): Observable<FactionSummaryDTO[]> {
    return this.http.get<FactionSummaryDTO[]>(
      `data/${this.lang}/games/${gameCode}/conflicts/${conflictCode}/factions.json`
    );
  }

  /** Facción tal cual está en el catálogo estático original (sin aplicar ediciones). */
  getBaseFactionDetail(gameCode: string, conflictCode: string, factionCode: string): Observable<FactionDetailDTO> {
    return this.http.get<FactionDetailDTO>(
      `data/${this.lang}/games/${gameCode}/conflicts/${conflictCode}/factions/${factionCode}.json`
    );
  }

  /** Facción con los datos maestros editados aplicados (si los hay). Es la que usa el constructor de listas. */
  getFactionDetail(gameCode: string, conflictCode: string, factionCode: string): Observable<FactionDetailDTO> {
    const locale = this.localeService.current();
    return this.getBaseFactionDetail(gameCode, conflictCode, factionCode).pipe(
      switchMap((base) =>
        from(this.overrides.getOverride(locale, gameCode, conflictCode, factionCode)).pipe(map((edited) => edited ?? base))
      )
    );
  }

  /** Versión editada de la facción, o null si todavía no se ha editado. */
  getEditedFactionDetail(gameCode: string, conflictCode: string, factionCode: string): Observable<FactionDetailDTO | null> {
    return from(this.overrides.getOverride(this.localeService.current(), gameCode, conflictCode, factionCode));
  }
}
