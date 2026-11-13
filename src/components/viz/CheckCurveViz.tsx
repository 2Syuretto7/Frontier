"use client";

import { useState } from "react";

// L(w) = mean over 4 examples of tanh(x.w)^2, w in R^3, checked along a fixed unit direction v
const X = [[0.5, -1.2, 0.3], [1.1, 0.4, -0.7], [-0.3, 0.8, 1.5], [0.9, -0.2, 0.6]];
const W0 = [0.4, -0.6, 0.8];
const V = [0.6, 0.0, -0.8];
const loss = (w: number[]) => X.reduce((s, x) => s + Math.tanh(x[0] * w[0] + x[1] * w[1] + x[2] * w[2]) ** 2, 0) / X.length;
const grad = (w: number[], bug: string) => {
  const g = [0, 0, 0];
  X.forEach((x) => {
    const t = Math.tanh(x[0] * w[0] + x[1] * w[1] + x[2] * w[2]);
    const d = bug === "chain" ? 2 * t : 2 * t * (1 - t * t);
    x.forEach((xi, i) => { g[i] += (d * xi) / (bug === "mean" ? 1 : X.length); });
  });
  return g;
};

/** Relative error of a directional gradient check as the step h shrinks, for a correct gradient and two bugs. */
export function CheckCurveViz() {
  const [bug, setBug] = useState<"none" | "mean" | "chain">("none");
  const g = grad(W0, bug);
  const gv = g[0] * V[0] + g[1] * V[1] + g[2] * V[2];
  const pts: [number, number][] = [];
  for (let e = -1; e >= -13; e -= 0.25) {
    const h = 10 ** e;
    const num = (loss(W0.map((w, i) => w + h * V[i])) - loss(W0.map((w, i) => w - h * V[i]))) / (2 * h);
    const r = Math.abs(gv - num) / Math.max(Math.abs(gv), Math.abs(num), 1e-300);
    pts.push([e, Math.log10(Math.max(r, 1e-16))]);
  }
  const Wd = 320, H = 180;
  const px = (e: number) => ((-1 - e) / 12) * (Wd - 40) + 34, py = (l: number) => 10 + ((0 - Math.min(0, l)) / 16) * (H - 30);
  const best = Math.min(...pts.map((p) => p[1]));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={bug === "none"} onClick={() => setBug("none")}>correct gradient</button>
        <button type="button" className="seg" aria-pressed={bug === "mean"} onClick={() => setBug("mean")}>forgot 1/N</button>
        <button type="button" className="seg" aria-pressed={bug === "chain"} onClick={() => setBug("chain")}>forgot tanh′</button>
      </div>
      <svg viewBox={`0 0 ${Wd} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error against step size, log scales">
        {[0, -4, -8, -12, -16].map((l) => (
          <g key={l}>
            <line x1={34} x2={Wd} y1={py(l)} y2={py(l)} stroke="var(--border)" />
            <text x={30} y={py(l) + 4} textAnchor="end" className="viz-label">1e{l}</text>
          </g>
        ))}
        {[-1, -5, -9, -13].map((e) => <text key={e} x={px(e)} y={H - 4} textAnchor="middle" className="viz-label">h=1e{e}</text>)}
        <polyline fill="none" stroke={bug === "none" ? "var(--accent)" : "var(--danger)"} strokeWidth={2} points={pts.map(([e, l]) => `${px(e)},${py(l)}`).join(" ")} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {bug === "none"
          ? `A correct gradient gives the V shape: truncation error falls like h² from the left, rounding error grows like 1/h on the right, and the bottom reaches about 1e${Math.round(best)}.`
          : bug === "mean"
            ? "Forgetting to divide by N = 4 makes the gradient 4 times too big: the relative error is stuck at 0.75 for every h. No step size can fix a wrong formula, and the flat level itself is a clue."
            : "Forgetting tanh's derivative gives an error of order 0.1 to 1 that also ignores h. A flat curve at a high level means a bug; a V means rounding."}
      </figcaption>
    </figure>
  );
}
