import { addDays, isValid, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Aceita: YYYY-MM-DD, DD/MM/YYYY, e frases simples: "em 10 dias"
export function parseExpiry(input: string): Date {
  const s = (input || "").trim();
  if (!s) throw new Error("Data de validade vazia.");

  // tentar ISO
  try {
    const d1 = parseISO(s);
    if (isValid(d1)) return d1;
  } catch {
    // ignore
  }

  // tentar formato dd/MM/yyyy
  const d2 = parse(s, "dd/MM/yyyy", new Date(), { locale: ptBR });
  if (isValid(d2)) return d2;

  // tentar "em X dias"
  const m = s.match(/em\s+(\d{1,3})\s+dias?/i);
  if (m) return addDays(new Date(), Number(m[1]));

  throw new Error("Não foi possível interpretar a data de validade.");
}

export function daysLeft(dateOrIso: Date | string): number {
  const d = typeof dateOrIso === "string" ? parseISO(dateOrIso) : dateOrIso;
  const today = new Date();
  const ms =
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round(ms / 86400000);
}

export function statusByDaysLeft(
  days: number
): "verde" | "amarelo" | "vermelho" | "vencido" {
  if (days < 0) return "vencido";
  if (days <= 10) return "vermelho";
  if (days <= 30) return "amarelo";
  return "verde";
}