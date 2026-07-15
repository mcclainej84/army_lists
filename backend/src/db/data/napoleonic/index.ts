// Barrel: re-exporta todas las facciones napoleonicas divididas por nacion (antes
// vivian todas juntas en napoleonicWarsCustom.ts, un unico fichero de 3145 lineas).
// napoleonicWars.ts importa de aqui exactamente los mismos nombres que antes, asi que
// no ha hecho falta tocar nada fuera de esta carpeta.
export * from "./british";
export * from "./french";
export * from "./prussian";
export * from "./austrian";
export * from "./russian";
