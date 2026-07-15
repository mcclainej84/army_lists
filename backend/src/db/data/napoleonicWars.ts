import { ConflictSeed } from "../types";
import {
  austrianCustomFaction,
  britishCustomFaction,
  frenchCustomFaction,
  prussianCustomFaction,
  russianCustomFaction,
} from "./napoleonicWarsCustom";

// Guerras Napoleónicas (Black Powder). Se ha quitado el checkbox "Incluir facciones
// personalizadas": cada nacion aparece una unica vez en el selector, con reglas
// personalizadas (transcritas del documento que aporto el usuario) por ahora para todas.
// Cuando una nacion tenia tanto un andamiaje "oficial" vacio (sin comandantes ni unidades)
// como su version personalizada con reglas completas, se ha quitado el andamiaje vacio y se
// deja solo la version personalizada (evita tarjetas duplicadas que llevan a una lista sin
// nada que anadir). Portugal es la unica excepcion: todavia no tiene reglas personalizadas,
// asi que se mantiene visible con su andamiaje vacio (a peticion del usuario) hasta que se
// aporten esos datos. España se ha retirado por ahora a petición del usuario.
export const napoleonicWars: ConflictSeed = {
  code: "napoleonic_wars",
  name_en: "Napoleonic Wars (1803–1815)",
  name_es: "Guerras Napoleónicas (1803–1815)",
  factions: [
    {
      code: "portugal",
      name_en: "Portugal",
      name_es: "Portugal",
      is_official: true,
      commanders: [],
      units: [],
    },
    britishCustomFaction,
    frenchCustomFaction,
    prussianCustomFaction,
    austrianCustomFaction,
    russianCustomFaction,
  ],
};
