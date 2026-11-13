"use client";

import { useState } from "react";

const sig = (z: number) => 1 / (1 + Math.exp(-z));
const ceG = (z: number) => Math.abs(sig(z) - 1);
const mseG = (z: number) => Math.abs(2 * (sig(z) - 1) * sig(z) * (1 - sig(z)));

/** Size of the gradient on the logit for a positive example, under cross-entropy and under squared error on the probability. */
export function CeVsMseViz() {
  const [z, setZ] = useState(-4);
  const W = 320, H = 170, lo = -8, hi = 6;
  const px = (v: number) => 34 + ((v - lo) / (hi - lo)) * (W - 44);
  const py = (g: number) => 12 + (1 - g) * (H - 40);
  const curve = (f: (v: number) => number) => {
    const pts: string[] = [];
    for (let v = lo; v <= hi + 1e-9; v += 0.1) pts.push(`${px(v).toFixed(1)},${py(f(v)).toFixed(1)}`);
    return pts.join(" ");
  };
  const p = sig(z);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          logit z = {z.toFixed(1)}
          <input type="range" min={lo} max={hi} step={0.1} value={z} onChange={(e) => setZ(Number(e.target.value))} aria-label="logit of the true class" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Gradient size against logit for two losses">
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line x1={34} x2={W - 10} y1={py(g)} y2={py(g)} stroke="var(--border)" />
            <text x={30} y={py(g) + 4} textAnchor="end" className="viz-label">{g}</text>
          </g>
        ))}
        {[-8, -4, 0, 4].map((v) => <text key={v} x={px(v)} y={H - 12} textAnchor="middle" className="viz-label">{v}</text>)}
        <text x={W - 10} y={H - 1} textAnchor="end" className="viz-label">z</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={curve(ceG)} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={curve(mseG)} />
        <line x1={px(z)} x2={px(z)} y1={10} y2={H - 26} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <circle cx={px(z)} cy={py(ceG(z))} r={4} fill="var(--accent)" />
        <circle cx={px(z)} cy={py(mseG(z))} r={4} fill="var(--danger)" />
        <text x={px(-7.6)} y={py(1) + 14} className="viz-label" style={{ fill: "var(--accent)" }}>cross-entropy</text>
        <text x={px(-7.6)} y={py(0.08) - 4} className="viz-label" style={{ fill: "var(--danger)" }}>squared error</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        p = {p.toFixed(3)}, |∂/∂z| cross-entropy {ceG(z).toFixed(3)}, squared error {mseG(z).toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The true label is 1 and p = σ(z). Cross-entropy gives the gradient p − 1, which is largest exactly when the model is
        confidently wrong (z very negative). Squared error on p multiplies by σ′(z) = p(1 − p), which is nearly 0 there, so a
        confidently wrong model barely learns.
      </figcaption>
    </figure>
  );
}
