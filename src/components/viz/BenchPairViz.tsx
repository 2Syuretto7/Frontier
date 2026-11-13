"use client";

import { useState } from "react";

function erf(x: number) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

/** Power to detect an accuracy gap between two models on one test set, with the unpaired two-proportion test against the paired test, as the models' agreement varies. */
export function BenchPairViz() {
  const [gap10, setGap10] = useState(20);
  const [rho10, setRho10] = useState(8);
  const pa = 0.8, gap = gap10 / 1000, pb = pa - gap, rho = rho10 / 10;
  const p11 = rho * Math.min(pa, pb) + (1 - rho) * pa * pb;
  const b = pa - p11, c = pb - p11;
  const vPair = b + c - gap * gap;
  const vUnp = pa * (1 - pa) + pb * (1 - pb);
  const power = (n: number, v: number) => (gap === 0 ? 0.05 : Phi(gap / Math.sqrt(v / n) - 1.96) + Phi(-gap / Math.sqrt(v / n) - 1.96));
  const ns = Array.from({ length: 101 }, (_, i) => Math.round(Math.pow(10, 2 + (2 * i) / 100)));
  const W = 330, H = 150;
  const X = (n: number) => 18 + ((Math.log10(n) - 2) / 2) * (W - 34);
  const Y = (p: number) => H - 16 - p * (H - 26);
  const line = (v: number) => ns.map((n) => `${X(n).toFixed(1)},${Y(power(n, v)).toFixed(1)}`).join(" ");
  const need = (v: number) => (gap === 0 ? Infinity : Math.ceil((v * (1.96 + 0.8416) * (1.96 + 0.8416)) / (gap * gap)));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          gap = {(gap * 100).toFixed(1)} points
          <input type="range" min={0} max={60} value={gap10} onChange={(e) => setGap10(Number(e.target.value))} aria-label="accuracy gap" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          agreement ρ = {rho.toFixed(1)}
          <input type="range" min={0} max={10} value={rho10} onChange={(e) => setRho10(Number(e.target.value))} aria-label="agreement between models" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Power of paired and unpaired tests against test set size">
        <line x1={X(100)} x2={X(10000)} y1={Y(0.8)} y2={Y(0.8)} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.6} points={line(vUnp)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.9} points={line(vPair)} />
        <line x1={X(100)} x2={X(10000)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(100)} y={H - 2} className="viz-label">n = 100</text>
        <text x={X(1000)} y={H - 2} textAnchor="middle" className="viz-label">1000</text>
        <text x={X(10000)} y={H - 2} textAnchor="end" className="viz-label">10 000</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        disagreements: A only {(b * 100).toFixed(1)}%, B only {(c * 100).toFixed(1)}%; n for 80% power: paired {need(vPair)}, unpaired {need(vUnp)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Model A has accuracy 0.80 and model B is lower by the chosen gap. Both are scored on the same n test questions.
        The unpaired test (danger) treats the two accuracies as independent; the paired test (accent) looks at the
        per-question differences, whose variance depends only on how often the models disagree. When the models agree on
        most questions, the paired test needs several times fewer questions for the same power.
      </figcaption>
    </figure>
  );
}
