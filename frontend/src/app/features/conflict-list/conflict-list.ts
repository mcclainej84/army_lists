import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable, switchMap } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { ConflictDTO } from '../../core/models';

@Component({
  selector: 'app-conflict-list',
  imports: [AsyncPipe, RouterLink, TranslocoModule],
  templateUrl: './conflict-list.html',
  styleUrl: './conflict-list.scss',
})
export class ConflictList {
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);

  gameCode = '';
  conflicts$: Observable<ConflictDTO[]> = this.route.paramMap.pipe(
    switchMap((params) => {
      this.gameCode = params.get('gameCode') ?? '';
      return this.catalogService.listConflicts(this.gameCode);
    })
  );
}
