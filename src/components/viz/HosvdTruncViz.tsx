"use client";

import { useState } from "react";
import { symEig, type Mat } from "./la";

const N = 8;
type T3 = number[][][];
const make = (f: (i: number, j: number, k: number) => number): T3 =>
  Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => Array.from({ length: N }, (_, k) => f(i, j, k))));
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) - 0.5;
const DATA: Record<string, T3> = {
  smooth: make((i, j, k) => 1 / (1 + i + j + k)),
  random: make(() => rnd()),
};
const get = (t: T3, m: number, a: number, b: number, c: number) => (m === 0 ? t[a][b][c] : m === 1 ? t[b][a][c] : t[b][c][a]);
const fro = (t: T3) => Math.sqrt(t.flat(2).reduce((s, v) => s + v * v, 0));

// Gram matrix of the mode-m unfolding, and its eigenvalues / eigenvectors (squared singular values, left singular vectors)
function modeEig(t: T3, m: number) {
  const G: Mat = Array.from({ length: N }, () => Array(N).fill(0));
  for (let a = 0; a < N; a++) for (let a2 = 0; a2 < N; a2++) {
    let s = 0;
    for (let b = 0; b < N; b++) for (let c = 0; c < N; c++) s += get(t, m, a, b, c) * get(t, m, a2, b, c);
    G[a][a2] = s;
  }
  return symEig(G);
}
// multiply mode m by the projection P (N×N)
function project(t: T3, m: number, P: Mat): T3 {
  return make((i, j, k) => {
    const idx = [i, j, k];
    let s = 0;
    for (let q = 0; q < N; q++) {
      const id = [...idx];
      id[m] = q;
      s += P[idx[m]][q] * t[id[0]][id[1]][id[2]];
    }
    return s;
  });
}
function curves(t: T3) {
  const nt = fro(t), eigs = [0, 1, 2].map((m) => modeEig(t, m));
  const out: { r: number; err: number; upper: number; lower: number }[] = [];
  for (let r = 1; r <= N; r++) {
    let h = t;
    eigs.forEach((e, m) => {
      const U = e.vectors.map((row) => row.slice(0, r));
      const P = U.map((ri) => U.map((rj) => ri.reduce((s, v, k) => s + v * rj[k], 0)));
      h = project(h, m, P);
    });
    let d = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) d += (t[i][j][k] - h[i][j][k]) * (t[i][j][k] - h[i][j][k]);
    const tails = eigs.map((e) => e.values.slice(r).reduce((s, v) => s + Math.max(0, v), 0));
    out.push({ r, err: Math.sqrt(d) / nt, upper: Math.sqrt(tails[0] + tails[1] + tails[2]) / nt, lower: Math.sqrt(Math.max(...tails)) / nt });
  }
  return out;
}
const CURVES = { smooth: curves(DATA.smooth), random: curves(DATA.random) };

/** Relative error of truncated HOSVD against the multilinear rank, with the √(sum of tails) upper bound and the max-tail lower bound for any Tucker approximation. */
export function HosvdTruncViz() {
  const [kind, setKind] = useState<"smooth" | "random">("smooth");
  const [r, setR] = useState(3);
  const cv = CURVES[kind];
  const W = 320, H = 170, lo = -8;
  const X = (q: number) => 40 + ((q - 1) / (N - 1)) * (W - 56);
  const Y = (v: number) => 10 + (Math.min(0, Math.max(lo, Math.log10(Math.max(v, 1e-12)))) / lo) * (H - 34);
  const line = (key: "err" | "upper" | "lower") => cv.map((p) => `${X(p.r).toFixed(1)},${Y(p[key]).toFixed(1)}`).join(" ");
  const cur = cv[r - 1];
  const e = (v: number) => (v < 1e-8 ? "below 1e-8" : v.toExponential(2));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "smooth"} onClick={() => setKind("smooth")}>1/(1+i+j+k)</button>
        <button type="button" className="seg" aria-pressed={kind === "random"} onClick={() => setKind("random")}>random</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          ranks ({r}, {r}, {r})
          <input type="range" min={1} max={N} value={r} onChange={(ev) => setR(Number(ev.target.value))} aria-label="multilinear rank" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Relative error of truncated HOSVD against rank, log scale">
        {[0, -2, -4, -6, -8].map((l) => (
          <g key={l}>
            <line x1={40} x2={W - 10} y1={Y(10 ** l)} y2={Y(10 ** l)} stroke="var(--border)" />
            <text x={36} y={Y(10 ** l) + 4} textAnchor="end" className="viz-label">1e{l}</text>
          </g>
        ))}
        {cv.map((p) => <text key={p.r} x={X(p.r)} y={H - 6} textAnchor="middle" className="viz-label">{p.r}</text>)}
        <polyline fill="none" stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1.6} points={line("upper")} />
        <polyline fill="none" stroke="var(--text-muted)" strokeDasharray="2 3" strokeWidth={1.6} points={line("lower")} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} points={line("err")} />
        <circle cx={X(r)} cy={Y(cur.err)} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        HOSVD error {e(cur.err)}; best possible at least {e(cur.lower)}; bound {e(cur.upper)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        An 8×8×8 tensor truncated to multilinear rank (r, r, r) by HOSVD. Blue: the actual relative error. Red dashes: the
        upper bound, the square root of the summed discarded squared singular values of all three unfoldings. Grey dots: a
        lower bound for every Tucker approximation of that rank, the largest single-mode tail. Blue always sits between, so
        HOSVD is within a factor √3 of the best. The smooth tensor is compressible, the random one is not.
      </figcaption>
    </figure>
  );
}
