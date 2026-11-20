"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 16, NF = 40, P = 0.05, TH = 0.4, TEST = 1500;
const ALPHAS = Array.from({ length: 13 }, (_, i) => i * 0.25);

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/**
 * Activations are sparse sums of 40 random unit feature directions in 16 dimensions, each active with probability 0.05 at a magnitude
 * uniform on [0.5, 1]. A feature counts as present when its readout u_i . h exceeds 0.4. The steering vector is the difference between
 * the mean activation of n inputs with feature 0 and n inputs without it. For each coefficient alpha, on test inputs without feature 0,
 * returns how often feature 0 is read as present (the steered behaviour) and how often the other 39 features are read correctly.
 */
export function steeringDose(n: number, seed = 21) {
  const r = rand(seed);
  const U = Array.from({ length: NF }, () => {
    const v = Array.from({ length: D }, () => gauss(r));
    const s = Math.hypot(...v);
    return v.map((x) => x / s);
  });
  const draw = (on: boolean) => {
    const c = U.map((_, i) => (i === 0 ? (on ? 0.5 + 0.5 * r() : 0) : r() < P ? 0.5 + 0.5 * r() : 0));
    const h = new Array(D).fill(0);
    c.forEach((ci, i) => { if (ci) for (let k = 0; k < D; k++) h[k] += ci * U[i][k]; });
    return { c, h };
  };
  const v = new Array(D).fill(0);
  for (let j = 0; j < n; j++) {
    const a = draw(true).h, b = draw(false).h;
    for (let k = 0; k < D; k++) v[k] += (a[k] - b[k]) / n;
  }
  const test = Array.from({ length: TEST }, () => draw(false));
  const pts = ALPHAS.map((al) => {
    let beh = 0, ok = 0;
    for (const { c, h } of test) {
      const s = h.map((x, k) => x + al * v[k]);
      const read = U.map((u) => u.reduce((t, x, k) => t + x * s[k], 0) > TH);
      if (read[0]) beh++;
      for (let i = 1; i < NF; i++) if (read[i] === c[i] > 0) ok++;
    }
    return { alpha: al, beh: beh / TEST, acc: ok / (TEST * (NF - 1)) };
  });
  return pts;
}

const NS = [4, 32, 512];

export function SteeringDoseViz() {
  const [n, setN] = useState(1);
  const pts = useMemo(() => steeringDose(NS[n]), [n]);
  const W = 330, H = 176, X0 = 34, PW = 284, Y0 = 10, PH = 128;
  const px = (a: number) => X0 + (a / 3) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const at = pts[6];
  const lines = [
    { key: "beh" as const, col: "var(--accent)", name: "steered behaviour" },
    { key: "acc" as const, col: "var(--text-muted)", name: "other features read correctly" },
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Examples of each kind used to estimate the steering vector">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>n = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Steered behaviour and collateral damage against steering coefficient">
        {[0, 0.5, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {lines.map((l) => (
          <g key={l.key}>
            <path d={pts.map((p, i) => `${i ? "L" : "M"}${px(p.alpha).toFixed(1)},${py(p[l.key]).toFixed(1)}`).join(" ")} fill="none" stroke={l.col} strokeWidth={1.8} />
            {pts.map((p, i) => <circle key={i} cx={px(p.alpha)} cy={py(p[l.key])} r={2.4} style={{ fill: l.col }} />)}
          </g>
        ))}
        {[0, 1, 2, 3].map((a) => <text key={a} x={px(a)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{a}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">coefficient; coloured: behaviour, grey: other features</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        coefficient {at.alpha}: behaviour {(100 * at.beh).toFixed(0)}%, other features {(100 * at.acc).toFixed(1)}% (unsteered {(100 * pts[0].acc).toFixed(1)}%)
      </div>
      <figcaption className="viz-caption">
        A simulated residual stream with 40 features in 16 dimensions. The steering vector is the difference of mean activations over n
        inputs with one feature and n without it. Larger coefficients switch the behaviour on more reliably but also shift the readouts of features whose
        directions overlap it. With few examples the vector is noisy, so more of it points along unrelated features and the damage
        arrives sooner.
      </figcaption>
    </figure>
  );
}
