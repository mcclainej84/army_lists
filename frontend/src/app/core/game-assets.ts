// Rutas de los logos/escudos ilustrados del catálogo, por código de juego/facción.
// Vivían como const privadas dentro de home.ts; se extraen aquí porque "Mis Listas"
// también necesita el logo del juego (para identificar de un vistazo a qué juego
// pertenece cada lista guardada) y duplicarlas habría desincronizado las dos copias.

export const GAME_LOGOS: Record<string, string> = {
  epic_pike_and_shotte: 'img/EpicPSlogo.png',
  black_powder: 'img/BPlogo.png',
  french_indian_war: 'img/FIWLogo.png',
};

// Nota: las claves son codigos de faccion. Como distintos conflictos pueden tener
// facciones con nombres parecidos, los codigos de las napoleonicas usan sufijo propio
// (french_custom, no "french") para no chocar con los de Guerra de los 30 Años.
export const FACTION_ICONS: Record<string, string> = {
  imperial: 'img/factions/imperial.png',
  swedish: 'img/factions/swedish.png',
  french: 'img/factions/french.png',
  spanish: 'img/factions/spanish.png',
  portugal: 'img/factions/nap-portugal.png',
  // Facciones personalizadas de Black Powder Napoleonicas.
  british_custom: 'img/factions/nap-great-britain.png',
  french_custom: 'img/factions/nap-imperial-france.png',
  prussian_custom: 'img/factions/nap-prussia.png',
  austrian_custom: 'img/factions/nap-austria.png',
  russian_custom: 'img/factions/nap-russia.png',
  // French Indian War: codigos con prefijo propio para no chocar con los "french"/"british"
  // de otros conflictos.
  fiw_british: 'img/factions/fiw-british.png',
  fiw_french: 'img/factions/fiw-french.png',
};
