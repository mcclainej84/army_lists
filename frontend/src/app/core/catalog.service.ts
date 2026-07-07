import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocaleService } from './locale.service';
import { ConflictDTO, FactionDetailDTO, FactionSummaryDTO, GameDTO } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private localeService = inject(LocaleService);

  private get langParams(): HttpParams {
    return new HttpParams().set('lang', this.localeService.current());
  }

  listGames(): Observable<GameDTO[]> {
    return this.http.get<GameDTO[]>(`${environment.apiBaseUrl}/games`, { params: this.langParams });
  }

  listConflicts(gameCode: string): Observable<ConflictDTO[]> {
    return this.http.get<ConflictDTO[]>(`${environment.apiBaseUrl}/games/${gameCode}/conflicts`, {
      params: this.langParams,
    });
  }

  listFactions(gameCode: string, conflictCode: string, official?: boolean): Observable<FactionSummaryDTO[]> {
    let params = this.langParams;
    if (official !== undefined) {
      params = params.set('official', String(official));
    }
    return this.http.get<FactionSummaryDTO[]>(
      `${environment.apiBaseUrl}/games/${gameCode}/conflicts/${conflictCode}/factions`,
      { params }
    );
  }

  getFactionDetail(gameCode: string, conflictCode: string, factionCode: string): Observable<FactionDetailDTO> {
    return this.http.get<FactionDetailDTO>(
      `${environment.apiBaseUrl}/games/${gameCode}/conflicts/${conflictCode}/factions/${factionCode}`,
      { params: this.langParams }
    );
  }
}
