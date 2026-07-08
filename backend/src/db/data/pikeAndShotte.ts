import { GameSeed } from "../types";
import { thirtyYearsWar } from "./thirtyYearsWar";

// Todos los datos cargados hasta ahora (Imperio/Suecia/Francia/España en la Guerra de
// los 30 Años) son para la escala "Epic" de Pike & Shotte, distinta de la escala normal
// del juego (ver pikeAndShottePlain.ts, todavía sin contenido).
export const pikeAndShotte: GameSeed = {
  code: "epic_pike_and_shotte",
  name_en: "Epic Pike & Shotte",
  name_es: "Epic Pike & Shotte",
  conflicts: [thirtyYearsWar],
};
