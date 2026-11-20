"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const TYPES = 60, PER = 8, NOISE = 0.5;

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, r()))) * Math.cos(2 * Math.PI * r());
}

/** Solves A x = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * Sixty word types, each with a random d-dimensional embedding; every token of a type is its embedding plus noise. The real label of
 * a type is the sign of a fixed linear function of its embedding; the control label is a random label fixed per type. Probes train on
 * eight tokens of each type and are tested on eight fresh tokens of the same types.
 */
export function probeRun(d: number, probe: "linear" | "neighbour", seed = 5) {
  const r = rand(seed + d);
  const emb = Array.from({ length: TYPES }, () => Array.from({ length: d }, () => gauss(r)));
  const u = Array.from({ length: d }, () => gauss(r));
  const real = emb.map((e) => (e.reduce((s, x, i) => s + x * u[i], 0) > 0 ? 1 : 0));
  const ctrl = emb.map(() => (r() < 0.5 ? 1 : 0));
  const tokens = (n: number) => emb.flatMap((e, t) => Array.from({ length: n }, () => ({ t, x: e.map((v) => v + NOISE * gauss(r)) })));
  const train = tokens(PER), test = tokens(PER);
  const acc = (labels: number[]) => {
    let predict: (x: number[]) => number;
    if (probe === "linear") {
      // Least squares on labels of plus or minus one, with a small ridge term, then threshold at zero.
      const k = d + 1, A = Array.from({ length: k }, () => new Array(k).fill(0)), b = new Array(k).fill(0);
      for (const { t, x } of train) {
        const z = [...x, 1], y = labels[t] ? 1 : -1;
        for (let i = 0; i < k; i++) { b[i] += z[i] * y; for (let j = 0; j < k; j++) A[i][j] += z[i] * z[j]; }
      }
      for (let i = 0; i < k; i++) A[i][i] += 1e-3;
      const w = solve(A, b);
      predict = (x) => (x.reduce((s, v, i) => s + v * w[i], w[d]) > 0 ? 1 : 0);
    } else {
      predict = (x) => {
        let best = Infinity, lab = 0;
        for (const p of train) {
          let s = 0;
          for (let i = 0; i < d; i++) s += (p.x[i] - x[i]) ** 2;
          if (s < best) { best = s; lab = labels[p.t]; }
        }
        return lab;
      };
    }
    return test.filter(({ t, x }) => predict(x) === labels[t]).length / test.length;
  };
  return { real: acc(real), control: acc(ctrl) };
}

const DIMS = [4, 16, 64];
const PROBES: { key: "linear" | "neighbour"; name: string }[] = [
  { key: "linear", name: "linear probe" },
  { key: "neighbour", name: "nearest neighbour" },
];

export function ProbeSelectivityViz() {
  const [d, setD] = useState(1);
  const [p, setP] = useState(0);
  const { real, control } = probeRun(DIMS[d], PROBES[p].key);
  const W = 330, H = 120, X0 = 100, PW = 200;
  const rows = [
    { name: "real task", v: real, col: "var(--accent)" },
    { name: "control task", v: control, col: "var(--text-muted)" },
  ];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Dimension of the activations">
          {DIMS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={d === i} onClick={() => setD(i)}>{v} dims</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Probe">
          {PROBES.map((x, i) => <button key={x.key} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>{x.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probe accuracy on the real task and on the control task">
        {[0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0 + v * PW} x2={X0 + v * PW} y1={8} y2={84} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 + v * PW} y={98} textAnchor="middle" className="viz-label">{v === 0.5 ? "chance" : "1.0"}</text>
          </g>
        ))}
        {rows.map((row, i) => (
          <g key={row.name}>
            <text x={X0 - 8} y={30 + i * 38} textAnchor="end" className="viz-label">{row.name}</text>
            <rect x={X0} y={16 + i * 38} width={row.v * PW} height={20} style={{ fill: row.col }} />
          </g>
        ))}
        <line x1={X0} x2={X0} y1={8} y2={84} stroke="var(--border-strong)" />
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">test accuracy on fresh tokens</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        real {real.toFixed(3)}, control {control.toFixed(3)}, selectivity {(real - control).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Real runs on synthetic activations for sixty word types. The real label is a linear function of each type&apos;s embedding; the
        control label is assigned at random to each type, so it can be learned only by memorising types. A probe that does well on
        the control task is measuring its own capacity, not the representation. With more dimensions, or a more flexible probe, control
        accuracy rises and selectivity falls.
      </figcaption>
    </figure>
  );
}
