"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const M = 20000, DELTA = 0.05, SHOW = 240;
const GAMMAS = Array.from({ length: 40 }, (_, i) => 0.01 + i * 0.01);

/** Two Gaussian blobs, labels ±1, separated along the direction (1, 1). */
export function data(seed: number) {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: M }, () => {
    const y = r() < 0.5 ? 1 : -1;
    return { x: [0.45 * y + 0.18 * nrm(), 0.45 * y + 0.18 * nrm()], y };
  });
}

/** For a unit-norm direction at the given angle: margins, margin error at each γ and the margin bound (B = 1). */
export function analyse(d: ReturnType<typeof data>, angle: number) {
  const w = [Math.cos(angle), Math.sin(angle)];
  const X = Math.max(...d.map((p) => Math.hypot(p.x[0], p.x[1])));
  const ms = d.map((p) => p.y * (w[0] * p.x[0] + w[1] * p.x[1]));
  const err = ms.filter((t) => t <= 0).length / M;
  const conf = Math.sqrt(Math.log(1 / DELTA) / (2 * M));
  const curve = GAMMAS.map((g) => { const me = ms.filter((t) => t < g).length / M; return { g, me, bound: me + (2 * X) / (g * Math.sqrt(M)) + conf }; });
  const best = curve.reduce((a, c) => (c.bound < a.bound ? c : a));
  return { w, X, err, curve, best };
}

const ANGLES = [Math.PI / 4, Math.PI / 8, 0];
const NAMES = ["45°", "22.5°", "0°"];

export function MarginBoundViz() {
  const [ai, setAi] = useState(0);
  const d = useMemo(() => data(12), []);
  const a = useMemo(() => analyse(d, ANGLES[ai]), [d, ai]);
  const S = 150, c = S / 2, sc = S / 2.6;
  const W = 330, H = 150, X0 = 30, PW = 140, PX = 180;
  const gx = (g: number) => PX + (g / 0.4) * PW, gy = (b: number) => 8 + 120 - (Math.min(b, 1.2) / 1.2) * 120;
  const nx = -a.w[1], ny = a.w[0];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">direction of w</span>
        <div className="segmented" role="group" aria-label="Direction of the weight vector">
          {NAMES.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={ai === i} onClick={() => setAi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Data with a linear separator, and the margin bound as a function of the margin">
        <defs><clipPath id="margin-plot"><rect x={0} y={0} width={S} height={S} /></clipPath></defs>
        <rect x={0} y={0} width={S} height={S} fill="none" stroke="var(--border)" />
        <g clipPath="url(#margin-plot)">
        <polygon points={[[-2, a.best.g], [2, a.best.g], [2, -a.best.g], [-2, -a.best.g]].map(([s, t]) => `${(c + sc * (s * nx + t * a.w[0])).toFixed(1)},${(c - sc * (s * ny + t * a.w[1])).toFixed(1)}`).join(" ")} fill="var(--accent)" fillOpacity={0.15} />
        <line x1={c - sc * 2 * nx} y1={c + sc * 2 * ny} x2={c + sc * 2 * nx} y2={c - sc * 2 * ny} stroke="var(--accent)" strokeWidth={1.5} />
        {d.slice(0, SHOW).map((p, i) => <circle key={i} cx={c + sc * p.x[0]} cy={c - sc * p.x[1]} r={1.6} fill={p.y > 0 ? "var(--accent)" : "var(--code-function)"} fillOpacity={0.8} />)}
        </g>
        <path d={a.curve.map((p, i) => `${i ? "L" : "M"}${gx(p.g).toFixed(1)},${gy(p.bound).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={a.curve.map((p, i) => `${i ? "L" : "M"}${gx(p.g).toFixed(1)},${gy(p.me).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.5} strokeDasharray="4 3" />
        <line x1={PX} x2={PX + PW} y1={gy(1)} y2={gy(1)} stroke="var(--border)" />
        <text x={PX - 4} y={gy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={PX - 4} y={gy(0) + 4} textAnchor="end" className="viz-label">0</text>
        {[0, 0.2, 0.4].map((g) => <text key={g} x={gx(g)} y={H} textAnchor="middle" className="viz-label">{g}</text>)}
        <text x={PX + PW / 2} y={H + 12} textAnchor="middle" className="viz-label">margin γ</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        training error {a.err.toFixed(4)}; best γ {a.best.g.toFixed(2)}, margin error {a.best.me.toFixed(4)}, bound {a.best.bound.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Left: a sample of the 20000 training points, a unit-norm separator and, shaded, the band of half-width γ that gives
        the best bound. Right: the bound (solid) and the fraction of points with margin below γ (dashed) as γ varies; small γ
        pays in complexity, large γ in margin errors. The direction across the two clusters has a wide margin and certifies a
        test error of at most 0.102; tilting it to 0° raises the training error only from 0.0003 to 0.0062, but the
        narrower margin pushes the best bound up to 0.183.
      </figcaption>
    </figure>
  );
}
