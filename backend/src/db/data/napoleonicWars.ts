import { ConflictSeed } from "../types";

// Guerras Napoleónicas (Black Powder). De momento solo el andamiaje: nombre de la
// facción + escudo, sin comandantes ni unidades todavía (a la espera de las tablas de
// referencia, igual que se hizo con Imperio/Suecia/Francia/España en 30YW).
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
      code: "spain",
      name_en: "Spain",
      name_es: "España",
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
  ],
};
