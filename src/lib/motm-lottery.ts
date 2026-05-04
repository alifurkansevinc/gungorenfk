import { randomInt } from "node:crypto";

/** Fisher–Yates; `randomInt` ile üniform dağılım (çekiliş). */
export function shuffleUserIdsFair(userIds: string[]): string[] {
  const a = [...userIds];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}
