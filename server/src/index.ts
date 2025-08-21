import express, { Request, Response } from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env";
import { api } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api", api);

// serve static files from web
const webDir = path.resolve(__dirname, env.WEB_DIR);
app.use(express.static(webDir));

// fallback to index.html for SPA / PWA
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith("/api"))
    return res.status(404).json({ error: "Not found" });
  return res.sendFile(path.join(webDir, "index.html"));
});

const port = Number(process.env.PORT) || env.PORT;
app.listen(port, () => {
  console.log(`Visor v2 rodando em http://localhost:${port}`);
});