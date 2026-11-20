"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type P = [number, number];

/** Four hand-set affine coupling layers; layer k transforms coordinate 1 - (k % 2) using the other. */
const S = [(a: number) => 0.5 * Math.tanh(a), (a: number) => -0.4 * Math.tanh(a), (a: number) => 0.3 * Math.tanh(2 * a), (a: number) => -0.3 * Math.tanh(a)];
const T = [(a: number) => 1.0 * Math.sin(1.5 * a), (a: number) => 0.3 * a * a - 0.6, (a: number) => 0.8 * Math.sin(2 * a), (a: number) => 0.5 * Math.cos(1.5 * a)];

export function forward(p: P, L: number): { y: P; ld: number } {
  let [a, b] = p, ld = 0;
  for (let k = 0; k < L; k++) {
    if (k % 2 === 0) { const s = S[k](a); b = b * Math.exp(s) + T[k](a); ld += s; }
    else { const s = S[k](b); a = a * Math.exp(s) + T[k](b); ld += s; }
  }
  return { y: [a, b], ld };
}

export function inverse(y: P, L: number): P {
  let [a, b] = y;
  for (let k = L - 1; k >= 0; k--) {
    if (k % 2 === 0) b = (b - T[k](a)) * Math.exp(-S[k](a));
    else a = (a - T[k](b)) * Math.exp(-S[k](b));
  }
  return [a, b];
}

export function stats(L: number) {
  const r = rand(5);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const pts = Array.from({ length: 1200 }, () => [nrm(), nrm()] as P);
  let err = 0, ld = 0;
  const out = pts.map((p) => { const f = forward(p, L), q = inverse(f.y, L); err = Math.max(err, Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])); ld += f.ld; return f.y; });
  return { out, err, meanLd: ld / pts.length };
}

export function CouplingViz() {
  const [L, setL] = useState(4);
  const { out, err, meanLd } = useMemo(() => stats(L), [L]);
  const W = 280, c = W / 2, s = W / 8;
  const lines: P[][] = [];
  for (let v = -2; v <= 2; v += 1) {
    lines.push(Array.from({ length: 61 }, (_, i) => forward([-3 + (i * 6) / 60, v], L).y));
    lines.push(Array.from({ length: 61 }, (_, i) => forward([v, -3 + (i * 6) / 60], L).y));
  }
  const path = (ps: P[]) => ps.map((p, i) => `${i ? "L" : "M"}${(c + s * p[0]).toFixed(1)},${(c - s * p[1]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">coupling layers</span>
        <div className="segmented" role="group" aria-label="Number of coupling layers">
          {[0, 1, 2, 3, 4].map((l) => <button key={l} type="button" className="seg" aria-pressed={L === l} onClick={() => setL(l)}>{l}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Samples and grid after coupling layers">
        <rect x={0} y={0} width={W} height={W} fill="var(--bg-subtle)" />
        {lines.map((ps, i) => <path key={i} d={path(ps)} fill="none" stroke="var(--border-strong)" strokeWidth={0.8} />)}
        {out.map((p, i) => <circle key={i} cx={c + s * p[0]} cy={c - s * p[1]} r={1.3} fill="var(--accent)" fillOpacity={0.55} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`mean log-determinant ${meanLd.toFixed(3)}; largest inversion error ${err.toExponential(1)}`}
      </div>
      <figcaption className="viz-caption">
        Samples from a standard normal and a square grid, pushed through affine coupling layers that alternate which
        coordinate is changed. Each layer shifts and rescales one coordinate by amounts that depend arbitrarily on the other,
        so a few layers bend the Gaussian into curved shapes, yet every layer inverts exactly by undoing the shift and scale,
        and its log-determinant is just the log of the scale.
      </figcaption>
    </figure>
  );
}
