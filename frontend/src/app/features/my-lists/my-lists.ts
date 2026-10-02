import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
import { GAME_LOGOS } from '../../core/game-assets';
import { SavedListSummary } from '../../core/saved-list.model';
import { SavedListsService } from '../../core/saved-lists.service';

// Codigo de juego -> clase CSS de acento: cada juego tiene su propio color de "carpeta de
// campaña" (ver my-lists.scss) para poder distinguirlas de un vistazo en la rejilla de
// tarjetas, igual que unos legajos de archivo militar con cintas de colores distintos.
const GAME_ACCENT_CLASS: Record<string, string> = {
  epic_pike_and_shotte: 'accent-eps',
  black_powder: 'accent-bp',
  french_indian_war: 'accent-fiw',
};

// Pagina "Mis Listas": solo tiene sentido con sesion iniciada (las listas viven en
// Firestore, ligadas al usuario), pero la ruta en si es visible sin iniciar sesion (se
// puede navegar sin registrarse por toda la app) y simplemente muestra una invitacion a
// iniciar sesion en vez de la rejilla de tarjetas.
@Component({
  selector: 'app-my-lists',
  imports: [DatePipe, FormsModule, RouterLink, TranslocoModule],
  templateUrl: './my-lists.html',
  styleUrl: './my-lists.scss',
})
export class MyLists {
  authService = inject(AuthService);
  private savedListsService = inject(SavedListsService);

  lists = signal<SavedListSummary[] | null>(null);
  loadError = signal('');
  deletingId = signal<string | null>(null);
  private lastLoadedUid: string | null = null;

  // --- Buscador (solo se muestra si hay listas suficientes para que merezca la pena). ---
  searchTerm = signal('');
  showSearch = computed(() => (this.lists()?.length ?? 0) > 3);
  filteredLists = computed(() => {
    const all = this.lists() ?? [];
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return all;
    return all.filter((l) =>
      [l.name, l.factionName, l.gameName, l.conflictName, l.rulesetName].some((field) =>
        field.toLowerCase().includes(term)
      )
    );
  });

  // --- Confirmacion de borrado: modal propio en vez de confirm() nativo del navegador,
  // para que no rompa la ambientacion ilustrada del resto de la app con un dialogo del
  // sistema operativo. ---
  pendingDelete = signal<SavedListSummary | null>(null);

  constructor() {
    // authReady tarda un instante en resolverse al entrar directo por URL (Firebase
    // comprueba de forma asincrona si ya habia sesion abierta), asi que se reacciona por
    // signal en vez de comprobarlo una unica vez en el constructor.
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.uid !== this.lastLoadedUid) {
        this.lastLoadedUid = user.uid;
        this.refresh();
      } else if (!user) {
        this.lastLoadedUid = null;
        this.lists.set(null);
      }
    });
  }

  signIn(): void {
    this.authService.signInWithGoogle().then(() => this.refresh()).catch(() => {
      // Popup cerrado por el usuario: no hay nada que hacer.
    });
  }

  refresh(): void {
    this.loadError.set('');
    this.savedListsService
      .listMyLists()
      .then((lists) => this.lists.set(lists))
      .catch((err) => {
        // El texto que ve el usuario es generico (traducido), pero el error real se deja
        // en la consola del navegador para poder diagnosticarlo (p.ej. reglas de Firestore
        // o un indice que falte).
        console.error('Error cargando "Mis Listas":', err);
        this.loadError.set('myLists.loadError');
        this.lists.set([]);
      });
  }

  routeFor(list: SavedListSummary): unknown[] {
    return ['/juegos', list.gameCode, 'conflictos', list.conflictCode, 'facciones', list.factionCode];
  }

  logoFor(list: SavedListSummary): string | null {
    return GAME_LOGOS[list.gameCode] ?? null;
  }

  accentClassFor(list: SavedListSummary): string {
    return GAME_ACCENT_CLASS[list.gameCode] ?? 'accent-default';
  }

  /** Fraccion 0-1 de puntos usados, para la barra de progreso de la tarjeta (nunca pasa de 1 aunque se exceda el limite). */
  pointsRatio(list: SavedListSummary): number {
    if (list.pointsLimit <= 0) return 0;
    return Math.min(1, list.totalPoints / list.pointsLimit);
  }

  isOverLimit(list: SavedListSummary): boolean {
    return list.totalPoints > list.pointsLimit;
  }

  requestDelete(list: SavedListSummary): void {
    this.pendingDelete.set(list);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const list = this.pendingDelete();
    if (!list) return;

    this.deletingId.set(list.id);
    this.pendingDelete.set(null);
    try {
      await this.savedListsService.deleteList(list.id);
      this.lists.update((current) => (current ?? []).filter((l) => l.id !== list.id));
    } catch {
      this.loadError.set('myLists.deleteError');
    } finally {
      this.deletingId.set(null);
    }
  }
}
