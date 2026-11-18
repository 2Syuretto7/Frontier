"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const NU = 12, NI = 10, D = 2, LR = 0.05, LAM = 0.02;
const genreI = (i: number) => (i < 5 ? 0 : 1), genreU = (u: number) => (u < 6 ? 0 : 1);

/** Ratings +1 when a user's taste matches an item's genre, -1 otherwise, with a fixed 60% of entries observed. */
export function problem(seed: number) {
  const rng = makeRng(seed);
  const R = Array.from({ length: NU }, (_, u) => Array.from({ length: NI }, (_, i) => (genreU(u) === genreI(i) ? 1 : -1)));
  const M = Array.from({ length: NU }, () => Array.from({ length: NI }, () => (rng() < 0.6 ? 1 : 0)));
  return { R, M };
}

export function init(seed: number) {
  const z = makeNormal(makeRng(seed));
  return { U: Array.from({ length: NU }, () => [0.3 * z(), 0.3 * z()]), V: Array.from({ length: NI }, () => [0.3 * z(), 0.3 * z()]) };
}

/** Full-batch gradient steps on the masked squared error with weight decay. */
export function train(U: number[][], V: number[][], R: number[][], M: number[][], steps: number) {
  for (let s = 0; s < steps; s++) {
    const gU = U.map(() => [0, 0]), gV = V.map(() => [0, 0]);
    for (let u = 0; u < NU; u++) for (let i = 0; i < NI; i++) {
      if (!M[u][i]) continue;
      const e = U[u][0] * V[i][0] + U[u][1] * V[i][1] - R[u][i];
      for (let k = 0; k < D; k++) { gU[u][k] += e * V[i][k]; gV[i][k] += e * U[u][k]; }
    }
    U = U.map((r, u) => r.map((v, k) => v - LR * (gU[u][k] + LAM * v)));
    V = V.map((r, i) => r.map((v, k) => v - LR * (gV[i][k] + LAM * v)));
  }
  return { U, V };
}

export function rmse(U: number[][], V: number[][], R: number[][], M: number[][], observed: boolean) {
  let s = 0, n = 0;
  for (let u = 0; u < NU; u++) for (let i = 0; i < NI; i++) {
    if ((M[u][i] === 1) !== observed) continue;
    s += (U[u][0] * V[i][0] + U[u][1] * V[i][1] - R[u][i]) ** 2; n++;
  }
  return Math.sqrt(s / n);
}

export function EmbeddingMfViz() {
  const [{ R, M }] = useState(() => problem(5));
  const [state, setState] = useState<{ U: number[][]; V: number[][]; step: number } | null>(null);
  useEffect(() => setState({ ...init(9), step: 0 }), []);
  const S = 220, sc = 55, c = S / 2;
  const clamp = (v: number) => Math.max(-1.9, Math.min(1.9, v));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" onClick={() => state && setState({ ...train(state.U, state.V, R, M, 20), step: state.step + 20 })}>train 20 steps</button>
        <button type="button" className="seg" onClick={() => state && setState({ ...train(state.U, state.V, R, M, 200), step: state.step + 200 })}>train 200 steps</button>
        <button type="button" className="seg" onClick={() => setState({ ...init(9), step: 0 })}>reset</button>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Two-dimensional embeddings of users and items during training">
        <line x1={0} y1={c} x2={S} y2={c} stroke="var(--border)" />
        <line x1={c} y1={0} x2={c} y2={S} stroke="var(--border)" />
        {state?.U.map(([a, b], u) => (
          <rect key={`u${u}`} x={c + clamp(a) * sc - 3} y={c - clamp(b) * sc - 3} width={6} height={6} fill="none" stroke={genreU(u) ? "var(--danger)" : "var(--accent)"} />
        ))}
        {state?.V.map(([a, b], i) => (
          <circle key={`i${i}`} cx={c + clamp(a) * sc} cy={c - clamp(b) * sc} r={4.5} fill={genreI(i) ? "var(--danger)" : "var(--accent)"} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {state ? `step ${state.step}: error on observed ratings ${rmse(state.U, state.V, R, M, true).toFixed(3)}, on held-out ratings ${rmse(state.U, state.V, R, M, false).toFixed(3)}` : "initialising"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Twelve users (squares) and ten items (dots), each given a random two-dimensional embedding, trained so that the dot
        product of a user and an item predicts the rating, using 60 per cent of the ratings. Nobody tells the model which items
        belong to which genre (colour), yet the items sort themselves into two groups, users point towards the group they like,
        and the held-out ratings are predicted too.
      </figcaption>
    </figure>
  );
}
