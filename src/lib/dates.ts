const TZ = "America/Sao_Paulo";

export function getSaoPauloNow(): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(str);
}

export function getCurrentWeekendKey(): string {
  const now = getSaoPauloNow();
  const day = now.getDay();

  const saturday = new Date(now);
  saturday.setHours(0, 0, 0, 0);

  if (day === 0) {
    saturday.setDate(now.getDate() - 1);
  } else if (day !== 6) {
    saturday.setDate(now.getDate() + (6 - day));
  }

  return formatDate(saturday);
}

export function getWeekendInfo(weekendKey: string) {
  const saturday = parseDate(weekendKey);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    weekendKey,
    saturdayLabel: formatDateBR(saturday),
    sundayLabel: formatDateBR(sunday),
  };
}

export function shiftWeekend(weekendKey: string, weeks: number): string {
  const d = parseDate(weekendKey);
  d.setDate(d.getDate() + weeks * 7);
  return formatDate(d);
}

function parseDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Month helpers for financeiro
export function getCurrentMonth(): string {
  const now = getSaoPauloNow();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonth(month: string, offset: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthBR(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
