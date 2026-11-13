"use client";

import { useState } from "react";

const NS = [2, 3, 5, 10, 20, 50, 100, 1000];
const lgam = (k: number) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const binom = (n: number, p: number, k: number) => (k > n ? 0 : Math.exp(lgam(n) - lgam(k) - lgam(n - k) + k * Math.log(p) + (n - k) * Math.log1p(-p)));
const pois = (l: number, k: number) => Math.exp(-l + k * Math.log(l) - lgam(k));

/** Binomial(n, λ/n) against Poisson(λ): bars side by side, with the total variation distance. */
export function PoissonLimitViz() {
  const [lt, setLt] = useState(30);
  const [ni, setNi] = useState(3);
  const lam = lt / 10, n = NS[ni];
  const p = Math.min(lam / n, 0.999999);
  const kmax = Math.ceil(lam + 4 * Math.sqrt(lam) + 3);
  const ks = Array.from({ length: kmax + 1 }, (_, k) => k);
  const b = ks.map((k) => binom(n, p, k)), q = ks.map((k) => pois(lam, k));
  let tv = 0;
  for (let k = 0; k <= Math.max(n, kmax); k++) tv += Math.abs(binom(n, p, k) - pois(lam, k));
  let tail = 1;
  for (let k = 0; k <= Math.max(n, kmax); k++) tail -= pois(lam, k);
  tv = (tv + Math.max(0, tail)) / 2;
  const W = 320, H = 150;
  const top = Math.max(...b, ...q) * 1.1;
  const bw = (W - 40) / (kmax + 1);
  const Y = (v: number) => H - 20 - (v / top) * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          λ = {lam.toFixed(1)}
          <input type="range" min={5} max={100} value={lt} onChange={(e) => setLt(Number(e.target.value))} aria-label="Poisson mean" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          n = {n}
          <input type="range" min={0} max={NS.length - 1} value={ni} onChange={(e) => setNi(Number(e.target.value))} aria-label="number of trials" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Binomial and Poisson probabilities side by side">
        <line x1={30} x2={W - 10} y1={H - 20} y2={H - 20} stroke="var(--border)" />
        {ks.map((k) => (
          <g key={k}>
            <rect x={30 + k * bw + bw * 0.1} y={Y(b[k])} width={bw * 0.38} height={H - 20 - Y(b[k])} fill="var(--accent)" />
            <rect x={30 + k * bw + bw * 0.5} y={Y(q[k])} width={bw * 0.38} height={H - 20 - Y(q[k])} fill="var(--danger)" opacity={0.7} />
            {(kmax <= 14 || k % 2 === 0) && <text x={30 + k * bw + bw / 2} y={H - 6} textAnchor="middle" className="viz-label">{k}</text>}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        p = λ/n = {(lam / n).toFixed(4)}{lam / n >= 1 ? " (capped)" : ""}; total variation distance {tv.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Blue: Binomial(n, λ/n), the number of successes in n independent trials with mean λ. Red: Poisson(λ). As n grows with
        the mean held fixed, the binomial bars settle onto the Poisson ones, and the total variation distance, the largest
        possible gap between the two probabilities of any event, shrinks in proportion to 1/n.
      </figcaption>
    </figure>
  );
}
