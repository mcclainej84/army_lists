// Configuración del proyecto de Firebase (Authentication + Firestore) usado para poder
// guardar/cargar/editar listas. Se comparte entre environment.ts y environment.prod.ts
// para no tener el mismo valor duplicado en dos sitios.
//
// PASO MANUAL REQUERIDO (no lo puede hacer el asistente por ti): crea un proyecto en
// https://console.firebase.google.com, habilita "Authentication" (proveedor Google) y
// "Firestore Database", registra una "app web" (icono </>) dentro del proyecto, y copia
// aquí los valores que te da la consola en "Configuración del proyecto" > "Tus apps".
// Instrucciones completas en FIREBASE_SETUP.md (raíz del repo).
//
// Estos valores NO son secretos: es la configuración pública del cliente de Firebase, la
// seguridad real la dan las reglas de Firestore (ver firestore.rules). Es seguro
// commitearlos y publicarlos tal cual en GitHub Pages.
export const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_PROJECT.firebaseapp.com',
  projectId: 'REPLACE_WITH_YOUR_PROJECT',
  storageBucket: 'REPLACE_WITH_YOUR_PROJECT.appspot.com',
  messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID',
};

// Mientras el usuario no haya rellenado su configuración real, no queremos que la app
// intente inicializar Firebase con valores inventados (fallaría de forma confusa y rompería
// el arranque). Se usa para mostrar "guardado no disponible todavía" en vez de un botón de
// inicio de sesión roto, y para que el resto de la app pueda navegar con normalidad.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('REPLACE_WITH_');
