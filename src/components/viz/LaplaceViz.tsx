"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const sig = (z: number) => 1 / (1 + Math.exp(-z));

/** Logistic regression with a bias, prior N(0, I); returns the MAP, the Laplace covariance and the data. */
export function laplace(n: number, seed: number) {
  const r = rand(seed);
  const xs = Array.from({ length: n }, () => -2 + 4 * r());
  const ys = xs.map((x) => (r() < sig(2 * x + 0.5) ? 1 : 0));
  let b = 0, w = 0, H = [[1, 0], [0, 1]];
  for (let it = 0; it < 40; it++) {
    let g0 = b, g1 = w; H = [[1, 0], [0, 1]];
    xs.forEach((x, i) => { const p = sig(b + w * x), s = p * (1 - p); g0 += p - ys[i]; g1 += (p - ys[i]) * x; H[0][0] += s; H[0][1] += s * x; H[1][1] += s * x * x; });
    H[1][0] = H[0][1];
    const det = H[0][0] * H[1][1] - H[0][1] ** 2;
    b -= (H[1][1] * g0 - H[0][1] * g1) / det; w -= (H[0][0] * g1 - H[0][1] * g0) / det;
  }
  const det = H[0][0] * H[1][1] - H[0][1] ** 2;
  const S = [[H[1][1] / det, -H[0][1] / det], [-H[0][1] / det, H[0][0] / det]];
  const mapP = (x: number) => sig(b + w * x);
  const lapP = (x: number) => { const v = S[0][0] + 2 * S[0][1] * x + S[1][1] * x * x; return sig((b + w * x) / Math.sqrt(1 + (Math.PI * v) / 8)); };
  // Posterior samples via the Cholesky factor of S.
  const l00 = Math.sqrt(S[0][0]), l10 = S[0][1] / l00, l11 = Math.sqrt(S[1][1] - l10 * l10);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const samples = Array.from({ length: 400 }, () => { const z0 = nrm(), z1 = nrm(); return [b + l00 * z0, w + l10 * z0 + l11 * z1]; });
  const mcP = (x: number) => samples.reduce((a, [sb, sw]) => a + sig(sb + sw * x), 0) / samples.length;
  return { xs, ys, b, w, S, mapP, lapP, mcP, samples };
}

const NS = [8, 32, 128], PROBE = 6;

export function LaplaceViz() {
  const [ni, setNi] = useState(0);
  const L = useMemo(() => laplace(NS[ni], 11), [ni]);
  const grid = useMemo(() => Array.from({ length: 121 }, (_, i) => -8 + (i * 16) / 120), []);
  const W = 330, H = 180, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 26;
  const sx = (x: number) => X0 + ((x + 8) / 16) * PW, sy = (p: number) => Y0 + PH - p * PH;
  const line = (g: (x: number) => number) => grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">training points</span>
        <div className="segmented" role="group" aria-label="Number of training points">
          {NS.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Predictive probability under the MAP estimate and the Laplace approximation">
        <rect x={sx(-2)} y={Y0} width={sx(2) - sx(-2)} height={PH} fill="var(--text)" fillOpacity={0.05} />
        <line x1={X0} x2={X0 + PW} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--border)" />
        {L.samples.slice(0, 15).map(([sb, sw], k) => <path key={k} d={line((x) => sig(sb + sw * x))} fill="none" stroke="var(--code-function)" strokeOpacity={0.3} strokeWidth={1} />)}
        <path d={line(L.mapP)} fill="none" stroke="var(--text)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={line(L.lapP)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
        {L.xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(L.ys[i])} r={2} fill="var(--text)" fillOpacity={0.6} />)}
        {[-8, -4, 0, 4, 8].map((t) => <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span>- - - MAP</span>
        <span><span style={{ color: "var(--accent)" }}>━</span> Laplace predictive</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> posterior samples</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        at x = {PROBE}: MAP {L.mapP(PROBE).toFixed(3)}, Laplace {L.lapP(PROBE).toFixed(3)}, Monte Carlo {L.mcP(PROBE).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Logistic regression with data only in the shaded band. The MAP curve becomes certain as soon as it leaves the data;
        the Laplace predictive averages over a Gaussian around the MAP, so its confidence grows far more slowly where the
        weights are uncertain. With 8 points, at x = 6 the MAP says 0.995 and the Laplace predictive 0.864; at every setting the probit
        approximation tracks a 400-sample Monte Carlo average to within 0.02.
      </figcaption>
    </figure>
  );
}
