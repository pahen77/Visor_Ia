import express from "express";
import cors from "cors";
import { router } from "./routes";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de saúde (debug)
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Rotas da API
app.use("/api", router);

// Porta do Railway
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => console.log("Listening on", PORT));
