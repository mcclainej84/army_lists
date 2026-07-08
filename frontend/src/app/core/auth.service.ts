import { Injectable, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

// Autenticacion con Firebase (solo Google por ahora; se puede ampliar a otros proveedores
// mas adelante con el mismo patron). Se usa el SDK modular de Firebase directamente (sin
// @angular/fire) para mantener las dependencias al minimo.
//
// La app tiene que poder navegarse SIN iniciar sesion (ver visto en faccion-detail / mis
// listas: el catalogo y la construccion de listas en memoria funcionan igual, solo
// guardar/cargar de Firestore requiere estar autenticado). Por eso este servicio expone
// "isConfigured" (Firebase no configurado todavia -> no se intenta inicializar nada) y
// "authReady" (para no mostrar el boton de login parpadeando mientras Firebase comprueba
// si ya habia una sesion abierta).
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isConfigured = environment.isFirebaseConfigured;

  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestoreInstance: Firestore | null = null;

  /** null = sin iniciar sesion (o Firebase sin configurar). */
  readonly currentUser = signal<User | null>(null);
  /** Se pone a true en cuanto Firebase confirma el estado inicial de sesion (o de inmediato si no hay Firebase configurado). */
  readonly authReady = signal<boolean>(false);

  constructor() {
    if (!this.isConfigured) {
      // Sin configuracion todavia: no navegamos ni pintamos como "cargando sesion", se
      // trata como si nunca hubiera sesion. El resto de la app sigue funcionando.
      this.authReady.set(true);
      return;
    }
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestoreInstance = getFirestore(this.app);
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.currentUser.set(user);
      this.authReady.set(true);
    });
  }

  /** Instancia de Firestore para que otros servicios (p.ej. SavedListsService) la reutilicen. */
  get firestore(): Firestore {
    if (!this.firestoreInstance) {
      throw new Error('Firebase no esta configurado (rellena src/environments/firebase-config.ts).');
    }
    return this.firestoreInstance;
  }

  async signInWithGoogle(): Promise<void> {
    if (!this.auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOutUser(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
  }
}
