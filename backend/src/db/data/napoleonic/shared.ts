import { CommanderSeed, FactionSeed, UnitOptionSeed } from "../../types";


// Facciones personalizadas de Guerras Napoleónicas (Black Powder), transcritas del
// "Manual del General" que subió el usuario (bpcustom.md). Se marcan is_official:false:
// ya no hay checkbox que las oculte (napoleonicWars.ts las incluye directamente), pero el
// flag sigue existiendo para mostrar la etiqueta "Reglas Personalizadas" en su tarjeta.
//
// Decisiones y omisiones deliberadas (a revisar si se quiere ampliar mas adelante):
// - El documento no da un numero de peanas por unidad (a diferencia de las tablas de
//   Pike & Shotte), asi que "bases" se deja sin especificar en vez de inventar un numero.
// - Cada unidad solo lleva las opciones universales "Pequeña"/"Grande" (-8/+8 puntos,
//   iguales en las 5 listas). El documento tambien incluye un catalogo mas amplio de
//   mejoras "solo infanteria/caballeria/artilleria" (Elite, Fiables, Tenaces...) y rasgos
//   de comandante (p.ej. "Inspirador" +10 en el ejercito frances) que NO se han modelado
//   todavia: son mejoras que aplican a categorias enteras de unidades, no a una unidad
//   concreta, y el esquema actual (UnitOptionSeed) solo engancha opciones por unidad. Se
//   podrian anadir mas adelante bien duplicando las opciones relevantes unidad a unidad,
//   bien con una pequeña extension del esquema para "opciones a nivel de ejercito".
// - Las unidades del ejercito britanico marcadas con "*" en el documento original no
//   tenian aclarado el significado del asterisco; se han transcrito igual, sin restriccion.
// - En la seccion prusiana el documento repite al final una lista de opciones que
//   menciona "artilleria real y KGL" (terminologia exclusivamente britanica) — se ha
//   descartado por ser casi con toda seguridad un error de copiado del bloque britanico,
//   no algo propio del ejercito prusiano/austriaco.

export const SIZE_OPTIONS: UnitOptionSeed[] = [
  { code: "small", description_en: "Small", description_es: "Pequeña", point_delta: -8 },
  { code: "large", description_en: "Large", description_es: "Grande", point_delta: 8 },
];


export function commandersUpTo(maxTier: 7 | 8 | 9): CommanderSeed[] {
  const tiers: { tier: 7 | 8 | 9; points: number }[] = [
    { tier: 7, points: 0 },
    { tier: 8, points: 25 },
    { tier: 9, points: 50 },
  ];
  return tiers
    .filter((t) => t.tier <= maxTier)
    .map((t) => ({
      code: `brigade_leader_vm${t.tier}`,
      // El Valor de Mando NO se repite en el nombre: ya se muestra por separado (campo
      // command_rating) tanto en el catalogo como en el PDF exportado. Repetirlo aqui
      // hacia que apareciera duplicado (p.ej. "Lider de Brigada (Valor de Mando 9) (Valor
      // de Mando: 9)" en la cabecera del PDF).
      name_en: "Brigade Leader",
      name_es: "Líder de Brigada",
      command_rating: t.tier,
      points: t.points,
      // Como mucho un lider por brigada/battalia, independientemente de la tarifa de
      // Valor de Mando elegida (los 3 niveles ocupan el mismo "puesto").
      role: "battalia_leader",
      // Sin dato explicito en el documento de si va a pie o a caballo: se asume a caballo
      // (48"), habitual para un lider de brigada napoleonico. Facil de cambiar a 36" si no
      // es correcto para alguna facción/rango en concreto.
      move_range: 48,
    }));
}


// ---------------------------------------------------------------------------
// Reglamentos "pendientes de enviar": el usuario quiere poder elegir, para algunas
// naciones de Black Powder, entre varios reglamentos distintos (Reglas Personalizadas /
// Clash of Eagles / Waterloo), no solo uno. Estas entradas son el hueco visible ya en el
// selector (Paso 4, tarjeta deshabilitada "Próximamente") para reglamentos que se van a
// rellenar mas adelante: se marcan available:false y sin comandantes/unidades todavia.
// - Waterloo: pendiente para las 4 naciones que combatieron alli (Gran Bretaña, Francia,
//   Prusia, Austria). Rusia no estuvo en Waterloo, así que no lleva esta variante.
// - Clash of Eagles: pendiente para Francia/Prusia/Austria (mismo libro que Rusia, ver
//   russianCustomFaction mas arriba); se ira sustituyendo available:true + comandantes/
//   unidades reales a medida que se revise cada ejercito con el usuario, un ejercito a la
//   vez (igual que se hizo con Rusia). Gran Bretaña no lleva esta variante: el libro no
//   incluye su ejercito (es el suplemento de la campaña de Rusia de 1812).
export function placeholderFaction(
  code: string,
  name_en: string,
  name_es: string,
  group_code: string,
  ruleset_name_en: string,
  ruleset_name_es: string
): FactionSeed {
  return {
    code,
    name_en,
    name_es,
    is_official: true,
    group_code,
    ruleset_name_en,
    ruleset_name_es,
    available: false,
    commanders: [],
    units: [],
  };
}

// ---------------------------------------------------------------------------
// Reglas nacionales opcionales ("Manual del General"), aplicadas por categoria de unidad
// tal y como las especifico el usuario. El esquema actual solo soporta opciones por
// unidad (no por categoria/ejercito entero ni por comandante), asi que se modelan
// añadiendo la misma opcion a cada unidad de la categoria correspondiente.
//
// Regla de exclusion aplicada de forma sistematica: si una unidad YA tiene de base
// exactamente la ventaja que la opcion ofrece (p.ej. ya es Elite de algun nivel, ya es
// Poco Fiable, o su Moral base ya es 5), no se le anade esa opcion - pagar puntos por algo
// que ya tienes gratis no tiene sentido. Fuera de esos casos se aplica tal cual la
// restriccion literal del documento (solo infanteria/caballeria/artilleria, o unidades
// nombradas explicitamente como excepcion).
//
// No se han modelado los rasgos de comandante (p.ej. "Inspirador" en Francia) ni el
// catalogo mas amplio de mejoras "a la carta" que no vinieron detalladas en este pedido:
// solo se an~aden las lineas que el usuario detallo explicitamente con su restriccion y
// coste.

export function opt(code: string, description_en: string, description_es: string, point_delta: number): UnitOptionSeed {
  return { code, description_en, description_es, point_delta };
}

export function addOption(units: FactionSeed["units"], codes: string[], option: UnitOptionSeed): void {
  for (const unit of units) {
    if (codes.includes(unit.code)) {
      unit.options = [...(unit.options ?? []), option];
    }
  }
}
