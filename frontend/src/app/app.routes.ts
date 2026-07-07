import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/game-list/game-list').then((m) => m.GameList),
  },
  {
    path: 'juegos/:gameCode',
    loadComponent: () => import('./features/conflict-list/conflict-list').then((m) => m.ConflictList),
  },
  {
    path: 'juegos/:gameCode/conflictos/:conflictCode/facciones',
    loadComponent: () => import('./features/faction-list/faction-list').then((m) => m.FactionList),
  },
  {
    path: 'juegos/:gameCode/conflictos/:conflictCode/facciones/:factionCode',
    loadComponent: () => import('./features/faction-detail/faction-detail').then((m) => m.FactionDetail),
  },
];
