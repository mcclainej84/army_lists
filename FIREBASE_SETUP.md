# Configurar Firebase (guardado de listas)

Esta rama (`feature/firebase-lists`) añade inicio de sesión con Google y guardado/carga/edición
de listas usando Firebase (Authentication + Firestore). El código ya está todo escrito, pero
hay una serie de pasos que solo se pueden hacer desde la consola de Firebase con tu propia
cuenta de Google — esto no lo puede hacer el asistente por ti.

La app sigue funcionando sin hacer nada de esto: se puede navegar y construir listas sin
iniciar sesión, solo que no se podrán guardar hasta que completes estos pasos.

## 1. Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
2. "Crear proyecto" (o "Add project"), dale un nombre (p.ej. `list-generator`).
3. Puedes desactivar Google Analytics si no lo quieres, no hace falta para esto.
4. Espera a que se cree el proyecto.

Es gratis (plan "Spark"): no pide tarjeta y el uso de una app pequeña como esta no se acerca
a los límites gratuitos.

## 2. Registrar una app web y copiar la configuración

1. Dentro del proyecto, ve al icono de engranaje ⚙️ → **Configuración del proyecto**.
2. En la pestaña **General**, baja hasta "Tus apps" → pulsa el icono `</>` (Web).
3. Dale un nombre (p.ej. `list-generator-web`). **No** hace falta marcar "Firebase Hosting" (seguimos usando GitHub Pages).
4. Al registrar la app te muestra un objeto `firebaseConfig` con `apiKey`, `authDomain`, `projectId`, etc. Cópialo.
5. Pégalo en `frontend/src/environments/firebase-config.ts`, sustituyendo los valores `REPLACE_WITH_...` por los tuyos.

Estos valores no son secretos (es la configuración pública del cliente), así que es normal y
seguro que queden commiteados en el repo.

## 3. Activar el inicio de sesión con Google

1. En el menú lateral: **Compilación → Authentication → Comenzar** (si es la primera vez).
2. Pestaña **Sign-in method** → **Añadir nuevo proveedor** → **Google** → actívalo → elige un correo de asistencia → **Guardar**.

No hace falta crear nada aparte en Google Cloud Console: Firebase provisiona el cliente OAuth de Google automáticamente al activar el proveedor.

3. Pestaña **Settings → Authorized domains**: `localhost` ya está por defecto (para probar en local). Añade también el dominio donde publiques la app en GitHub Pages, normalmente `tu-usuario.github.io`.

## 4. Activar Firestore (base de datos)

1. **Compilación → Firestore Database → Crear base de datos**.
2. Elige una región (la más cercana a donde esperes tener usuarios).
3. Modo de producción (no "modo de prueba"): la seguridad la dan las reglas del siguiente paso, no hace falta el modo de prueba abierto.

## 5. Pegar las reglas de seguridad

1. Dentro de Firestore Database → pestaña **Reglas**.
2. Sustituye el contenido por el de `firestore.rules` (raíz de este repo).
3. **Publicar**.

Estas reglas hacen que cada usuario solo pueda leer, editar o borrar sus propias listas
(comprobando que su `uid` coincide con el campo `ownerId` del documento), aunque alguien
manipulase las llamadas desde el navegador.

## 6. Instalar la nueva dependencia y probar en local

El entorno donde se generó este código no tenía acceso a internet para instalar paquetes, así
que falta este paso:

```bash
cd frontend
npm install
npm start
```

Abre `http://localhost:4200`, pulsa "Iniciar sesión" en la cabecera, comprueba que se abre el
popup de Google y que puedes construir y guardar una lista, verla en "Mis Listas", editarla y
borrarla. También puedes verificar los documentos directamente en Firebase Console → Firestore
Database → Datos, dentro de la colección `lists`.

## 7. Desplegar

El despliegue a GitHub Pages no cambia: sigue siendo un build estático (`ng build`) que se
publica tal cual. Firebase se usa directamente desde el navegador del usuario, no hace falta
ningún servidor propio ni configuración adicional de despliegue.

## Revertir si no convence

- `main` no se ha tocado: sigue en la versión 0.24, sin nada de Firebase. Hay además una
  etiqueta `v0.24` sobre ese mismo commit por si acaso.
- Todo este trabajo vive en la rama `feature/firebase-lists`. Para volver atrás sin más:
  ```bash
  git checkout main
  ```
- Si en algún momento quieres tirar la rama entera: `git branch -D feature/firebase-lists`.
- Si ya la habías fusionado a `main` y quieres deshacerlo: `git reset --hard v0.24` (ten en
  cuenta que esto descarta cualquier commit posterior a esa etiqueta).

## Ampliar más adelante

Añadir otros proveedores de login (GitHub, email/contraseña, etc.) sigue el mismo patrón:
activarlo en Authentication → Sign-in method, y añadir un método equivalente a
`signInWithGoogle()` en `frontend/src/app/core/auth.service.ts`.
