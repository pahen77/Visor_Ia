import { PrismaClient } from "@prisma/client";
import { parseExpiry, daysLeft, statusByDaysLeft } from "../utils/date";

const prisma = new PrismaClient();

export type ItemDTO = {
  id: number;
  name: string;
  quantity: number;
  category?: string | null;
  location?: string | null;
  notes?: string | null;
  expiryDate: string;
  daysLeft: number;
  status: "verde" | "amarelo" | "vermelho" | "vencido";
  createdAt: string;
  updatedAt: string;
};

function toDTO(i: any): ItemDTO {
  const dleft = daysLeft(i.expiryDate);
  return {
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    category: i.category,
    location: i.location,
    notes: i.notes,
    expiryDate: i.expiryDate.toISOString(),
    daysLeft: dleft,
    status: statusByDaysLeft(dleft),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export async function listItems(opts: {
  q?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const { q, status, sort = "daysLeft", order = "asc" } = opts;
  const where: any = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  const items = await prisma.item.findMany({ where });
  let dtos = items.map(toDTO);
  if (status) dtos = dtos.filter((i) => i.status === status);
  const dir = order === "desc" ? -1 : 1;
  dtos.sort((a, b) =>
    sort === "name"
      ? dir * a.name.localeCompare(b.name)
      : sort === "expiryDate"
      ? dir * (new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      : dir * (a.daysLeft - b.daysLeft)
  );
  return dtos;
}

export async function createItem(data: any) {
  const expiryInput = data.expiry_input ?? data.expiryDate ?? data.expiry_date;
  const expiryDate = parseExpiry(String(expiryInput));
  const created = await prisma.item.create({
    data: {
      name: String(data.name || "").trim(),
      quantity: Number(data.quantity || 1),
      category: data.category ? String(data.category).trim() : null,
      location: data.location ? String(data.location).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      expiryDate,
    },
  });
  return toDTO(created);
}

export async function updateItem(id: number, data: any) {
  const patch: any = {};
  if (data.name !== undefined) patch.name = String(data.name).trim();
  if (data.quantity !== undefined) patch.quantity = Number(data.quantity);
  if (data.category !== undefined)
    patch.category = data.category ? String(data.category).trim() : null;
  if (data.location !== undefined)
    patch.location = data.location ? String(data.location).trim() : null;
  if (data.notes !== undefined)
    patch.notes = data.notes ? String(data.notes).trim() : null;
  const expIn = data.expiry_input ?? data.expiryDate ?? data.expiry_date;
  if (expIn) patch.expiryDate = parseExpiry(String(expIn));
  const updated = await prisma.item.update({ where: { id }, data: patch });
  return toDTO(updated);
}

export async function deleteItem(id: number) {
  await prisma.item.delete({ where: { id } });
  return { ok: true };
}