"use client";

import { useMemo, useState } from "react";

const f = (x: number, y: number) => (x - y) / (x + y) ** 3;
export const EPS = [0.1, 0.01, 0.001, 0];

/**
 * Iterated integrals of f over [ε, 1]². The antiderivative y/(x + y)² in y gives the inner integral 1/(1 + x)² − ε/(x + ε)²,
 * whose integral over [ε, 1] is (1/(1 + ε) − 1/2) − (1/2 − ε/(1 + ε)) = 0 for ε > 0, and 1/2 for ε = 0. The other order is the
 * negative, since f(y, x) = −f(x, y).
 */
export function iterated(e: number) {
  const yFirst = e === 0 ? 0.5 : 0;
  return { yFirst, xFirst: e === 0 ? -0.5 : 0 };
}

/** ∫∫ |f| over [ε, 1]² on a logarithmic grid (x = e^u), which resolves the corner at the origin. */
export function absIntegral(e: number, n = 400) {
  if (e === 0) return Infinity;
  const L = -Math.log(e), du = L / n;
  const us = Array.from({ length: n }, (_, i) => Math.exp(Math.log(e) + (i + 0.5) * du));
  let s = 0;
  for (const x of us) for (const y of us) s += Math.abs(f(x, y)) * x * y;
  return s * du * du;
}

export function FubiniFailViz() {
  const [ei, setEi] = useState(1);
  const e = EPS[ei], it = iterated(e);
  const abs = useMemo(() => EPS.map((v) => absIntegral(v)), []);
  const G = 36, S = 200, X0 = (330 - S) / 2, Y0 = 6, c = S / G;
  const cells = useMemo(() => Array.from({ length: G * G }, (_, k) => {
    const i = k % G, j = Math.floor(k / G), x = (i + 0.5) / G, y = (j + 0.5) / G, v = f(x, y);
    return { i, j, v };
  }), []);
  const sq = (t: number) => X0 + t * S;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">cut-off ε</span>
        <div className="segmented" role="group" aria-label="Cut-off near the origin">
          {EPS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 330 ${S + 26}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Sign and size of (x − y)/(x + y)³ on the unit square">
        {cells.map(({ i, j, v }) => <rect key={`${i}-${j}`} x={X0 + i * c} y={Y0 + S - (j + 1) * c} width={c + 0.3} height={c + 0.3} fill={v > 0 ? "var(--accent)" : "var(--code-function)"} fillOpacity={Math.min(0.9, 0.08 + Math.abs(v) / 6)} />)}
        <rect x={sq(e)} y={Y0} width={S * (1 - e)} height={S * (1 - e)} fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="5 3" />
        <text x={X0} y={S + 22} className="viz-label">0</text>
        <text x={X0 + S} y={S + 22} textAnchor="end" className="viz-label">x = 1</text>
        <text x={X0 - 6} y={Y0 + 10} textAnchor="end" className="viz-label">y = 1</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>■</span> f &gt; 0 (x &gt; y)</span>
        <span><span style={{ color: "var(--code-function)" }}>■</span> f &lt; 0</span>
        <span>┅ the square [ε, 1]²</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        dy then dx: {it.yFirst.toFixed(3)}; dx then dy: {it.xFirst.toFixed(3)}; ∫∫|f| = {Number.isFinite(abs[ei]) ? abs[ei].toFixed(2) : "∞"}
      </div>
      <figcaption className="viz-caption">
        f(x, y) = (x − y)/(x + y)³ is positive below the diagonal and negative above it, and blows up at the corner. On
        every square [ε, 1]² it is bounded, so Fubini applies and both iterated integrals are 0 by symmetry. But ∫∫|f| grows
        without bound as the square fills out, 0.33 at ε = 0.1, 1.32 at 0.01 and 2.46 at 0.001, and on the full square f is
        not integrable. There integrating in y first gives +1/2 and in x first gives −1/2.
      </figcaption>
    </figure>
  );
}
