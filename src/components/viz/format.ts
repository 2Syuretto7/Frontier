/** Formats a number for a visualisation: integers plainly, others to at most four decimal places, with a true minus sign. */
export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "?";
  const s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
  return s.replace(/^-/, "−");
}

/** 10 to an integer power, written with superscript digits, for axis ticks. */
export function pow10(e: number): string {
  const sup: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return "10" + String(e).split("").map((c) => sup[c] ?? c).join("");
}
