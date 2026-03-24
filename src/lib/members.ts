export interface MemberInfo {
  name: string;
  email: string;
}

export const MEMBERS: MemberInfo[] = [
  { name: "Sinuhe Shin", email: "sinuheshin@gmail.com" },
  { name: "Pedro Djekic Costa", email: "" },
  { name: "Isadora Souza", email: "isadora.mendespsouza@gmail.com" },
  { name: "Louise Estorani", email: "" },
  { name: "Pedro Duarte", email: "" },
  { name: "Bob Muterle", email: "" },
  { name: "Rafael Tinti", email: "" },
  { name: "Sami", email: "" },
  { name: "Tomás", email: "" },
  { name: "Vinicius Duque", email: "" },
];

export const TOTAL_SPOTS = 8;

export function getMemberByEmail(email: string): MemberInfo | undefined {
  return MEMBERS.find(
    (m) => m.email && m.email.toLowerCase() === email.toLowerCase()
  );
}
