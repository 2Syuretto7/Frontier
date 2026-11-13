"use client";

import { useState } from "react";

// H = R diag(8, 1) Rᵀ with a rotation of 30°
const TH = Math.PI / 6;
const L1 = 8, L2 = 1;
const c = Math.cos(TH), s = Math.sin(TH);
const H = [
  [L1 * c * c + L2 * s * s, (L1 - L2) * c * s],
  [(L1 - L2) * c * s, L1 * s * s + L2 * c * c],
];
const hv = (v: [number, number]): [number, number] => [H[0][0] * v[0] + H[0][1] * v[1], H[1][0] * v[0] + H[1][1] * v[1]];
const S = 280, C = S / 2, SC = 100;
const START: [number, number] = [Math.cos(2.2), Math.sin(2.2)];

/** Power iteration with Hessian-vector products finds the direction of greatest curvature. */
export function PowerIterHvpViz() {
  const [vs, setVs] = useState<[number, number][]>([START]);
  const v = vs[vs.length - 1];
  const Hv = hv(v);
  const rq = v[0] * Hv[0] + v[1] * Hv[1];
  const step = () => {
    const n = Math.hypot(...Hv);
    setVs([...vs, [Hv[0] / n, Hv[1] / n]]);
  };
  const ell = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = (2 * Math.PI * i) / 64;
      const a = (k / Math.sqrt(L1)) * Math.cos(t), b = (k / Math.sqrt(L2)) * Math.sin(t);
      pts.push(`${(C + SC * (a * c - b * s)).toFixed(1)},${(C - SC * (a * s + b * c)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={step} disabled={vs.length > 12}>Multiply by H and normalise</button>
        <button type="button" className="btn" onClick={() => setVs([START])}>Reset</button>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label="Contours of a quadratic and the power-iteration vector">
        {[0.4, 0.8, 1.2].map((k) => (
          <polyline key={k} points={ell(k)} fill="none" stroke="var(--text-faint)" />
        ))}
        <line x1={C - 130 * c} y1={C + 130 * s} x2={C + 130 * c} y2={C - 130 * s} stroke="var(--text-faint)" strokeDasharray="4 4" />
        {vs.slice(0, -1).map((w, i) => (
          <line key={i} x1={C} y1={C} x2={C + SC * w[0]} y2={C - SC * w[1]} stroke="var(--text-faint)" strokeWidth={1.2} />
        ))}
        <line x1={C} y1={C} x2={C + SC * v[0]} y2={C - SC * v[1]} stroke="var(--accent)" strokeWidth={3} />
        <circle cx={C} cy={C} r={3} fill="var(--text)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, textAlign: "center" }}>
        step {vs.length - 1}: estimate vᵀHv = {rq.toFixed(4)} (true largest eigenvalue {L1})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The ellipses are level sets of ½xᵀHx; the dashed line is the steepest direction, the top eigenvector. Each step needs
        only the product Hv, never H itself. The component along the top eigenvector grows by a factor of 8 relative to the
        other each time, so the vector swings onto it within a few steps.
        {vs.length > 5 ? " The largest curvature, the sharpness, sets the largest stable learning rate for gradient descent: 2/λ = 0.25 here." : ""}
      </figcaption>
    </figure>
  );
}
