"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const CENTRES = [0.6, -0.9, 1.4], A = 0.8, B = 3;

/** One monotone layer g(z) = z + A tanh(B (z - c)) and the log of its derivative. */
const g = (z: number, c: number) => z + A * Math.tanh(B * (z - c));
const logDeriv = (z: number, c: number) => Math.log(1 + (A * B) / Math.cosh(B * (z - c)) ** 2);
const ginv = (x: number, c: number) => { let lo = x - A - 1e-9, hi = x + A + 1e-9; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (g(m, c) < x) lo = m; else hi = m; } return (lo + hi) / 2; };

/** Log-density of x after L layers applied to a standard normal, by the change-of-variables formula. */
export function logp(x: number, L: number) {
  let v = x, ld = 0;
  for (let l = L - 1; l >= 0; l--) { v = ginv(v, CENTRES[l]); ld += logDeriv(v, CENTRES[l]); }
  return -0.5 * Math.log(2 * Math.PI) - (v * v) / 2 - ld;
}

export function samples(L: number, n: number, seed: number) {
  const r = rand(seed);
  return Array.from({ length: n }, () => { let z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); for (let l = 0; l < L; l++) z = g(z, CENTRES[l]); return z; });
}

const LO = -5, HI = 5, NB = 50;

export function integral(L: number) {
  let s = 0; const h = 0.01;
  for (let x = -8; x < 8; x += h) s += Math.exp(logp(x + h / 2, L)) * h;
  return s;
}

export function FlowDensityViz() {
  const [L, setL] = useState(2);
  const xs = useMemo(() => samples(L, 5000, 9), [L]);
  const hist = useMemo(() => { const c = new Array(NB).fill(0); for (const x of xs) { const b = Math.floor(((x - LO) / (HI - LO)) * NB); if (b >= 0 && b < NB) c[b]++; } return c.map((k) => k / (xs.length * ((HI - LO) / NB))); }, [xs]);
  const total = useMemo(() => integral(L), [L]);
  const W = 330, H = 170, X0 = 10, PW = W - 20, Y0 = 8, PH = H - Y0 - 30, YM = 0.75, bw = PW / NB;
  const sx = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW, sy = (y: number) => Y0 + PH - (Math.min(y, YM) / YM) * PH;
  const grid = Array.from({ length: 401 }, (_, i) => LO + (i * (HI - LO)) / 400);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">layers</span>
        <div className="segmented" role="group" aria-label="Number of flow layers">
          {[0, 1, 2, 3].map((l) => <button key={l} type="button" className="seg" aria-pressed={L === l} onClick={() => setL(l)}>{l}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Density of a one-dimensional flow">
        {hist.map((h, i) => <rect key={i} x={X0 + i * bw + 0.5} y={sy(h)} width={bw - 1} height={Y0 + PH - sy(h)} fill="var(--text-muted)" fillOpacity={0.3} />)}
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.exp(logp(x, 0))).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.exp(logp(x, L))).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border-strong)" />
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 16} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>■</span> histogram of 5000 samples</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> density by change of variables</span>
        <span>dashed: base N(0, 1)</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`formula density integrates to ${total.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption">
        Each layer is a monotone map z ↦ z + 0.8 tanh(3(z − c)), steep near its centre c. Pushing standard normal samples
        through it spreads them apart where the map is steep, thinning the density there, and piles them up on either side:
        the new density is the base density divided by the stretch factor. The formula, computed by inverting the layers and summing their log-derivatives, matches the
        histogram and integrates to 1 at every depth.
      </figcaption>
    </figure>
  );
}
