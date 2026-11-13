"use client";

import { useState } from "react";

const K = 10;

/** Loss against the logit gap of the true class, with and without label smoothing. */
export function LabelSmoothViz() {
  const [eps, setEps] = useState(0.1);
  const W = 320, H = 170, gMax = 12, lMax = 2.5;
  const logZ = (g: number) => Math.log(Math.exp(g) + K - 1);
  const ce = (g: number) => -g + logZ(g);
  const qy = 1 - eps + eps / K;
  const ls = (g: number) => -qy * g + logZ(g);
  const px = (g: number) => 34 + (g / gMax) * (W - 44);
  const py = (l: number) => 12 + (1 - Math.min(l, lMax) / lMax) * (H - 40);
  const curve = (f: (g: number) => number) => {
    const pts: string[] = [];
    for (let g = 0; g <= gMax + 1e-9; g += 0.1) pts.push(`${px(g).toFixed(1)},${py(f(g)).toFixed(1)}`);
    return pts.join(" ");
  };
  const gStar = eps > 0 ? Math.log(qy / (eps / K)) : Infinity;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ε = {eps.toFixed(2)}
          <input type="range" min={0} max={0.5} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} aria-label="smoothing epsilon" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Loss against logit gap for plain and smoothed targets">
        {[0, 1, 2].map((l) => (
          <g key={l}>
            <line x1={34} x2={W - 10} y1={py(l)} y2={py(l)} stroke="var(--border)" />
            <text x={30} y={py(l) + 4} textAnchor="end" className="viz-label">{l}</text>
          </g>
        ))}
        {[0, 4, 8, 12].map((g) => <text key={g} x={px(g)} y={H - 12} textAnchor="middle" className="viz-label">{g}</text>)}
        <text x={W - 10} y={H - 1} textAnchor="end" className="viz-label">logit gap</text>
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} points={curve(ce)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(ls)} />
        {gStar <= gMax && (
          <>
            <line x1={px(gStar)} x2={px(gStar)} y1={10} y2={H - 26} stroke="var(--accent)" strokeDasharray="3 3" />
            <circle cx={px(gStar)} cy={py(ls(gStar))} r={4} fill="var(--accent)" />
          </>
        )}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        K = {K}, target for the true class {qy.toFixed(3)}, best gap {Number.isFinite(gStar) ? gStar.toFixed(2) : "∞"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The true class's logit is the gap above nine others at 0. Plain cross-entropy (grey) keeps falling as the gap grows,
        so training pushes logits up without limit. With smoothing (blue) the loss has a minimum at the gap log((1 − ε +
        ε/K)/(ε/K)); beyond it, a more confident model is penalised.
      </figcaption>
    </figure>
  );
}
