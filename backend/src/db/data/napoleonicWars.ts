import { ConflictSeed } from "../types";
import {
  austrianCustomFaction,
  britishCustomFaction,
  frenchCustomFaction,
  prussianCustomFaction,
  russianCustomFaction,
} from "./napoleonicWarsCustom";

// Guerras Napoleónicas (Black Powder). Las facciones oficiales son de momento solo
// andamiaje (nombre + escudo, sin comandantes ni unidades) a la espera de las tablas de
// referencia oficiales. España se ha retirado por ahora a petición del usuario. Además de
// las oficiales, se incluyen 5 facciones personalizadas (is_official:false) transcritas
// del documento aportado por el usuario, seleccionables mediante el checkbox "Incluir
// facciones personalizadas". Rusia solo existe como personalizada (no hay facción oficial
// de Rusia todavía) y de momento no tiene escudo propio.
export const napoleonicWars: ConflictSeed = {
  code: "napoleonic_wars",
  name_en: "Napoleonic Wars",
  name_es: "Guerras Napoleónicas",
  factions: [
    {
      code: "imperial_france",
      name_en: "Imperial France",
      name_es: "Francia Imperial",
      is_official: true,
      commanders: [],
      units: [],
    },
    {
      code: "great_britain",
      name_en: "Great Britain",
      name_es: "Gran Bretaña",
      is_official: true,
      commanders: [],
      units: [],
    },
    {
      code: "prussia",
      name_en: "Prussia",
      name_es: "Prusia",
      is_official: true,
      commanders: [],
      units: [],
    },
    {
      code: "portugal",
      name_en: "Portugal",
      name_es: "Portugal",
      is_official: true,
      commanders: [],
      units: [],
    },
    {
      code: "austria",
      name_en: "Austria",
      name_es: "Austria",
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
