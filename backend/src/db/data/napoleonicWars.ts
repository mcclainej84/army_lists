import { ConflictSeed } from "../types";
import {
  austrianClashOfEaglesFaction,
  austrianCustomFaction,
  austrianWaterlooFaction,
  britishCustomFaction,
  britishWaterlooFaction,
  frenchClashOfEaglesFaction,
  frenchCustomFaction,
  frenchWaterlooFaction,
  prussianClashOfEaglesFaction,
  prussianCustomFaction,
  prussianWaterlooFaction,
  russianCustomFaction,
} from "./napoleonicWarsCustom";

// Guerras Napoleónicas (Black Powder). Se ha quitado el checkbox "Incluir facciones
// personalizadas": cada nacion aparece una unica vez en el Paso 3 del selector (agrupada
// por group_code), y si tiene mas de un reglamento disponible (p.ej. Francia: Reglas
// Personalizadas / Clash of Eagles / Waterloo) el Paso 4 deja elegir cual usar - ver
// FactionSeed.group_code/ruleset_name_en/es en types.ts y home.ts/home.html para el
// selector. Portugal es la unica nacion sin ningun reglamento con contenido todavia, asi
// que se mantiene visible con su andamiaje vacio (a peticion del usuario) hasta que se
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
      group_code: "portugal",
      ruleset_name_en: "Official Rules",
      ruleset_name_es: "Reglamento Oficial",
      commanders: [],
      units: [],
    },
    britishCustomFaction,
    britishWaterlooFaction,
    frenchCustomFaction,
    frenchClashOfEaglesFaction,
    frenchWaterlooFaction,
    prussianCustomFaction,
    prussianClashOfEaglesFaction,
    prussianWaterlooFaction,
    austrianCustomFaction,
    austrianClashOfEaglesFaction,
    austrianWaterlooFaction,
    russianCustomFaction,
  ],
};
