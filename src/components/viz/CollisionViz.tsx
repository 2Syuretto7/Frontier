"use client";

import { useState } from "react";

const BITS = [32, 48, 64, 128];

/** Probability that n uniformly random b-bit hashes contain at least one collision, 1 - exp(-n(n-1)/2^(b+1)). */
export function pCollide(n: number, bits: number) {
  const x = (n * (n - 1)) / 2 ** (bits + 1);
  return x > 50 ? 1 : -Math.expm1(-x);
}

const fmt = (v: number) => (v >= 0.01 && v < 1e4 ? v.toPrecision(2) : v.toExponential(1));

export function CollisionViz() {
  const [bi, setBi] = useState(2);
  const bits = BITS[bi];
  const W = 330, X0 = 34, Y0 = 8, PW = 284, PH = 120, LO = 3, HI = 13;
  const x = (e: number) => X0 + ((e - LO) / (HI - LO)) * PW;
  const y = (p: number) => Y0 + PH - p * PH;
  const pts = Array.from({ length: 201 }, (_, i) => { const e = LO + ((HI - LO) * i) / 200; return `${x(e)},${y(pCollide(10 ** e, bits))}`; }).join(" ");
  const half = Math.sqrt(2 * Math.LN2) * 2 ** (bits / 2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">hash bits</span>
        <div className="segmented" role="group" aria-label="Hash size">
          {BITS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={bi === j} onClick={() => setBi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of a hash collision against number of documents">
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={y(0)} y2={y(1)} stroke="var(--border)" />
        <line x1={x(10)} x2={x(10)} y1={y(0)} y2={y(1)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {[4, 6, 8, 10, 12].map((e) => <text key={e} x={x(e)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">10<tspan dy={-4} fontSize={8}>{e}</tspan></text>)}
        {[0, 0.5, 1].map((p) => <text key={p} x={X0 - 5} y={y(p) + 4} textAnchor="end" className="viz-label">{p}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        even odds of a collision at {half.toExponential(1)} documents; at 10<sup>10</sup>, p = {fmt(pCollide(1e10, bits))} and{" "}
        {fmt(1e20 / 2 ** (bits + 1))} colliding pairs expected
      </div>
      <figcaption className="viz-caption">
        Chance that some two of n distinct documents get the same hash, for hashes of different sizes, with n on a log scale. The
        dashed line marks ten billion documents, the size of a large crawl. A 32-bit hash collides almost surely after a
        few hundred thousand documents. With 64 bits, ten billion documents probably contain a few colliding pairs, so a handful of
        distinct documents are wrongly dropped; with 128 bits, even one collision is vanishingly unlikely.
      </figcaption>
    </figure>
  );
}
