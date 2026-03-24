export interface MemberInfo {
  name: string;
  email: string;
}

export const MEMBERS: MemberInfo[] = [
  { name: "Sinuhe Shin", email: "sinuheshin@gmail.com" },
  { name: "Pedro Djekic Costa", email: "" },
  { name: "Isadora Souza", email: "isadora.mendespsouza@gmail.com" },
  { name: "Louise Estorani", email: "estoranimendes@gmail.com" },
  { name: "Pedro Duarte", email: "" },
  { name: "Bob Muterle", email: "" },
  { name: "Rafael Tinti", email: "rafaeltintiogalla@gmail.com" },
  { name: "Sami", email: "" },
  { name: "Tomás", email: "tomkovensky@gmail.com" },
  { name: "Vinicius Duque", email: "vinduque@gmail.com" },
];

export const TOTAL_SPOTS = 8;

export function getMemberByEmail(email: string): MemberInfo | undefined {
  return MEMBERS.find(
    (m) => m.email && m.email.toLowerCase() === email.toLowerCase()
  );
}
