import { db, initSchema } from "./client";
import { blackPowder } from "./data/blackPowder";
import { pikeAndShotte } from "./data/pikeAndShotte";
import { GameSeed } from "./types";

const GAMES: GameSeed[] = [pikeAndShotte, blackPowder];

function seed(): void {
  initSchema();

  // Borrado limpio para poder re-ejecutar el seed en desarrollo sin duplicar filas.
  db.exec(
    "DELETE FROM unit_options; DELETE FROM units; DELETE FROM commanders; DELETE FROM factions; DELETE FROM conflicts; DELETE FROM games;"
  );

  const insertGame = db.prepare(
    "INSERT INTO games (code, name_en, name_es) VALUES (@code, @name_en, @name_es)"
  );
  const insertConflict = db.prepare(
    "INSERT INTO conflicts (game_id, code, name_en, name_es) VALUES (@game_id, @code, @name_en, @name_es)"
  );
  const insertFaction = db.prepare(
    `INSERT INTO factions (conflict_id, code, name_en, name_es, is_official, owner_email)
     VALUES (@conflict_id, @code, @name_en, @name_es, @is_official, @owner_email)`
  );
  const insertCommander = db.prepare(
    `INSERT INTO commanders (faction_id, code, name_en, name_es, command_rating, points)
     VALUES (@faction_id, @code, @name_en, @name_es, @command_rating, @points)`
  );
  const insertUnit = db.prepare(
    `INSERT INTO units (
       faction_id, code, name_en, name_es, category, unit_type_en, unit_type_es, bases,
       armament_en, armament_es, hand_to_hand, shooting, morale, stamina,
       special_rules_en, special_rules_es, base_points, constraints_json
     ) VALUES (
       @faction_id, @code, @name_en, @name_es, @category, @unit_type_en, @unit_type_es, @bases,
       @armament_en, @armament_es, @hand_to_hand, @shooting, @morale, @stamina,
       @special_rules_en, @special_rules_es, @base_points, @constraints_json
     )`
  );
  const insertOption = db.prepare(
    `INSERT INTO unit_options (unit_id, code, description_en, description_es, point_delta, constraints_json)
     VALUES (@unit_id, @code, @description_en, @description_es, @point_delta, @constraints_json)`
  );

  const transaction = db.transaction(() => {
    for (const game of GAMES) {
      const gameId = insertGame.run({ code: game.code, name_en: game.name_en, name_es: game.name_es })
        .lastInsertRowid as number;

      for (const conflict of game.conflicts) {
        const conflictId = insertConflict.run({
          game_id: gameId,
          code: conflict.code,
          name_en: conflict.name_en,
          name_es: conflict.name_es,
        }).lastInsertRowid as number;

        for (const faction of conflict.factions) {
          const factionId = insertFaction.run({
            conflict_id: conflictId,
            code: faction.code,
            name_en: faction.name_en,
            name_es: faction.name_es,
            is_official: faction.is_official ? 1 : 0,
            owner_email: null,
          }).lastInsertRowid as number;

          for (const commander of faction.commanders) {
            insertCommander.run({
              faction_id: factionId,
              code: commander.code,
              name_en: commander.name_en,
              name_es: commander.name_es,
              command_rating: commander.command_rating,
              points: commander.points,
            });
          }

          for (const unit of faction.units) {
            const unitId = insertUnit.run({
              faction_id: factionId,
              code: unit.code,
              name_en: unit.name_en,
              name_es: unit.name_es,
              category: unit.stats.category,
              unit_type_en: unit.stats.unit_type_en,
              unit_type_es: unit.stats.unit_type_es,
              bases: unit.stats.bases,
              armament_en: unit.stats.armament_en,
              armament_es: unit.stats.armament_es,
              hand_to_hand: unit.stats.hand_to_hand,
              shooting: unit.stats.shooting,
              morale: unit.stats.morale,
              stamina: unit.stats.stamina,
              special_rules_en: unit.stats.special_rules_en,
              special_rules_es: unit.stats.special_rules_es,
              base_points: unit.base_points,
              constraints_json: unit.constraints ? JSON.stringify(unit.constraints) : null,
            }).lastInsertRowid as number;

            for (const option of unit.options ?? []) {
              insertOption.run({
                unit_id: unitId,
                code: option.code,
                description_en: option.description_en,
                description_es: option.description_es,
                point_delta: option.point_delta,
                constraints_json: option.constraints ? JSON.stringify(option.constraints) : null,
              });
            }
          }
        }
      }
    }
  });

  transaction();
  console.log("Seed completado.");
}

seed();
