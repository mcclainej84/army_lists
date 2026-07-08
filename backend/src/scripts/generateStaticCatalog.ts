import * as fs from "fs";
import * as path from "path";
import { blackPowder } from "../db/data/blackPowder";
import { pikeAndShotte } from "../db/data/pikeAndShotte";
import { pikeAndShottePlain } from "../db/data/pikeAndShottePlain";
import { frenchIndianWar } from "../db/data/frenchIndianWar";
import { CommanderSeed, FactionSeed, FactionUnitSeed, GameSeed, UnitOptionSeed } from "../db/types";

// Genera el catálogo completo (juegos/conflictos/facciones/unidades) como archivos
// JSON estáticos, listos para servir desde GitHub Pages sin backend ni base de datos.
// Se ejecuta con: npm run build:static (dentro de backend/)
//
// No depende de SQLite ni de la API en vivo: lee directamente los datos semilla
// (los mismos que usa "npm run seed" para la base de datos) y produce la misma
// forma de respuesta (DTOs) que expone hoy la API Express, para que el frontend
// pueda consumirlos sin cambios de modelo.

type Locale = "en" | "es";
const LOCALES: Locale[] = ["en", "es"];
const GAMES: GameSeed[] = [pikeAndShotte, pikeAndShottePlain, blackPowder, frenchIndianWar];

const OUT_DIR = path.join(__dirname, "..", "..", "..", "frontend", "public", "data");

interface GameDTO {
  id: number;
  code: string;
  name: string;
}

interface ConflictDTO {
  id: number;
  code: string;
  name: string;
}

interface FactionSummaryDTO {
  id: number;
  code: string;
  name: string;
  isOfficial: boolean;
}

interface CommanderDTO {
  id: number;
  code: string;
  name: string;
  commandRating: number | null;
  points: number;
  role: string | null;
}

interface UnitOptionDTO {
  id: number;
  code: string;
  description: string;
  pointDelta: number;
  constraints: Record<string, unknown> | null;
}

interface UnitDTO {
  id: number;
  code: string;
  name: string;
  category: string;
  unitType: string | null;
  bases: number | null;
  armament: string | null;
  handToHand: string | null;
  shooting: string | null;
  morale: string | null;
  stamina: number | null;
  specialRules: string | null;
  basePoints: number;
  constraints: Record<string, unknown> | null;
  options: UnitOptionDTO[];
}

interface FactionDetailDTO extends FactionSummaryDTO {
  commanders: CommanderDTO[];
  units: UnitDTO[];
}

function writeJson(relPath: string, data: unknown): void {
  const fullPath = path.join(OUT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

function buildOptionDTO(idFactory: () => number, opt: UnitOptionSeed, locale: Locale): UnitOptionDTO {
  return {
    id: idFactory(),
    code: opt.code,
    description: locale === "en" ? opt.description_en : opt.description_es,
    pointDelta: opt.point_delta,
    constraints: opt.constraints ?? null,
  };
}

function buildUnitDTO(idFactory: () => number, unit: FactionUnitSeed, locale: Locale): UnitDTO {
  const s = unit.stats;
  return {
    id: idFactory(),
    code: unit.code,
    name: locale === "en" ? unit.name_en : unit.name_es,
    category: s.category,
    unitType: locale === "en" ? s.unit_type_en : s.unit_type_es,
    bases: s.bases ?? null,
    armament: locale === "en" ? s.armament_en : s.armament_es,
    handToHand: s.hand_to_hand,
    shooting: s.shooting,
    morale: s.morale,
    stamina: s.stamina,
    specialRules: locale === "en" ? s.special_rules_en : s.special_rules_es,
    basePoints: unit.base_points,
    constraints: unit.constraints ?? null,
    options: (unit.options ?? []).map((o) => buildOptionDTO(idFactory, o, locale)),
  };
}

function buildCommanderDTO(idFactory: () => number, commander: CommanderSeed, locale: Locale): CommanderDTO {
  return {
    id: idFactory(),
    code: commander.code,
    name: locale === "en" ? commander.name_en : commander.name_es,
    commandRating: commander.command_rating,
    points: commander.points,
    role: commander.role ?? null,
  };
}

function buildFactionSummaryDTO(idFactory: () => number, faction: FactionSeed, locale: Locale): FactionSummaryDTO {
  return {
    id: idFactory(),
    code: faction.code,
    name: locale === "en" ? faction.name_en : faction.name_es,
    isOfficial: faction.is_official,
  };
}

function generateForLocale(locale: Locale): void {
  // Contador reiniciado por idioma: como recorremos los mismos datos en el mismo
  // orden en cada pasada, el mismo elemento recibe el mismo id en "en" y en "es".
  let counter = 1;
  const idFactory = () => counter++;

  const gamesDTO: GameDTO[] = GAMES.map((g) => ({ id: idFactory(), code: g.code, name: locale === "en" ? g.name_en : g.name_es }));
  writeJson(`${locale}/games.json`, gamesDTO);

  for (const game of GAMES) {
    const conflictsDTO: ConflictDTO[] = game.conflicts.map((c) => ({
      id: idFactory(),
      code: c.code,
      name: locale === "en" ? c.name_en : c.name_es,
    }));
    writeJson(`${locale}/games/${game.code}/conflicts.json`, conflictsDTO);

    for (const conflict of game.conflicts) {
      const factionSummaries: FactionSummaryDTO[] = conflict.factions.map((f) => buildFactionSummaryDTO(idFactory, f, locale));
      writeJson(`${locale}/games/${game.code}/conflicts/${conflict.code}/factions.json`, factionSummaries);

      conflict.factions.forEach((faction, index) => {
        const detail: FactionDetailDTO = {
          ...factionSummaries[index],
          commanders: faction.commanders.map((c) => buildCommanderDTO(idFactory, c, locale)),
          units: faction.units.map((u) => buildUnitDTO(idFactory, u, locale)),
        };
        writeJson(`${locale}/games/${game.code}/conflicts/${conflict.code}/factions/${faction.code}.json`, detail);
      });
    }
  }
}

function main(): void {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  for (const locale of LOCALES) {
    generateForLocale(locale);
  }
  console.log(`Catálogo estático generado en ${OUT_DIR}`);
}

main();
