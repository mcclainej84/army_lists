import cors from "cors";
import express, { Express } from "express";
import { catalogRouter } from "./routes/catalog.routes";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", catalogRouter);

  return app;
}
