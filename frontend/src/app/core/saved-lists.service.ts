import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AuthService } from './auth.service';
import { SavedListDetail, SavedListDoc, SavedListInput, SavedListSummary } from './saved-list.model';

const COLLECTION = 'lists';

// CRUD de listas guardadas contra Firestore. Todas las operaciones dan por hecho que hay
// un usuario autenticado (los componentes que llaman aqui ya comprueban
// authService.currentUser() antes); si no lo hay, se lanza un error en vez de fallar en
// silencio, para que quede claro que es un fallo de programacion, no un caso esperado.
//
// Seguridad real: las reglas de Firestore (ver firestore.rules en la raiz del repo) son
// las que de verdad impiden que un usuario lea o edite listas de otro, aunque alguien
// manipulase las llamadas desde el cliente. Este servicio solo filtra por comodidad/UX.
@Injectable({ providedIn: 'root' })
export class SavedListsService {
  private authService = inject(AuthService);

  private requireUid(): string {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) throw new Error('Hay que iniciar sesion para guardar o cargar listas.');
    return uid;
  }

  async saveList(input: SavedListInput): Promise<string> {
    const uid = this.requireUid();
    const user = this.authService.currentUser();
    const docData: Omit<SavedListDoc, 'createdAt' | 'updatedAt'> & { createdAt: unknown; updatedAt: unknown } = {
      ...input,
      ownerId: uid,
      ownerEmail: user?.email ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(this.authService.firestore, COLLECTION), docData);
    return ref.id;
  }

  async updateList(id: string, input: SavedListInput): Promise<void> {
    this.requireUid();
    const ref = doc(this.authService.firestore, COLLECTION, id);
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  }

  async deleteList(id: string): Promise<void> {
    this.requireUid();
    const ref = doc(this.authService.firestore, COLLECTION, id);
    await deleteDoc(ref);
  }

  async listMyLists(): Promise<SavedListSummary[]> {
    const uid = this.requireUid();
    // Solo "where" (sin "orderBy" sobre otro campo distinto): combinar ambos exigiria un
    // indice compuesto en Firestore que un proyecto nuevo no tiene creado todavia. Como el
    // numero de listas de un usuario es pequeño, se ordena aqui mismo en vez de en la
    // consulta.
    const q = query(collection(this.authService.firestore, COLLECTION), where('ownerId', '==', uid));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data() as SavedListDoc;
      return {
        id: docSnap.id,
        name: data.name,
        gameCode: data.gameCode,
        conflictCode: data.conflictCode,
        factionCode: data.factionCode,
        factionName: data.factionName,
        pointsLimit: data.pointsLimit,
        totalPoints: data.totalPoints,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
      };
    });
    results.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
    return results;
  }

  async getList(id: string): Promise<SavedListDetail | null> {
    this.requireUid();
    const ref = doc(this.authService.firestore, COLLECTION, id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as SavedListDoc;
    return {
      id: snapshot.id,
      name: data.name,
      gameCode: data.gameCode,
      conflictCode: data.conflictCode,
      factionCode: data.factionCode,
      factionName: data.factionName,
      pointsLimit: data.pointsLimit,
      totalPoints: data.totalPoints,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
      battalias: data.battalias,
      listCommanders: data.listCommanders,
      listUnits: data.listUnits,
    };
  }
}
