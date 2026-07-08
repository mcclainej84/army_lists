import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Selector unificado Juego -> Conflicto -> Facción, todo en una sola página.
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'juegos/:gameCode/conflictos/:conflictCode/facciones/:factionCode',
    loadComponent: () => import('./features/faction-detail/faction-detail').then((m) => m.FactionDetail),
  },
  {
    // Cualquier enlace antiguo de un paso intermedio vuelve al selector.
    path: '**',
    redirectTo: '',
  },
];
