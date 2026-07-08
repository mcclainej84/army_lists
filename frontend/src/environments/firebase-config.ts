// Configuración del proyecto de Firebase (Authentication + Firestore) usado para poder
// guardar/cargar/editar listas. Se comparte entre environment.ts y environment.prod.ts
// para no tener el mismo valor duplicado en dos sitios.
//
// Estos valores NO son secretos: es la configuración pública del cliente de Firebase, la
// seguridad real la dan las reglas de Firestore (ver firestore.rules). Es seguro
// commitearlos y publicarlos tal cual en GitHub Pages.
//
// Nota: la inicialización real de Firebase (initializeApp) se hace una única vez en
// frontend/src/app/core/auth.service.ts, no aquí — este archivo solo exporta los datos de
// configuración para que ese servicio (y cualquier otro que lo necesite) los reutilice.
export const firebaseConfig = {
  apiKey: 'AIzaSyDppTpfrzaSwhq_G4g8Ilb86-wDS8c_Gw0',
  authDomain: 'army-list-generator.firebaseapp.com',
  projectId: 'army-list-generator',
  storageBucket: 'army-list-generator.firebasestorage.app',
  messagingSenderId: '419950751828',
  appId: '1:419950751828:web:67ed9537d00c6a2b047dc1',
};

// Mientras el usuario no haya rellenado su configuración real, no queremos que la app
// intente inicializar Firebase con valores inventados (fallaría de forma confusa y rompería
// el arranque). Se usa para mostrar "guardado no disponible todavía" en vez de un botón de
// inicio de sesión roto, y para que el resto de la app pueda navegar con normalidad.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('REPLACE_WITH_');
