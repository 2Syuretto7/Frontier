"use client";

import { useState } from "react";

const phi = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
type G = { g: (x: number) => number; dg: (x: number) => number; ylo: number; yhi: number; label: string };
const MAPS: Record<string, G> = {
  "exp(x)": { g: Math.exp, dg: Math.exp, ylo: 0, yhi: 8, label: "log-normal" },
  "sigmoid(x)": { g: (x) => 1 / (1 + Math.exp(-x)), dg: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, ylo: 0, yhi: 1, label: "logit-normal" },
  "x³": { g: (x) => x * x * x, dg: (x) => 3 * x * x, ylo: -8, yhi: 8, label: "cube of a normal" },
};

/** Y = g(X) for X standard normal: a thin strip of x maps to a strip of y holding the same probability, so f_Y = f_X / |g′|. */
export function ChangeOfVarViz() {
  const [name, setName] = useState("exp(x)");
  const [k, setK] = useState(60);
  const m = MAPS[name];
  const x0 = -3 + (k / 100) * 5, dx = 0.12;
  const W = 320, H = 210;
  const L = 70, B = 60;
  const X = (x: number) => L + ((x + 3) / 5) * (W - L - 10);
  const Y = (y: number) => H - B - ((Math.min(m.yhi, Math.max(m.ylo, y)) - m.ylo) / (m.yhi - m.ylo)) * (H - B - 10);
  const curve = Array.from({ length: 201 }, (_, i) => -3 + (5 * i) / 200).map((x) => `${X(x).toFixed(1)},${Y(m.g(x)).toFixed(1)}`).join(" ");
  const fx = Array.from({ length: 201 }, (_, i) => -3 + (5 * i) / 200).map((x) => `${X(x).toFixed(1)},${(H - 8 - phi(x) * 110).toFixed(1)}`).join(" ");
  // density of Y drawn sideways on the left: f_Y(y) = φ(g⁻¹(y)) / g′(g⁻¹(y)), parameterised by x
  const fy = Array.from({ length: 401 }, (_, i) => -3 + (5 * i) / 400)
    .map((x) => ({ y: m.g(x), d: phi(x) / m.dg(x) }))
    .filter((p) => p.y >= m.ylo && p.y <= m.yhi && Number.isFinite(p.d))
    .map((p) => `${(L - 4 - Math.min(60, p.d * 40 * (m.yhi - m.ylo) / 8)).toFixed(1)},${Y(p.y).toFixed(1)}`)
    .join(" ");
  const ya = m.g(x0), yb = m.g(x0 + dx);
  const prob = phi(x0 + dx / 2) * dx;
  const fY = phi(x0) / m.dg(x0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {Object.keys(MAPS).map((n) => (
          <button key={n} type="button" className="seg" aria-pressed={name === n} onClick={() => setName(n)}>Y = {n}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A transformation mapping a strip of x to a strip of y">
        <line x1={L} x2={W - 10} y1={H - B} y2={H - B} stroke="var(--border)" />
        <line x1={L} x2={L} y1={10} y2={H - B} stroke="var(--border)" />
        <rect x={X(x0)} y={10} width={X(x0 + dx) - X(x0)} height={H - B - 10} fill="var(--danger)" opacity={0.15} />
        <rect x={L} y={Math.min(Y(ya), Y(yb))} width={W - L - 10} height={Math.max(1, Math.abs(Y(yb) - Y(ya)))} fill="var(--danger)" opacity={0.15} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={fx} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} points={fy} />
        <text x={W - 12} y={H - 10} textAnchor="end" className="viz-label">density of X</text>
        <text x={4} y={20} className="viz-label">density</text>
        <text x={4} y={32} className="viz-label">of Y</text>
      </svg>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          x = {x0.toFixed(2)}
          <input type="range" min={0} max={97} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="position of the strip" style={{ width: 150 }} />
        </label>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        strip probability ≈ {prob.toFixed(4)}; f_X(x) = {phi(x0).toFixed(4)}, g′(x) = {m.dg(x0).toFixed(4)}, f_Y(g(x)) = {fY.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        X is standard normal and Y = g(X) is the {m.label} variable. The vertical strip of x and the horizontal strip of y
        contain the same probability. Where g is steep the y-strip is wide, so the same probability is spread thinner and
        f_Y is smaller; where g is flat it piles up. That is the change-of-variables rule f_Y(y) = f_X(x)/|g′(x)| with y =
        g(x).
      </figcaption>
    </figure>
  );
}
