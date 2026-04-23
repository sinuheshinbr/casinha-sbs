/* eslint-disable @typescript-eslint/no-explicit-any */
export function capitalize<T extends string | null | undefined>(
  s: T,
): T extends string ? string : null {
  if (!s) return null as any;

  const lower = new Set(["e", "da", "das", "de", "do", "dos", "em", "na", "nas", "no", "nos"]);

  return s
    .split(" ")
    .map((w) => w.toLowerCase())
    .map((w, i) => {
      if (!w[0]) return w;
      if (i > 0 && lower.has(w)) return w;
      return `${w[0].toUpperCase()}${w.substring(1)}`;
    })
    .join(" ") as any;
}
