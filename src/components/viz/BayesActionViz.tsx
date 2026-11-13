"use client";

import { useState } from "react";

// predictive density: a mixture 0.7 Gamma(2, 1) + 0.3 N(6, 0.8^2), on a grid
const G = Array.from({ length: 401 }, (_, i) => (i * 10) / 400);
const DX = G[1] - G[0];
const RAW = G.map((x) => 0.7 * x * Math.exp(-x) + (0.3 / (0.8 * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - 6) * (x - 6)) / (2 * 0.64)));
const Z = RAW.reduce((a, b) => a + b, 0) * DX;
const PDF = RAW.map((v) => v / Z);

type Kind = "sq" | "abs" | "zo" | "pin";
const LOSSES: { k: Kind; label: string }[] = [
  { k: "sq", label: "squared" },
  { k: "abs", label: "absolute" },
  { k: "pin", label: "pinball 0.9" },
  { k: "zo", label: "0-1 (±0.25)" },
];

function loss(k: Kind, y: number, a: number) {
  const d = y - a;
  if (k === "sq") return d * d;
  if (k === "abs") return Math.abs(d);
  if (k === "pin") return Math.max(0.9 * d, -0.1 * d);
  return Math.abs(d) <= 0.25 ? 0 : 1;
}

/** One predictive distribution, four losses: the action with the smallest expected loss is the mean, median, a quantile or the mode. */
export function BayesActionViz() {
  const [k, setK] = useState<Kind>("sq");
  const acts = G.filter((_, i) => i % 4 === 0);
  const risk = acts.map((a) => PDF.reduce((s, p, i) => s + p * loss(k, G[i], a), 0) * DX);
  const bi = risk.indexOf(Math.min(...risk));
  const best = acts[bi];
  const W = 330, H = 120, H2 = 100;
  const X = (x: number) => 14 + (x / 10) * (W - 28);
  const pmax = Math.max(...PDF) * 1.1;
  const Y = (v: number) => H - 14 - (v / pmax) * (H - 24);
  const rmin = Math.min(...risk), rmax = Math.max(...risk);
  const RY = (v: number) => H2 - 14 - ((v - rmin) / (rmax - rmin || 1)) * (H2 - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {LOSSES.map((l) => (
          <button key={l.k} type="button" className="seg" aria-pressed={k === l.k} onClick={() => setK(l.k)}>{l.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Predictive density with the best action marked">
        <polygon points={[`${X(0)},${Y(0)}`, ...G.map((x, i) => `${X(x).toFixed(1)},${Y(PDF[i]).toFixed(1)}`), `${X(10)},${Y(0)}`].join(" ")} fill="var(--accent)" opacity={0.2} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={G.map((x, i) => `${X(x).toFixed(1)},${Y(PDF[i]).toFixed(1)}`).join(" ")} />
        <line x1={X(best)} x2={X(best)} y1={8} y2={Y(0)} stroke="var(--danger)" strokeWidth={1.6} />
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(0)} y={H - 2} className="viz-label">0</text>
        <text x={X(10)} y={H - 2} textAnchor="end" className="viz-label">10</text>
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Expected loss of each action">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={acts.map((a, i) => `${X(a).toFixed(1)},${RY(risk[i]).toFixed(1)}`).join(" ")} />
        <circle cx={X(best)} cy={RY(risk[bi])} r={4} fill="var(--danger)" />
        <text x={14} y={10} className="viz-label">expected loss of action a</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best action a* = {best.toFixed(2)}, expected loss {risk[bi].toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded curve is a model&apos;s predictive distribution for a quantity, with a main bump near 1 and a second near
        6. The lower curve is the expected loss of reporting each value a, and the vertical line marks its minimum.
        Squared loss picks the mean, pulled towards the second bump; absolute loss picks the median; the 0.9 pinball loss
        picks the 90th percentile; and a loss that only rewards landing within 0.25 picks the highest point of the density.
        Same beliefs, different losses, different answers.
      </figcaption>
    </figure>
  );
}
