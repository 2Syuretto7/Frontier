import data from "./curves.json";

/** One case's symptom chart, as written by scripts/gym-curves.ts from the buggy script's own output. */
export type CurveSet = {
  series: { label: string; x: number[]; y: (number | null)[] }[];
  floor: { label: string; value: number } | null;
};

export const CURVES = data as Record<string, CurveSet>;
