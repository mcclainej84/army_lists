import { createApp } from "./app";
import { initSchema } from "./db/client";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

initSchema();

const app = createApp();
app.listen(PORT, () => {
  console.log(`ListGenerator API escuchando en http://localhost:${PORT}`);
});
