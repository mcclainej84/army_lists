import { Router } from "express";
import { catalogService, parseLocale } from "../services/catalogService";

export const catalogRouter = Router();

catalogRouter.get("/games", (req, res) => {
  const locale = parseLocale(req.query.lang);
  res.json(catalogService.listGames(locale));
});

catalogRouter.get("/games/:gameCode/conflicts", (req, res) => {
  const locale = parseLocale(req.query.lang);
  const result = catalogService.listConflicts(req.params.gameCode, locale);
  if (result === null) {
    res.status(404).json({ error: "Juego no encontrado" });
    return;
  }
  res.json(result);
});

catalogRouter.get("/games/:gameCode/conflicts/:conflictCode/factions", (req, res) => {
  const locale = parseLocale(req.query.lang);
  let official: boolean | undefined;
  if (req.query.official === "true") official = true;
  if (req.query.official === "false") official = false;

  const result = catalogService.listFactions(req.params.gameCode, req.params.conflictCode, locale, official);
  if (result === null) {
    res.status(404).json({ error: "Juego o conflicto no encontrado" });
    return;
  }
  res.json(result);
});

catalogRouter.get("/games/:gameCode/conflicts/:conflictCode/factions/:factionCode", (req, res) => {
  const locale = parseLocale(req.query.lang);
  const result = catalogService.getFactionDetail(
    req.params.gameCode,
    req.params.conflictCode,
    req.params.factionCode,
    locale
  );
  if (result === null) {
    res.status(404).json({ error: "Facción no encontrada" });
    return;
  }
  res.json(result);
});
