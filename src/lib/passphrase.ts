import { WORDS } from "./words.ts";

/** Normalise so the same passphrase typed on any device matches. */
export function normalisePassphrase(input: string): string {
  return input.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export type Strength = { ok: boolean; reason?: string };

export function checkStrength(input: string): Strength {
  const p = normalisePassphrase(input);
  const words = p.split(" ").filter(Boolean);
  if (words.length < 4) return { ok: false, reason: "Use at least four words." };
  if (p.length < 20) return { ok: false, reason: "Use at least 20 characters in total." };
  if (new Set(words).size < words.length - 1) return { ok: false, reason: "Avoid repeating words." };
  return { ok: true };
}

/** Six random words from a 512-word list: about 54 bits of entropy. */
export function suggestPassphrase(randomInt: (max: number) => number): string {
  return Array.from({ length: 6 }, () => WORDS[randomInt(WORDS.length)]).join(" ");
}
