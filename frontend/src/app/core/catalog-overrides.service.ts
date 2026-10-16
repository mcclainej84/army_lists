import { Injectable, inject } from '@angular/core';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { FactionDetailDTO, Locale } from './models';

const COLLECTION = 'catalogOverrides';

// Cuanto esperar a Firestore antes de dar por bueno el catalogo estatico original: asi una
// red lenta o sin conexion nunca bloquea la pantalla de construccion de listas.
const READ_TIMEOUT_MS = 4000;

/**
 * Datos maestros editados desde la seccion "Datos" (ver features/data-editor). El catalogo
 * original son JSON estaticos generados en el despliegue; cuando alguien edita una faccion
 * se guarda aqui (Firestore) una copia COMPLETA de esa faccion y idioma, que sustituye al
 * JSON estatico al construir ejercitos nuevos. Las listas ya guardadas no cambian: llevan
 * dentro su propia copia de las unidades (ver SavedListDoc.listUnits).
 *
 * Documento por faccion e idioma: "{locale}__{game}__{conflict}__{faction}", con el
 * contenido serializado en un unico campo JSON ("payload") para no chocar con las
 * limitaciones de Firestore (arrays anidados, valores undefined...).
 */
@Injectable({ providedIn: 'root' })
export class CatalogOverridesService {
  private authService = inject(AuthService);

  get available(): boolean {
    return this.authService.isConfigured;
  }

  private docId(locale: Locale, gameCode: string, conflictCode: string, factionCode: string): string {
    return `${locale}__${gameCode}__${conflictCode}__${factionCode}`;
  }

  /** Version editada de una faccion, o null si no hay (o no se pudo leer a tiempo). */
  async getOverride(
    locale: Locale,
    gameCode: string,
    conflictCode: string,
    factionCode: string
  ): Promise<FactionDetailDTO | null> {
    if (!this.available) return null;
    try {
      const ref = doc(this.authService.firestore, COLLECTION, this.docId(locale, gameCode, conflictCode, factionCode));
      const snapshot = await Promise.race([
        getDoc(ref),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), READ_TIMEOUT_MS)),
      ]);
      if (!snapshot || !snapshot.exists()) return null;
      const payload = snapshot.data()['payload'];
      return typeof payload === 'string' ? (JSON.parse(payload) as FactionDetailDTO) : null;
    } catch {
      return null;
    }
  }

  async saveOverride(
    locale: Locale,
    gameCode: string,
    conflictCode: string,
    factionCode: string,
    detail: FactionDetailDTO
  ): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Hay que iniciar sesion para editar los datos maestros.');
    const ref = doc(this.authService.firestore, COLLECTION, this.docId(locale, gameCode, conflictCode, factionCode));
    await setDoc(ref, {
      payload: JSON.stringify(detail),
      updatedAt: serverTimestamp(),
      updatedBy: user.email ?? user.uid,
    });
  }

  /** Borra la version editada: la faccion vuelve a salir del catalogo original. */
  async deleteOverride(locale: Locale, gameCode: string, conflictCode: string, factionCode: string): Promise<void> {
    if (!this.authService.currentUser()) throw new Error('Hay que iniciar sesion para editar los datos maestros.');
    const ref = doc(this.authService.firestore, COLLECTION, this.docId(locale, gameCode, conflictCode, factionCode));
    await deleteDoc(ref);
  }
}
