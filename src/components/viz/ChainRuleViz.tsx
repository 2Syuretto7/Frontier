"use client";

import { useState } from "react";

const h = (q: number) => (q <= 0 || q >= 1 ? 0 : -q * Math.log2(q) - (1 - q) * Math.log2(1 - q));
const N = 8;

/** The chain rule for a two-state Markov chain: H(X₁, …, Xₙ) = H(X₁) + Σ H(Xᵢ | Xᵢ₋₁), and the per-symbol entropy tending to the entropy rate. */
export function ChainRuleViz() {
  const [a, setA] = useState(0.1);
  const [b, setB] = useState(0.5);
  const pi0 = b / (a + b || 1), pi1 = 1 - pi0;
  const H1 = h(pi0), rate = pi0 * h(a) + pi1 * h(b);
  const terms = Array.from({ length: N }, (_, i) => (i === 0 ? H1 : rate));
  const W = 330, Ht = 210;
  const unit = (W - 60) / (N * 1.0);
  const SX = (v: number) => 40 + v * unit;
  const PX = (n: number) => 40 + ((n - 1) / (N - 1)) * (W - 60);
  const PY = (v: number) => 190 - v * 90;
  const per = Array.from({ length: N }, (_, i) => (H1 + i * rate) / (i + 1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(0→1) = {a.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="probability of switching from 0 to 1" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(1→0) = {b.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="probability of switching from 1 to 0" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Joint entropy of eight steps split into chain-rule terms, and the entropy per symbol against block length">
        <text x={40} y={14} className="viz-label">H(X₁, …, X₈) = H(X₁) + H(X₂ | X₁) + … (bits)</text>
        {terms.map((t, i) => {
          const start = terms.slice(0, i).reduce((s, v) => s + v, 0);
          return <rect key={i} x={SX(start)} y={22} width={Math.max(0, SX(start + t) - SX(start) - 1)} height={20} fill={i === 0 ? "var(--accent)" : "var(--text-muted)"} opacity={0.75} />;
        })}
        <text x={40} y={58} className="viz-label">total {(H1 + (N - 1) * rate).toFixed(3)} bits; independent copies would need {(N * H1).toFixed(3)}</text>
        <line x1={PX(1)} x2={PX(N)} y1={PY(0)} y2={PY(0)} stroke="var(--border)" />
        <line x1={PX(1)} x2={PX(N)} y1={PY(rate)} y2={PY(rate)} stroke="var(--danger)" strokeDasharray="3 3" />
        <line x1={PX(1)} x2={PX(N)} y1={PY(H1)} y2={PY(H1)} stroke="var(--accent)" strokeDasharray="3 3" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={per.map((v, i) => `${PX(i + 1).toFixed(1)},${PY(v).toFixed(1)}`).join(" ")} />
        {per.map((v, i) => <circle key={i} cx={PX(i + 1)} cy={PY(v)} r={2.5} fill="var(--text)" />)}
        <text x={PX(1)} y={Ht - 4} className="viz-label">n = 1</text>
        <text x={PX(N)} y={Ht - 4} textAnchor="end" className="viz-label">n = {N}</text>
        <text x={4} y={PY(1) + 3} className="viz-label">1 bit</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        H(X₁) = {H1.toFixed(4)}, entropy rate = {rate.toFixed(4)} bits per symbol
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A two-state chain started from its stationary distribution. The top bar splits the entropy of eight steps into
        the chain-rule terms: the first symbol costs H(X₁) (accent), and each later one only what is new given the
        previous symbol, the entropy rate. The curve below is the entropy per symbol, H(X₁, …, Xₙ)/n, falling from H(X₁)
        (accent dashes) towards the rate (red dashes). Sticky chains have a low rate even when H(X₁) is a full bit.
      </figcaption>
    </figure>
  );
}
