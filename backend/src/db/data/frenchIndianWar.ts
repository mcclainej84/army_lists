import { CommanderSeed, ConflictSeed, FactionUnitSeed, GameSeed, UnitOptionSeed } from "../types";

// Guerra Franco-India (French Indian War), transcrita de la tabla de unidades que aporto
// el usuario. A diferencia de Pike & Shotte / Black Powder, aqui no hay mas que un unico
// conflicto (el propio "French Indian War" ya es el conflicto), asi que el frontend lo
// selecciona solo y no le pide al usuario que elija conflicto (ver home.ts: si un juego
// solo tiene un conflicto, se pasa directo a facciones).
//
// Tampoco existe el concepto de "varias battalias/brigadas": es una unica fuerza. El
// frontend crea automaticamente una unica battalia para este juego en concreto y las
// unidades anadidas caen ahi directas (ver faction-detail.ts, comprobacion por gameCode).
//
// Cada tamaño de unidad (Pequeña/Mediana/Grande) trae sus propias estadisticas de combate
// (no solo coste en puntos, a diferencia del selector Pequeña/Grande de Black Powder), asi
// que se modela con "stat_overrides" en la opcion de tamaño: el tamaño mas grande de cada
// unidad es el que llevan las estadisticas "base" (sin opcion marcada = Normal), y cada
// tamaño menor es una opcion con sus propias peanas/C.aC/Disparo/Aguante y su propio coste
// en puntos (como delta respecto al tamaño base).
//
// Inglesas y francesas comparten hoy la misma tabla de unidades, pero se generan con
// funciones independientes (no se comparte el mismo array) para poder diferenciarlas mas
// adelante sin tocar la otra facción.

function sizeOption(
  code: "small" | "medium",
  points: number,
  basePoints: number,
  bases: number,
  handToHand: string,
  shooting: string,
  stamina: number
): UnitOptionSeed {
  return {
    code,
    description_en: code === "small" ? "Small" : "Medium",
    description_es: code === "small" ? "Pequeña" : "Mediana",
    point_delta: points - basePoints,
    stat_overrides: { bases, hand_to_hand: handToHand, shooting, stamina },
  };
}

