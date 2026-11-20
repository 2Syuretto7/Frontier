"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 4, M = 32, T = 40, N0 = 16;
const WIDTHS = [16, 64, 256];
const LOGLRS = Array.from({ length: 15 }, (_, i) => -6 + i * 0.5);
const COLORS = ["var(--code-string)", "var(--code-function)", "var(--accent)"];
type Param = "sp" | "mup";

function data() {
  const r = rand(11);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const X = Array.from({ length: M }, () => Array.from({ length: D }, normal));
  const a = Array.from({ length: D }, () => normal() / 2);
  const Y = X.map((x) => Math.sin(2 * x.reduce((s, v, k) => s + v * a[k], 0)) + 0.5 * Math.cos(x[0]));
  return { X, Y };
}
const { X, Y } = data();

/** Final training loss of f(x) = Σ a_j relu(w_j·x) after T steps of full-batch GD; NaN if it diverged. */
export function finalLoss(p: Param, n: number, lr: number, seed: number) {
  const r = rand(seed * 977 + n);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const W = Array.from({ length: n }, () => Array.from({ length: D }, () => normal() / Math.sqrt(D)));
  const A = Array.from({ length: n }, () => (p === "sp" ? normal() / Math.sqrt(n) : (normal() * Math.sqrt(N0)) / n));
  const lw = p === "sp" ? lr : (lr * n) / N0, la = p === "sp" ? lr : (lr * N0) / n;
  const H = Array.from({ length: M }, () => new Float64Array(n));
  const RES = new Float64Array(M);
  const loss = () => {
    let L = 0;
    for (let i = 0; i < M; i++) {
      let f = 0;
      for (let j = 0; j < n; j++) {
        const w = W[j], x = X[i];
        const h = w[0] * x[0] + w[1] * x[1] + w[2] * x[2] + w[3] * x[3];
        H[i][j] = h;
        if (h > 0) f += A[j] * h;
      }
      const res = f - Y[i];
      L += res * res;
      RES[i] = res / M;
    }
    return L / (2 * M);
  };
  for (let t = 0; t < T; t++) {
    loss();
    for (let j = 0; j < n; j++) {
      let gA = 0, g0 = 0, g1 = 0, g2 = 0, g3 = 0;
      for (let i = 0; i < M; i++) {
        const h = H[i][j];
        if (h <= 0) continue;
        const res = RES[i], x = X[i];
        gA += res * h;
        const c = res * A[j];
        g0 += c * x[0]; g1 += c * x[1]; g2 += c * x[2]; g3 += c * x[3];
      }
      A[j] -= la * gA;
      const w = W[j];
      w[0] -= lw * g0; w[1] -= lw * g1; w[2] -= lw * g2; w[3] -= lw * g3;
    }
    if (!Number.isFinite(A[0]) || Math.abs(A[0]) > 1e6) return NaN;
  }
  const L = loss();
  return Number.isFinite(L) && L < 10 ? L : NaN;
}

export function LrTransferViz() {
  const [p, setP] = useState<Param>("sp");
  const curves = useMemo(() => WIDTHS.map((n) => LOGLRS.map((l) => finalLoss(p, n, 2 ** l, 1))), [p]);
  const W = 330, H = 170, X0 = 40, PW = 280, Y0 = 136, PH = 124, YMAX = 0.25;
  const px = (l: number) => X0 + ((l - LOGLRS[0]) / (LOGLRS[LOGLRS.length - 1] - LOGLRS[0])) * PW;
  const py = (v: number) => Y0 - (Math.min(v, YMAX) / YMAX) * PH;
  const best = curves.map((c) => {
    let k = -1;
    c.forEach((v, i) => { if (Number.isFinite(v) && (k < 0 || v < c[k])) k = i; });
    return k;
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Parametrisation">
          <button className="seg" aria-pressed={p === "sp"} onClick={() => setP("sp")}>standard</button>
          <button className="seg" aria-pressed={p === "mup"} onClick={() => setP("mup")}>μP</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Final training loss against learning rate for three widths">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {[0.1, 0.2].map((v) => <text key={v} x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v.toFixed(1)}</text>)}
        {[-6, -4, -2, 0].map((l) => <text key={l} x={px(l)} y={Y0 + 12} textAnchor="middle" className="viz-label">2{l < 0 ? "⁻" : ""}{"⁰¹²³⁴⁵⁶"[Math.abs(l)]}</text>)}
        {curves.map((c, k) => {
          const segs: string[] = [];
          let d = "";
          c.forEach((v, i) => {
            if (Number.isFinite(v)) d += `${d ? "L" : "M"}${px(LOGLRS[i]).toFixed(1)},${py(v).toFixed(1)}`;
            else if (d) { segs.push(d); d = ""; }
          });
          if (d) segs.push(d);
          return (
            <g key={k}>
              {segs.map((s, i) => <path key={i} d={s} fill="none" stroke={COLORS[k]} strokeWidth={2} />)}
              {best[k] >= 0 ? <circle cx={px(LOGLRS[best[k]])} cy={py(c[best[k]])} r={4} fill="var(--surface)" stroke={COLORS[k]} strokeWidth={2} /> : null}
              <text x={X0 + 6 + k * 64} y={12} className="viz-label" style={{ fill: COLORS[k] }}>n = {WIDTHS[k]}</text>
            </g>
          );
        })}
        <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">learning rate (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        best learning rate: {WIDTHS.map((n, k) => `n = ${n}: 2^${LOGLRS[best[k]]}`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        A one-hidden-layer ReLU network fitted by 40 steps of gradient descent, swept over learning rates at three widths;
        lines stop where training diverges, and circles mark each width&apos;s best rate. With one learning rate for all
        weights, the best rate falls as the network widens and the narrow model&apos;s choice diverges at width 256. With μP,
        defined relative to base width 16 so the two agree there, the curves share their optimum and reach similar losses
        there, so a sweep at width 16 picks the right rate for width 256.
      </figcaption>
    </figure>
  );
}
