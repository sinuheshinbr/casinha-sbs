import { getCurrentMonth } from "@/lib/dates";

export interface MemberInfo {
  name: string;
  email: string;
  permissions: string[];
  /** Mês (YYYY-MM) em que saiu: a partir dele não entra no rateio nem acessa o app. */
  leftAt?: string;
}

// Inclui quem já saiu (com `leftAt`), para os meses antigos e os nomes no histórico.
// Para saber quem mora na casa num mês, use getMembersForMonth.
export const MEMBERS: MemberInfo[] = [
  { name: "Sinuhe Shin", email: "sinuheshin@gmail.com", permissions: ["finance"] },
  { name: "Pedro Djekic Costa", email: "pedrodjekic@gmail.com", permissions: ["finance"] },
  { name: "Isadora Souza", email: "isadora.mendespsouza@gmail.com", permissions: [] },
  { name: "Louise Estorani", email: "estoranimendes@gmail.com", permissions: [] },
  { name: "Pedro Duarte", email: "pedrofnd@gmail.com", permissions: [] },
  { name: "Bob Muterle", email: "muterle@ifsp.edu.br", permissions: [] },
  { name: "Rafael Tinti", email: "rafaeltintiogalla@gmail.com", permissions: [] },
  { name: "Sami", email: "sami@electisp.com.br", permissions: [], leftAt: "2026-11" },
  { name: "Tomás", email: "tomkovensky@gmail.com", permissions: [] },
  { name: "Vinicius Duque", email: "vinduque@gmail.com", permissions: [], leftAt: "2026-11" },
];

export const TOTAL_SPOTS = 8;

export function getMembersForMonth(month: string): MemberInfo[] {
  return MEMBERS.filter((m) => !m.leftAt || month < m.leftAt);
}

/** Só moradores atuais: quem já saiu perde o acesso. */
export function getMemberByEmail(email: string): MemberInfo | undefined {
  return getMembersForMonth(getCurrentMonth()).find(
    (m) => m.email && m.email.toLowerCase() === email.toLowerCase()
  );
}

export function canEditFinance(name: string): boolean {
  return MEMBERS.find((m) => m.name === name)?.permissions.includes("finance") ?? false;
}
