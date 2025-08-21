import { Router } from "express";
import { prisma } from "./lib/prisma";

export const router = Router();

// Exemplo: listar itens (prova DB ok)
router.get("/items", async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

// Exemplo: criar item
router.post("/items", async (req, res) => {
  const { name, expiresAt } = req.body;
  const item = await prisma.item.create({
    data: { name, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  res.status(201).json(item);
});