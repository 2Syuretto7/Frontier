"use client";

import { useState } from "react";

const N = 24, PS = [1, 2, 3, 4], STEPS = [0, 1, 5, 20, 100];
const COLORS = ["var(--accent)", "var(--success)", "var(--text-muted)", "var(--danger)"];
const initial = (): number[] => Array.from({ length: N }, (_, i) => (i >= 6 && i < 10 ? 1 : 0));

const ranges = (p: number) => {
  const q = Math.floor(N / p), r = N % p, out: [number, number][] = [];
  let s = 0;
  for (let k = 0; k < p; k++) { const e = s + q + (k < r ? 1 : 0); out.push([s, e]); s = e; }
  return out;
};

/** Jacobi smoothing u[i] <- (u[i-1] + u[i+1]) / 2 with zero boundaries, run SPMD on p ranks with halo exchange. */
export function spmdJacobi(p: number, steps: number) {
  let blocks = ranges(p).map(([s, e]) => initial().slice(s, e));
  let sent = 0;
  for (let t = 0; t < steps; t++) {
    const padded = blocks.map((b, r) => [r > 0 ? blocks[r - 1][blocks[r - 1].length - 1] : 0, ...b, r + 1 < p ? blocks[r + 1][0] : 0]);
    sent += 2 * (p - 1);
    blocks = padded.map((b) => b.slice(1, -1).map((_, i) => (b[i] + b[i + 2]) / 2));
  }
  return { u: blocks.flat(), sent };
}

export function serialJacobi(steps: number) {
  let u = initial();
  for (let t = 0; t < steps; t++) u = u.map((_, i) => ((i ? u[i - 1] : 0) + (i < N - 1 ? u[i + 1] : 0)) / 2);
  return u;
}

export function SpmdStencilViz() {
  const [pi, setPi] = useState(2), [si, setSi] = useState(1);
  const p = PS[pi], steps = STEPS[si], { u, sent } = spmdJacobi(p, steps), ser = serialJacobi(steps);
  const diff = Math.max(...u.map((x, i) => Math.abs(x - ser[i])));
  const W = 330, H = 150, X0 = 26, Y0 = 8, PW = W - 32, PH = H - Y0 - 30, bw = PW / N;
  const sy = (v: number) => Y0 + PH - v * PH;
  const rs = ranges(p), owner = (i: number) => rs.findIndex(([s, e]) => i >= s && i < e);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">ranks</span>
        <div className="segmented" role="group" aria-label="Number of ranks">
          {PS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{x}</button>)}
        </div>
        <span className="viz-label">steps</span>
        <div className="segmented" role="group" aria-label="Number of steps">
          {STEPS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Values on a line of cells, coloured by the rank that owns them">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={sy(v)} y2={sy(v)} stroke="var(--border)" strokeDasharray={v ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {u.map((v, i) => <rect key={i} x={X0 + i * bw + 1} y={sy(v)} width={bw - 2} height={Y0 + PH - sy(v)} fill={COLORS[owner(i)]} />)}
        {rs.slice(1).map(([s]) => <line key={s} x1={X0 + s * bw} x2={X0 + s * bw} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="3 3" />)}
        {rs.map(([s, e], r) => <text key={r} x={X0 + ((s + e) / 2) * bw} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`rank ${r}`}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">cells, coloured by owner</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`values exchanged ${sent}; largest difference from the serial run ${diff === 0 ? "0" : diff.toExponential(0)}`}
      </div>
      <figcaption className="viz-caption">
        Every rank runs the same program on its own block of 24 cells: copy one boundary value from each neighbour into a ghost
        cell, then replace each cell by the mean of its two neighbours. The result is identical to the serial computation,
        to the last bit, for every number of ranks, because each rank sees exactly the values the serial loop would. The cost
        is communication: each step exchanges two values for every internal boundary, 2(p − 1) in all.
      </figcaption>
    </figure>
  );
}
