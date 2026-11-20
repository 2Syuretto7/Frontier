"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const DIN = 16, BATCH = 6, STEPS = 1, BASE = 64, LR = 0.003;
const WIDTHS = [64, 128, 256, 512, 1024];

type Param = "SP" | "muP";

/** Train a 2-hidden-layer ReLU MLP with Adam for a few steps; return RMS change of hidden pre-activations and output on a probe input. */
export function coordCheck(n: number, param: Param) {
  const r = rand(100 + n);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const m = n / BASE;
  const W1 = Array.from({ length: n * DIN }, () => normal() / Math.sqrt(DIN));
  const W2 = Array.from({ length: n * n }, () => normal() / Math.sqrt(n));
  const W3 = Array.from({ length: n }, () => normal() * (param === "muP" ? 1 / (Math.sqrt(n) * Math.sqrt(m)) : 1 / Math.sqrt(n)));
  const lrs = param === "muP" ? [LR, LR / m, LR / m] : [LR, LR, LR];
  const X = Array.from({ length: BATCH }, () => Array.from({ length: DIN }, normal));
  const Y = X.map((x) => Math.sin(x[0]) + 0.5 * x[1]);
  const probes = Array.from({ length: 16 }, () => Array.from({ length: DIN }, normal));
  const forward = (x: number[]) => {
    const h1 = new Float64Array(n), a1 = new Float64Array(n), h2 = new Float64Array(n), a2 = new Float64Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < DIN; j++) s += W1[i * DIN + j] * x[j]; h1[i] = s; a1[i] = Math.max(0, s); }
    for (let i = 0; i < n; i++) { let s = 0; const o = i * n; for (let j = 0; j < n; j++) s += W2[o + j] * a1[j]; h2[i] = s; a2[i] = Math.max(0, s); }
    let y = 0; for (let j = 0; j < n; j++) y += W3[j] * a2[j];
    return { h1, a1, h2, a2, y };
  };
  const p0 = probes.map(forward);
  const Ws = [W1, W2, W3];
  const M1 = Ws.map((w) => new Float64Array(w.length)), V1 = Ws.map((w) => new Float64Array(w.length));
  for (let t = 1; t <= STEPS; t++) {
    const G = Ws.map((w) => new Float64Array(w.length));
    for (let b = 0; b < BATCH; b++) {
      const f = forward(X[b]);
      const dy = (f.y - Y[b]) / BATCH;
      const da2 = new Float64Array(n), dh2 = new Float64Array(n), da1 = new Float64Array(n);
      for (let j = 0; j < n; j++) { G[2][j] += dy * f.a2[j]; da2[j] = dy * W3[j]; dh2[j] = f.h2[j] > 0 ? da2[j] : 0; }
      for (let i = 0; i < n; i++) { if (dh2[i] === 0) continue; const o = i * n; for (let j = 0; j < n; j++) { G[1][o + j] += dh2[i] * f.a1[j]; da1[j] += dh2[i] * W2[o + j]; } }
      for (let i = 0; i < n; i++) { if (f.h1[i] <= 0) continue; for (let j = 0; j < DIN; j++) G[0][i * DIN + j] += da1[i] * X[b][j]; }
    }
    for (let k = 0; k < 3; k++) {
      const w = Ws[k], g = G[k], mm = M1[k], vv = V1[k];
      for (let i = 0; i < w.length; i++) {
        mm[i] = 0.9 * mm[i] + 0.1 * g[i];
        vv[i] = 0.999 * vv[i] + 0.001 * g[i] * g[i];
        const mh = mm[i] / (1 - Math.pow(0.9, t)), vh = vv[i] / (1 - Math.pow(0.999, t));
        w[i] -= lrs[k] * mh / (Math.sqrt(vh) + 1e-12);
      }
    }
  }
  const p1 = probes.map(forward);
  let dh = 0, dy = 0;
  p1.forEach((f, k) => {
    for (let i = 0; i < n; i++) dh += (f.h2[i] - p0[k].h2[i]) ** 2;
    dy += (f.y - p0[k].y) ** 2;
  });
  return { hidden: Math.sqrt(dh / (n * probes.length)), output: Math.sqrt(dy / probes.length) };
}

export function CoordCheckViz() {
  const [param, setParam] = useState<Param>("SP");
  const res = useMemo(() => ({ SP: WIDTHS.map((n) => coordCheck(n, "SP")), muP: WIDTHS.map((n) => coordCheck(n, "muP")) }), []);
  const cur = res[param];
  const W = 330, H = 165, X0 = 34, PW = 286, Y0 = 8, PH = 125, ly0 = -2, ly1 = 1;
  const px = (n: number) => X0 + (Math.log2(n / 64) / 4) * PW;
  const py = (v: number) => Y0 + PH - ((Math.min(ly1, Math.max(ly0, Math.log10(v))) - ly0) / (ly1 - ly0)) * PH;
  const line = (vals: number[]) => vals.map((v, i) => `${px(WIDTHS[i]).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Parametrisation">
          {(["SP", "muP"] as Param[]).map((p) => (
            <button key={p} className="seg" aria-pressed={param === p} onClick={() => setParam(p)}>{p === "SP" ? "standard" : "μP"}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Size of activation updates against width after one Adam step">
        {[-1, 0, 1].map((e) => (
          <g key={e}>
            <line x1={X0} x2={X0 + PW} y1={py(Math.pow(10, e))} y2={py(Math.pow(10, e))} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(Math.pow(10, e)) + 3} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {WIDTHS.map((n) => (
          <text key={n} x={px(n)} y={Y0 + PH + 12} textAnchor={n === 1024 ? "end" : "middle"} className="viz-label">{n}</text>
        ))}
        <polyline points={line(cur.map((c) => c.hidden))} fill="none" stroke="var(--code-function)" strokeWidth={2} />
        <polyline points={line(cur.map((c) => c.output))} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {cur.map((c, i) => (
          <g key={i}>
            <circle cx={px(WIDTHS[i])} cy={py(c.hidden)} r={3} fill="var(--code-function)" />
            <circle cx={px(WIDTHS[i])} cy={py(c.output)} r={3} fill="var(--accent)" />
          </g>
        ))}
        <text x={X0} y={H - 2} className="viz-label">width; blue: hidden change; purple: output change</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {param === "SP" ? "standard" : "μP"}: from width 64 to 1024 the hidden change grows ×{(cur[4].hidden / cur[0].hidden).toFixed(1)} and the output change ×
        {(cur[4].output / cur[0].output).toFixed(1)}
      </div>
      <figcaption className="viz-caption">
        A coordinate check: train the same small MLP at five widths for one Adam step with the same base learning rate, and
        measure how far the hidden pre-activations and the output move on sixteen probe inputs. Under the standard parametrisation
        both grow with width, so a learning rate tuned at width 64 is far too large at width 1024. Under μP, hidden and output
        learning rates divided by the width multiplier and a smaller output initialisation keep both roughly flat.
      </figcaption>
    </figure>
  );
}
