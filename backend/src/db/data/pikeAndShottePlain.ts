import { GameSeed } from "../types";

// Pike & Shotte a escala "normal" (distinta de Epic, ver pikeAndShotte.ts): todavía sin
// conflictos/ejércitos cargados. Aparece en el listado de juegos, pero de momento no
// lleva a ningún contenido (el frontend muestra "próximamente" cuando un juego no tiene
// conflictos).
export const pikeAndShottePlain: GameSeed = {
  code: "pike_and_shotte",
  name_en: "Pike & Shotte",
  name_es: "Pike & Shotte",
  conflicts: [],
};
