import { GameSeed } from "../types";

// Todavia sin conflictos/ejercitos cargados: aparecera en el listado de juegos, pero de momento
// no lleva a ningun contenido (el frontend muestra "proximamente" cuando un juego no tiene conflictos).
export const blackPowder: GameSeed = {
  code: "black_powder",
  name_en: "Black Powder",
  name_es: "Black Powder",
  conflicts: [],
};
