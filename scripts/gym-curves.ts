/**
 * The Debugging gym's symptom charts are drawn from the buggy scripts' own output. This script runs each case's
 * program with the local python3, evaluates the calls its chart names, and writes the numbers to
 * src/content/gym/curves.json, so a chart always shows what the script really does.
 *
 *   node --import tsx scripts/gym-curves.ts
 *
 * The gym tests fail if the file is out of date, so run it after changing any case's program or chart.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CASES } from "../src/content/gym/index.ts";

import type { CurveSet } from "../src/content/gym/curves.ts";

export type { CurveSet };

const DRIVER = `
import json, sys, math
job = json.load(sys.stdin)
ns = {"__name__": "gym_curves"}
exec(compile(job["program"], "<case>", "exec"), ns)
memo = {}
def call(expr):
    if expr not in memo:
        memo[expr] = eval(expr, ns)
    return memo[expr]
clean = lambda v: float(v) if math.isfinite(float(v)) else None
out = {"series": [], "floor": None}
for s in job["series"]:
    h = call(s["call"])
    out["series"].append({"label": s["label"], "x": [int(v) for v in h["step"]], "y": [clean(v) for v in h[s["key"]]]})
if job.get("floor"):
    f = job["floor"]
    out["floor"] = {"label": f["label"], "value": float(call(f["call"])[f["key"]])}
print(json.dumps(out))
`;

export const CURVES_FILE = resolve(process.cwd(), "src/content/gym/curves.json");

/** Runs every case's program and returns its chart's numbers, rounded to four significant figures. */
export function computeCurves(): Record<string, CurveSet> {
  const out: Record<string, CurveSet> = {};
  for (const c of CASES) {
    const run = spawnSync("python3", ["-I", "-c", DRIVER], {
      input: JSON.stringify({ program: c.program, series: c.chart.series, floor: c.chart.floor ?? null }),
      encoding: "utf8",
      timeout: 120_000,
    });
    if (run.status !== 0) throw new Error(`${c.id}: ${run.stderr}`);
    const raw = JSON.parse(run.stdout) as CurveSet;
    const round = (v: number | null) => (v === null ? null : Number(v.toPrecision(4)));
    out[c.id] = {
      series: raw.series.map((s) => ({ ...s, y: s.y.map(round) })),
      floor: raw.floor ? { ...raw.floor, value: round(raw.floor.value)! } : null,
    };
  }
  return out;
}

export const serialiseCurves = (c: Record<string, CurveSet>) => `${JSON.stringify(c)}\n`;

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeFileSync(CURVES_FILE, serialiseCurves(computeCurves()));
  console.log(`Wrote ${CURVES_FILE}`);
}
