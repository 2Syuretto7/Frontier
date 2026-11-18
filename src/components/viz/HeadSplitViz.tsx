"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const N = 8, DT = 4, BETA = 8;

function softmax(s: number[]) {
  const m = Math.max(...s), e = s.map((v) => Math.exp(v - m)), t = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / t);
}

/**
 * Target at position i: [x_(i-1), x_0], the previous token and the first token (x_(-1) := x_0).
 * Two heads: one query picks out position i - 1, the other position 0. One head: a single query scores both.
 * Returns the attention maps and the mean squared error of the output against the target.
 */
export function copyTask(heads: 1 | 2, seed = 12) {
  const z = makeNormal(makeRng(seed));
  const X = Array.from({ length: N }, () => Array.from({ length: DT }, z));
  const prev = (i: number) => Math.max(i - 1, 0);
  const sPrev = (i: number) => Array.from({ length: N }, (_, j) => (j === prev(i) ? BETA : 0));
  const sFirst = () => Array.from({ length: N }, (_, j) => (j === 0 ? BETA : 0));
  const mix = (w: number[]) => Array.from({ length: DT }, (_, c) => w.reduce((a, wj, j) => a + wj * X[j][c], 0));
  const maps = heads === 2
    ? [Array.from({ length: N }, (_, i) => softmax(sPrev(i))), Array.from({ length: N }, () => softmax(sFirst()))]
    : [Array.from({ length: N }, (_, i) => softmax(sPrev(i).map((v, j) => v + sFirst()[j])))];
  let err = 0;
  for (let i = 0; i < N; i++) {
    const out = heads === 2 ? [...mix(maps[0][i]), ...mix(maps[1][i])] : [...mix(maps[0][i]), ...mix(maps[0][i])];
    const target = [...X[prev(i)], ...X[0]];
    err += out.reduce((a, v, c) => a + (v - target[c]) ** 2, 0) / (2 * DT);
  }
  return { maps, mse: err / N };
}

function Heat({ A, x0, label }: { A: number[][]; x0: number; label: string }) {
  const C = 16;
  return (
    <g>
      <text x={x0 + (N * C) / 2} y={12} textAnchor="middle" className="viz-label">{label}</text>
      {A.map((row, i) => row.map((w, j) => (
        <rect key={`${i}-${j}`} x={x0 + j * C} y={20 + i * C} width={C - 1.5} height={C - 1.5} fill="var(--accent)" fillOpacity={Math.max(0.04, w)} stroke="var(--border)" strokeWidth={0.5} />
      )))}
    </g>
  );
}

export function HeadSplitViz() {
  const [heads, setHeads] = useState<1 | 2>(2);
  const [res, setRes] = useState<ReturnType<typeof copyTask> | null>(null);
  useEffect(() => setRes(copyTask(heads)), [heads]);
  const W = 300, H = 20 + N * 16 + 6;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {([1, 2] as const).map((h) => (
          <button key={h} type="button" className="seg" aria-pressed={h === heads} onClick={() => setHeads(h)}>{h === 1 ? "one head" : "two heads"}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Attention maps of one head or two heads on a task that needs the previous token and the first token">
        {res && res.maps.length === 2 && (
          <>
            <Heat A={res.maps[0]} x0={14} label="head 1: previous token" />
            <Heat A={res.maps[1]} x0={158} label="head 2: first token" />
          </>
        )}
        {res && res.maps.length === 1 && <Heat A={res.maps[0]} x0={86} label="single head: both at once" />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {res ? `mean squared error of the output: ${res.mse.toFixed(3)}` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each position (row) must output two things: the previous token and the first token of the sequence. With two heads,
        one attends one step back and the other to position 0, and the output is exact apart from softmax leakage. A single
        head with the same total width has one set of weights per row, so it must split them between the two targets and
        returns their average for both halves of the output.
      </figcaption>
    </figure>
  );
}
