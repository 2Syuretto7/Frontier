/** Formats a number for a visualisation: integers plainly, others to at most four decimal places, with a true minus sign. */
export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "?";
  const s = Number.isInteger(v) ? String(v) : String(Number(v.toFixed(4)));
  return s.replace(/^-/, "−");
}
