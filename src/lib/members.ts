export interface MemberInfo {
  name: string;
  email: string;
  permissions: string[];
}

export const MEMBERS: MemberInfo[] = [
  { name: "Sinuhe Shin", email: "sinuheshin@gmail.com", permissions: ["finance"] },
  { name: "Pedro Djekic Costa", email: "pedrodjekic@gmail.com", permissions: ["finance"] },
  { name: "Isadora Souza", email: "isadora.mendespsouza@gmail.com", permissions: [] },
  { name: "Louise Estorani", email: "estoranimendes@gmail.com", permissions: [] },
  { name: "Pedro Duarte", email: "pedrofnd@gmail.com", permissions: [] },
  { name: "Bob Muterle", email: "", permissions: [] },
  { name: "Rafael Tinti", email: "rafaeltintiogalla@gmail.com", permissions: [] },
  { name: "Sami", email: "sami@electisp.com.br", permissions: [] },
  { name: "Tomás", email: "tomkovensky@gmail.com", permissions: [] },
  { name: "Vinicius Duque", email: "vinduque@gmail.com", permissions: [] },
];

export const TOTAL_SPOTS = 8;

export function getMemberByEmail(email: string): MemberInfo | undefined {
  return MEMBERS.find(
    (m) => m.email && m.email.toLowerCase() === email.toLowerCase()
  );
}

export function canEditFinance(name: string): boolean {
  return MEMBERS.find((m) => m.name === name)?.permissions.includes("finance") ?? false;
}
