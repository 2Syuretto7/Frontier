"use client";

import { useState } from "react";

const PS = [0.9, 0.99, 0.999];
const CS = [0, 1e-5, 1e-4];
const NMAX = 1024;

/** Speed-up on n workers: Amdahl with an overhead c(n − 1) per run, and Gustafson's scaled speed-up. */
export function speedups(p: number, c: number, n: number) {
  return { amdahl: 1 / ((1 - p) + p / n + c * (n - 1)), gustafson: (1 - p) + p * n };
}

export function bestN(p: number, c: number) {
  let best = 1, bt = Infinity;
  for (let n = 1; n <= NMAX; n++) {
    const t = (1 - p) + p / n + c * (n - 1);
    if (t < bt) { bt = t; best = n; }
  }
  return best;
}

export function ParallelSpeedupViz() {
  const [pi, setPi] = useState(1);
  const [ci, setCi] = useState(0);
  const p = PS[pi], c = CS[ci];
  const W = 320, H = 200, X0 = 40, Y0 = 10, PW = W - X0 - 10, PH = H - Y0 - 30;
  const lx = (n: number) => X0 + (Math.log2(n) / 10) * PW;
  const ly = (s: number) => Y0 + PH - (Math.log2(Math.max(s, 1)) / 10) * PH;
  const ns = Array.from({ length: 101 }, (_, i) => 2 ** (i / 10));
  const path = (f: (n: number) => number) => ns.map((n, i) => `${i ? "L" : "M"}${lx(n).toFixed(1)},${ly(f(n)).toFixed(1)}`).join(" ");
  const nb = bestN(p, c), sb = speedups(p, c, nb).amdahl;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">parallel fraction p</span>
        {PS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{v}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">overhead per extra worker</span>
        {CS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{v === 0 ? "none" : v.toExponential(0)}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Speed-up against number of workers on log scales">
        {[1, 32, 1024].map((v) => (
          <g key={v}>
            <line x1={X0} x2={W - 10} y1={ly(v)} y2={ly(v)} stroke="var(--border)" />
            <text x={X0 - 4} y={ly(v) + 4} textAnchor="end" className="viz-label">{v}</text>
            <text x={lx(v)} y={H - 10} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={path((n) => n)} fill="none" stroke="var(--border)" strokeDasharray="4 3" />
        <line x1={X0} x2={W - 10} y1={ly(1 / (1 - p))} y2={ly(1 / (1 - p))} stroke="var(--text-muted)" strokeDasharray="4 3" />
        <path d={path((n) => speedups(p, c, n).gustafson)} fill="none" stroke="var(--success)" strokeWidth={2} />
        <path d={path((n) => speedups(p, c, n).amdahl)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={lx(nb)} cy={ly(sb)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`limit 1/(1 − p) = ${(1 / (1 - p)).toFixed(0)}; best fixed-size speed-up ${sb.toFixed(1)} at ${nb} workers`}
      </div>
      <figcaption className="viz-caption">
        Speed-up against the number of workers, both on log scales. Blue is Amdahl&apos;s law for a fixed problem, which
        flattens towards 1/(1 − p) (dashed grey) however many workers are added; with an overhead that grows with the number
        of workers it turns down, and the red dot marks the best count. Green is Gustafson&apos;s view, in which the problem
        grows with the machine and the serial part stays fixed, so the speed-up keeps rising nearly in step with the dashed
        diagonal of perfect scaling.
      </figcaption>
    </figure>
  );
}
