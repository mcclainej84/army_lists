import { Battalia, ListCommanderEntry, ListUnitEntry } from '../features/faction-detail/list-builder.model';

// Forma de un documento en la coleccion "lists" de Firestore. Es una "foto" autocontenida
// de la lista en el momento de guardar (incluye copia completa de las unidades/comandantes
// del catalogo tal y como estaban entonces, no solo sus codigos): asi cargar una lista
// guardada no depende de que el catalogo no haya cambiado desde entonces, igual que ya pasa
// con el PDF exportado.
export interface SavedListDoc {
  ownerId: string;
  ownerEmail: string | null;
  name: string;
  gameCode: string;
  conflictCode: string;
  factionCode: string;
  factionName: string;
  pointsLimit: number;
  totalPoints: number;
  battalias: Battalia[];
  listCommanders: ListCommanderEntry[];
  listUnits: ListUnitEntry[];
  // Firestore Timestamp; se tipa como unknown aqui para no acoplar este modelo al SDK y se
  // convierte a Date en el servicio antes de exponerlo a los componentes.
  createdAt: unknown;
  updatedAt: unknown;
}

/** Datos que aporta el componente al guardar/actualizar; el servicio rellena ownerId/fechas. */
export type SavedListInput = Omit<SavedListDoc, 'ownerId' | 'ownerEmail' | 'createdAt' | 'updatedAt'>;

/** Fila resumida para el listado "Mis Listas" (no hace falta traer unidades/comandantes completos). */
export interface SavedListSummary {
  id: string;
  name: string;
  gameCode: string;
  conflictCode: string;
  factionCode: string;
  factionName: string;
  pointsLimit: number;
  totalPoints: number;
  updatedAt: Date | null;
}

/** Lista completa, ya lista para hidratar el estado de FactionDetail. */
export interface SavedListDetail extends SavedListSummary {
  battalias: Battalia[];
  listCommanders: ListCommanderEntry[];
  listUnits: ListUnitEntry[];
}
