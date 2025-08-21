import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.item.createMany({
    data: [
      {
        name: "Leite integral",
        quantity: 2,
        category: "Laticínios",
        location: "Geladeira",
        expiryDate: new Date(Date.now() + 35 * 86400000),
      },
      {
        name: "Queijo muçarela",
        quantity: 1,
        category: "Laticínios",
        location: "Geladeira",
        expiryDate: new Date(Date.now() + 8 * 86400000),
      },
      {
        name: "Iogurte natural",
        quantity: 4,
        category: "Laticínios",
        location: "Geladeira",
        expiryDate: new Date(Date.now() - 2 * 86400000),
      },
    ],
  });
}
main().then(() => prisma.$disconnect());