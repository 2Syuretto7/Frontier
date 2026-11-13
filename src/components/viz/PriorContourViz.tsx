"use client";

import { useState } from "react";

const WH = [2.4, 0.5];
const HM = [[2, 1], [1, 2]];
const HW = [HM[0][0] * WH[0] + HM[0][1] * WH[1], HM[1][0] * WH[0] + HM[1][1] * WH[1]];
const soft = (z: number, t: number) => Math.sign(z) * Math.max(Math.abs(z) - t, 0);

function mapL2(lam: number) {
  const a = HM[0][0] + lam, b = HM[0][1], d = HM[1][1] + lam;
  const det = a * d - b * b;
  return [(d * HW[0] - b * HW[1]) / det, (a * HW[1] - b * HW[0]) / det];
}

function mapL1(lam: number) {
  const w = [0, 0];
  for (let it = 0; it < 200; it++) {
    w[0] = soft(HW[0] - HM[0][1] * w[1], lam) / HM[0][0];
    w[1] = soft(HW[1] - HM[1][0] * w[0], lam) / HM[1][1];
  }
  return w;
}

const quad = (w: number[]) => {
  const e = [w[0] - WH[0], w[1] - WH[1]];
  return e[0] * (HM[0][0] * e[0] + HM[0][1] * e[1]) + e[1] * (HM[1][0] * e[0] + HM[1][1] * e[1]);
};
const LAMS = Array.from({ length: 61 }, (_, i) => i * 0.1);

/** MAP estimation in two dimensions: the likelihood's elliptical contours meet the prior's circle (Gaussian) or diamond (Laplace) at the MAP point. */
export function PriorContourViz() {
  const [k, setK] = useState(15);
  const [l1, setL1] = useState(false);
  const lam = LAMS[k];
  const fit = l1 ? mapL1 : mapL2;
  const w = fit(lam);
  const path = LAMS.map(fit);
  const W = 300, H = 230;
  const X = (v: number) => 30 + ((v + 1) / 4) * (W - 60);
  const Y = (v: number) => H / 2 + 20 - (v / 4) * (W - 60);
  const s = 1 / Math.SQRT2;
  const ellipse = (c: number) =>
    Array.from({ length: 73 }, (_, i) => {
      const th = (2 * Math.PI * i) / 72;
      const a = Math.sqrt(c / 3) * Math.cos(th), b = Math.sqrt(c) * Math.sin(th);
      return `${X(WH[0] + s * a + s * b).toFixed(1)},${Y(WH[1] + s * a - s * b).toFixed(1)}`;
    }).join(" ");
  const cMap = quad(w);
  const r2 = Math.hypot(w[0], w[1]), r1 = Math.abs(w[0]) + Math.abs(w[1]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <button type="button" className="seg" aria-pressed={!l1} onClick={() => setL1(false)}>Gaussian prior (ridge)</button>
        <button type="button" className="seg" aria-pressed={l1} onClick={() => setL1(true)}>Laplace prior (lasso)</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam.toFixed(1)}
          <input type="range" min={0} max={LAMS.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="prior strength lambda" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Likelihood contours, prior contour and the MAP estimate in weight space">
        <line x1={X(-1)} x2={X(3)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={Y(1.8)} y2={Y(-1.6)} stroke="var(--border)" />
        {[0.5, 2, 5].map((c) => <polyline key={c} points={ellipse(c)} fill="none" stroke="var(--text-muted)" strokeWidth={0.8} />)}
        {cMap > 1e-9 && <polyline points={ellipse(cMap)} fill="none" stroke="var(--text)" strokeWidth={1.2} />}
        {l1 ? (
          <polygon points={`${X(r1)},${Y(0)} ${X(0)},${Y(r1)} ${X(-r1)},${Y(0)} ${X(0)},${Y(-r1)}`} fill="var(--accent)" opacity={0.18} stroke="var(--accent)" />
        ) : (
          <ellipse cx={X(0)} cy={Y(0)} rx={X(r2) - X(0)} ry={Y(0) - Y(r2)} fill="var(--accent)" opacity={0.18} stroke="var(--accent)" />
        )}
        <polyline points={path.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--danger)" strokeDasharray="3 2" />
        <circle cx={X(WH[0])} cy={Y(WH[1])} r={3} fill="var(--text)" />
        <text x={X(WH[0]) + 5} y={Y(WH[1]) - 5} className="viz-label">ML</text>
        <circle cx={X(w[0])} cy={Y(w[1])} r={4.5} fill="var(--accent)" />
        <text x={X(3)} y={Y(0) - 4} textAnchor="end" className="viz-label">w₁</text>
        <text x={X(0) + 4} y={Y(1.8) + 10} className="viz-label">w₂</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        MAP w = ({w[0].toFixed(3)}, {(Math.abs(w[1]) < 5e-4 ? 0 : w[1]).toFixed(3)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The grey ellipses are contours of the negative log-likelihood around the maximum-likelihood point (ML). The shaded
        shape is the prior contour through the MAP estimate, a circle for a Gaussian prior and a diamond for a Laplace prior;
        at the MAP point the two contours touch. The dashed curve traces the MAP estimate as λ grows from 0. The circle
        shrinks both weights smoothly towards 0; the diamond&apos;s corners catch the estimate on an axis, so w₂ becomes
        exactly 0 once λ passes 1.5.
      </figcaption>
    </figure>
  );
}
