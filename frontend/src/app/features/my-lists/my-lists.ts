import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth.service';
import { SavedListSummary } from '../../core/saved-list.model';
import { SavedListsService } from '../../core/saved-lists.service';

// Pagina "Mis Listas": solo tiene sentido con sesion iniciada (las listas viven en
// Firestore, ligadas al usuario), pero la ruta en si es visible sin iniciar sesion (se
// puede navegar sin registrarse por toda la app) y simplemente muestra una invitacion a
// iniciar sesion en vez de la tabla.
@Component({
  selector: 'app-my-lists',
  imports: [DatePipe, RouterLink, TranslocoModule],
  templateUrl: './my-lists.html',
  styleUrl: './my-lists.scss',
})
export class MyLists {
  authService = inject(AuthService);
  private savedListsService = inject(SavedListsService);
  private transloco = inject(TranslocoService);

  lists = signal<SavedListSummary[] | null>(null);
  loadError = signal('');
  deletingId = signal<string | null>(null);
  private lastLoadedUid: string | null = null;

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
      .catch(() => this.loadError.set('myLists.loadError'));
  }

  routeFor(list: SavedListSummary): unknown[] {
    return ['/juegos', list.gameCode, 'conflictos', list.conflictCode, 'facciones', list.factionCode];
  }

  async deleteList(list: SavedListSummary): Promise<void> {
    const confirmMsg = this.transloco.translate('myLists.confirmDelete', { name: list.name });
    if (!confirm(confirmMsg)) return;

    this.deletingId.set(list.id);
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
