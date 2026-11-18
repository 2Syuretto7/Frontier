"use client";

import { useState } from "react";

/** Three one-dimensional quadratic tasks, loss ½·a·(w − c)², differing in curvature a and optimum c. */
export const A = [1, 2, 4];
export const C = [-1, 0.5, 2];
const ALPHAS = [0, 0.1, 0.2];
const WS = Array.from({ length: 121 }, (_, i) => -1.5 + i * (4 / 120));

/** Mean loss after one inner gradient step of size alpha from w. With alpha = 0 it is the plain average loss. */
export function metaLoss(w: number, alpha: number) {
  let s = 0;
  for (let i = 0; i < A.length; i++) {
    const wp = w - alpha * A[i] * (w - C[i]);
    s += 0.5 * A[i] * (wp - C[i]) ** 2;
  }
  return s / A.length;
}

/** Minimiser of the MAML objective, and the point where the first-order approximation of its gradient vanishes. */
export function optima(alpha: number) {
  let n2 = 0, d2 = 0, n1 = 0, d1 = 0;
  for (let i = 0; i < A.length; i++) {
    const r = 1 - alpha * A[i];
    n2 += A[i] * r * r * C[i];
    d2 += A[i] * r * r;
    n1 += A[i] * r * C[i];
    d1 += A[i] * r;
  }
  return { maml: n2 / d2, first: n1 / d1 };
}

export function MamlObjectiveViz() {
  const [alpha, setAlpha] = useState(0.2);
  const W = 300, H = 170, X0 = 30, PW = W - 38, PH = 140;
  const ymax = Math.max(...WS.map((w) => metaLoss(w, 0)));
  const sx = (w: number) => X0 + ((w + 1.5) / 4) * PW, sy = (v: number) => 8 + ((ymax - v) / ymax) * PH;
  const plain = optima(0).maml;
  const { maml, first } = optima(alpha);
  const marks = [
    { w: plain, colour: "var(--text-muted)" },
    { w: first, colour: "var(--danger)" },
    { w: maml, colour: "var(--accent)" },
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">inner step α</span>
        {ALPHAS.map((a) => (
          <button key={a} type="button" className="seg" aria-pressed={alpha === a} onClick={() => setAlpha(a)}>{a.toFixed(1)}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Average task loss before and after one adaptation step, with the minimisers marked">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" points={WS.map((w) => `${sx(w)},${sy(metaLoss(w, 0))}`).join(" ")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={WS.map((w) => `${sx(w)},${sy(metaLoss(w, alpha))}`).join(" ")} />
        {marks.map((m, i) => (
          <line key={i} x1={sx(m.w)} y1={8} x2={sx(m.w)} y2={8 + PH} stroke={m.colour} strokeWidth={1.5} strokeDasharray={i === 2 ? undefined : "2 2"} />
        ))}
        {C.map((c) => (
          <circle key={c} cx={sx(c)} cy={sy(0)} r={3} fill="var(--text)" />
        ))}
        {[-1, 0, 1, 2].map((w) => (
          <text key={w} x={sx(w)} y={H + 12} textAnchor="middle" className="viz-label">{w}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`plain ${plain.toFixed(3)}   MAML ${maml.toFixed(3)}   first-order ${first.toFixed(3)}`}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`loss after adapting: from plain ${metaLoss(plain, alpha).toFixed(3)}, from MAML ${metaLoss(maml, alpha).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Three tasks with optima at the dots and curvatures 1, 2 and 4. The dashed curve is the average loss with no
        adaptation; the solid curve is the average loss after one gradient step of size α on each task, which is what MAML
        minimises. Its minimiser (solid line) moves away from the plain average (grey) toward where a single step helps most.
        Dropping the second-order term, as first-order MAML does, settles at a third point (red), which coincides with the
        others only when α is zero.
      </figcaption>
    </figure>
  );
}