function buildUnits(): FactionUnitSeed[] {
  return [
    {
      code: "regular_infantry",
      name_en: "Regular Infantry",
      name_es: "Infantería Regular",
      stats: {
        category: "FOOT",
        unit_type_en: "Regular Infantry",
        unit_type_es: "Infantería regular",
        bases: 4,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "7",
        shooting: "4",
        morale: "4+",
        stamina: 4,
        special_rules_en: "First Fire, Reliable",
        special_rules_es: "Primer disparo, Fiable",
        move_range: 12,
      },
      base_points: 46,
      options: [sizeOption("small", 38, 46, 3, "5", "3", 3)],
    },
    {
      code: "light_infantry",
      name_en: "Light Infantry",
      name_es: "Infantería Ligera",
      stats: {
        category: "FOOT",
        unit_type_en: "Regular Infantry",
        unit_type_es: "Infantería regular",
        bases: 3,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "5",
        shooting: "3",
        morale: "4+",
        stamina: 3,
        special_rules_en: "First Fire, Reliable, Skirmishers",
        special_rules_es: "Primer disparo, Fiable, Hostigadores",
        move_range: 12,
      },
      base_points: 39,
      options: [sizeOption("small", 31, 39, 2, "3", "2", 2)],
    },
    {
      code: "elite_infantry",
      name_en: "Elite Infantry",
      name_es: "Infantería de Élite",
      stats: {
        category: "FOOT",
        unit_type_en: "Regular Infantry",
        unit_type_es: "Infantería regular",
        bases: 3,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "7",
        shooting: "3",
        morale: "3+",
        stamina: 3,
        special_rules_en: "First Fire, Reliable, Elite 3+",
        special_rules_es: "Primer disparo, Fiable, Élite 3+",
        move_range: 12,
      },
      base_points: 49,
      options: [sizeOption("small", 41, 49, 2, "5", "2", 2)],
    },
    {
      code: "militia",
      name_en: "Militia",
      name_es: "Milicia",
      stats: {
        category: "FOOT",
        unit_type_en: "Regular Infantry",
        unit_type_es: "Infantería regular",
        bases: 4,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "6",
        shooting: "3",
        morale: "4+",
        stamina: 3,
        special_rules_en: "",
        special_rules_es: "",
        move_range: 12,
      },
      base_points: 36,
      options: [
        sizeOption("medium", 28, 36, 3, "4", "2", 2),
        sizeOption("small", 18, 36, 2, "2", "1", 1),
      ],
    },
    {
      code: "settlers",
      name_en: "Settlers",
      name_es: "Colonos",
      stats: {
        category: "FOOT",
        unit_type_en: "Irregular Infantry",
        unit_type_es: "Infantería irregular",
        bases: 4,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "5",
        shooting: "2",
        morale: "5+",
        stamina: 3,
        special_rules_en: "Unreliable",
        special_rules_es: "Poco fiable",
        move_range: 12,
      },
      base_points: 26,
      options: [
        sizeOption("medium", 20, 26, 3, "3", "2", 2),
        sizeOption("small", 10, 26, 2, "1", "1", 1),
      ],
    },
    {
      code: "frontiersmen",
      name_en: "Frontiersmen",
      name_es: "Hombres de Frontera",
      stats: {
        category: "FOOT",
        unit_type_en: "Irregular Infantry",
        unit_type_es: "Infantería irregular",
        bases: 3,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "4",
        shooting: "3",
        morale: "4+",
        stamina: 3,
        special_rules_en: "Seasoned Marksmen, Ambush, Tenacious",
        special_rules_es: "Tirador curtido, Emboscada, Tenaces",
        move_range: 12,
      },
      base_points: 38,
      options: [sizeOption("small", 30, 38, 2, "2", "2", 2)],
    },
    {
      code: "indian_war_party",
      name_en: "Indian War Party",
      name_es: "Partida de Guerra India",
      stats: {
        category: "FOOT",
        unit_type_en: "Irregular Infantry",
        unit_type_es: "Infantería irregular",
        bases: 4,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "6",
        shooting: "2",
        morale: "4+",
        stamina: 3,
        special_rules_en: "Unclear Target, Hardened Fighter, Wild Charge (+2D), Ambush",
        special_rules_es: "Objetivo no claro, Combatiente aguerrido, Carga salvaje (+2D), Emboscada",
        move_range: 12,
      },
      base_points: 39,
      options: [
        sizeOption("medium", 33, 39, 3, "4", "2", 2),
        sizeOption("small", 23, 39, 2, "2", "1", 1),
      ],
    },
    {
      code: "regular_cavalry",
      name_en: "Regular Cavalry",
      name_es: "Caballería Regular",
      stats: {
        category: "HORSE",
        unit_type_en: "Regular Cavalry",
        unit_type_es: "Caballería regular",
        bases: 3,
        armament_en: "Swords",
        armament_es: "Espadas",
        hand_to_hand: "8",
        shooting: "–",
        morale: "4+",
        stamina: 3,
        special_rules_en: "",
        special_rules_es: "",
        move_range: 18,
      },
      base_points: 44,
      options: [],
    },
    {
      code: "mounted_militia",
      name_en: "Mounted Militia",
      name_es: "Milicia a Caballo",
      stats: {
        category: "HORSE",
        unit_type_en: "Irregular Cavalry",
        unit_type_es: "Caballería irregular",
        bases: 3,
        armament_en: "Smoothbore Musket",
        armament_es: "Mosquete de ánima lisa",
        weapon_range: 18,
        hand_to_hand: "6",
        shooting: "2",
        morale: "5+",
        stamina: 3,
        special_rules_en: "",
        special_rules_es: "",
        move_range: 18,
      },
      base_points: 36,
      options: [sizeOption("small", 28, 36, 2, "4", "1", 2)],
    },
    {
      code: "artillery",
      name_en: "Artillery",
      name_es: "Artillería",
      stats: {
        category: "ORDNANCE",
        unit_type_en: "Artillery",
        unit_type_es: "Artillería",
        bases: 1,
        armament_en: "Smoothbore Artillery",
        armament_es: "Artillería de ánima lisa",
        weapon_range: 48,
        hand_to_hand: "0 / 1 (limbered)",
        shooting: "3-2-1",
        morale: "4+",
        stamina: 2,
        special_rules_en: "",
        special_rules_es: "",
        move_range: 12,
      },
      base_points: 27,
      options: [],
    },
  ];
}

// Oficial generico (de momento sin datos propios en la tabla aportada): Valor de Mando 8,
// 0 puntos. Sirve para poder liderar la unica battalia/brigada del juego; se puede afinar
// mas adelante cuando haya estadisticas reales.
function buildOfficer(): CommanderSeed {
  return {
    code: "officer",
    name_en: "Officer",
    name_es: "Oficial",
    command_rating: 8,
    points: 0,
    role: "battalia_leader",
    // Sin dato explicito de si va a pie o a caballo en la tabla aportada: se asume a pie
    // (36") por ser habitual en este tipo de juego de escaramuzas. Facil de cambiar a 48"
    // si el reglamento dice lo contrario.
    move_range: 36,
  };
}

const frenchIndianWarConflict: ConflictSeed = {
  code: "french_indian_war",
  name_en: "French and Indian War (1754–1763)",
  name_es: "Guerra Franco-India (1754–1763)",
  factions: [
    {
      code: "fiw_british",
      name_en: "British",
      name_es: "Ingleses",
      is_official: true,
      commanders: [buildOfficer()],
      units: buildUnits(),
    },
    {
      code: "fiw_french",
      name_en: "French",
      name_es: "Franceses",
      is_official: true,
      commanders: [buildOfficer()],
      units: buildUnits(),
    },
  ],
};

export const frenchIndianWar: GameSeed = {
  code: "french_indian_war",
  name_en: "French Indian War",
  name_es: "Guerras Franco-Indias",
  conflicts: [frenchIndianWarConflict],
};
