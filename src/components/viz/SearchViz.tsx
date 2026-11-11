"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeRng } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };
const COLS = 40;
/** Validation accuracy: depends strongly on the first setting and barely on the second. */
const score = (a: number, b: number) => 0.6 + 0.3 * Math.exp(-((a - 0.72) ** 2) / (2 * 0.05 ** 2)) - 0.02 * (b - 0.5) ** 2;
const GRID = [1 / 6, 1 / 2, 5 / 6].flatMap((a) => [1 / 6, 1 / 2, 5 / 6].map((b) => [a, b] as const));

/** Grid search against random search with the same budget of nine trials. */
export function SearchViz() {
  const [mode, setMode] = useState<"grid" | "random">("grid");
  const [seed, setSeed] = useState(1);
  const trials = useMemo(() => {
    if (mode === "grid") return GRID;
    const r = makeRng(seed * 7919);
    return Array.from({ length: 9 }, () => [r(), r()] as const);
  }, [mode, seed]);
  const { X, Y } = scales(V);
  const best = trials.reduce((m, [a, b]) => Math.max(m, score(a, b)), 0);
  const distinct = new Set(trials.map(([a]) => a.toFixed(4))).size;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Search method">
          <button type="button" className="seg" aria-pressed={mode === "grid"} onClick={() => setMode("grid")}>Grid, 3 × 3</button>
          <button type="button" className="seg" aria-pressed={mode === "random"} onClick={() => setMode("random")}>Random, 9 trials</button>
        </div>
        {mode === "random" && <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>Draw again</button>}
      </div>
      <div style={{ maxWidth: 380, margin: "12px auto 0" }}>
        <Chart v={V} label="Nine trials over two hyperparameters; shading shows validation accuracy" xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]} xlabel="learning rate (scaled)" ylabel="other setting">
          {Array.from({ length: COLS }, (_, i) => {
            const a = (i + 0.5) / COLS;
            return <rect key={i} x={X(i / COLS)} y={0} width={V.w / COLS + 0.5} height={V.h} style={{ fill: "var(--accent)", opacity: ((score(a, 0.5) - 0.6) / 0.3) * 0.45 }} />;
          })}
          {trials.map(([a, b], i) => (
            <g key={i}>
              <line x1={X(a)} x2={X(a)} y1={Y(b)} y2={V.h} className="plot-mirror" />
              <circle cx={X(a)} cy={Y(b)} r={5} className="plot-hot" />
            </g>
          ))}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{distinct}</b><span>different learning rates tried</span></div>
        <div className="ml-stat"><b>{(best * 100).toFixed(1)}%</b><span>best validation accuracy found</span></div>
        <div className="ml-stat"><b>90.0%</b><span>best possible</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dark band is where the learning rate is good; the other setting hardly matters.{" "}
        {mode === "grid"
          ? "The grid spends nine trials but tests only three learning rates, and none of them lands in the band."
          : `Random search tests nine different learning rates with the same budget, so it has far more chances to hit the band. ${best > 0.8 ? "This draw hit it." : "This draw missed it; most draws do better."}`}
      </figcaption>
    </figure>
  );
}
