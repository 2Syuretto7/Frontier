"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

/** A random generator whose whole state is one number, so it can be saved and restored like bit_generator.state. */
type Gen = { s: number };
function next(g: Gen) {
  g.s = (g.s + 0x6d2b79f5) >>> 0;
  let t = g.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const normal = makeNormal(makeRng(42));
const X = Array.from({ length: 12 }, () => [normal(), normal(), normal()]);
const TRUE = [1, -2, 0.5];
const Y = X.map((x) => x[0] * TRUE[0] + x[1] * TRUE[1] + x[2] * TRUE[2]);

type State = { w: number[]; m: number[]; step: number; seed: number; rng: Gen };
const init = (seed: number): State => ({ w: [0, 0, 0], m: [0, 0, 0], step: 0, seed, rng: { s: seed * 7919 + 1 } });
const save = (s: State): State => ({ w: [...s.w], m: [...s.m], step: s.step, seed: s.seed, rng: { s: s.rng.s } });

function perm(seed: number) {
  const r = makeRng(seed), p = Array.from({ length: 12 }, (_, i) => i);
  for (let i = 11; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/** One step of momentum SGD on a batch of 4, with the order fixed by seed and epoch and an input dropout mask from the state's generator. */
export function step(s: State) {
  const epoch = Math.floor(s.step / 3), k = s.step % 3;
  const idx = perm(s.seed * 1000 + epoch).slice(4 * k, 4 * k + 4);
  const keep = [0, 1, 2].map(() => (next(s.rng) > 0.2 ? 1 / 0.8 : 0));
  const g = [0, 0, 0];
  for (const i of idx) {
    const xb = X[i].map((v, j) => v * keep[j]);
    const r = xb[0] * s.w[0] + xb[1] * s.w[1] + xb[2] * s.w[2] - Y[i];
    for (let j = 0; j < 3; j++) g[j] += (xb[j] * r) / 4;
  }
  for (let j = 0; j < 3; j++) {
    s.m[j] = 0.9 * s.m[j] + g[j];
    s.w[j] -= 0.05 * s.m[j];
  }
  s.step += 1;
}

export type Drop = "m" | "rng" | "step";

/** Largest weight difference between an uninterrupted run and one resumed at `stop` from a checkpoint missing `drop`, at each step. */
export function gaps(total: number, stop: number, drop: Drop[]) {
  const a = init(0), b = init(0);
  for (let i = 0; i < stop; i++) {
    step(a);
    step(b);
  }
  const c = save(b), fresh = init(0);
  if (drop.includes("m")) c.m = fresh.m;
  if (drop.includes("rng")) c.rng = fresh.rng;
  if (drop.includes("step")) c.step = 0;
  const out: number[] = [];
  for (let i = stop; i < total; i++) {
    step(a);
    step(c);
    out.push(Math.max(...a.w.map((v, j) => Math.abs(v - c.w[j]))));
  }
  return out;
}

const OPTIONS: { label: string; drop: Drop[] }[] = [
  { label: "full checkpoint", drop: [] },
  { label: "no optimiser state", drop: ["m"] },
  { label: "no RNG state", drop: ["rng"] },
  { label: "no step counter", drop: ["step"] },
];
const TOTAL = 120, STOP = 30;

export function ResumeGapViz() {
  const [k, setK] = useState(2);
  const g = gaps(TOTAL, STOP, OPTIONS[k].drop);
  const W = 300, H = 150, X0 = 34, PW = W - 42, PH = 120, YMAX = 2.6;
  const sx = (i: number) => X0 + (i / TOTAL) * PW, sy = (v: number) => 8 + (1 - Math.min(v, YMAX) / YMAX) * PH;
  const last = g[g.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {OPTIONS.map((o, i) => (
          <button key={o.label} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{o.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Weight difference between a resumed run and an uninterrupted run">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(STOP)} y1={8} x2={sx(STOP)} y2={8 + PH} stroke="var(--text-muted)" strokeDasharray="3 2" />
        <text x={sx(STOP) + 4} y={18} className="viz-label">resume</text>
        <polyline fill="none" stroke={last === 0 ? "var(--accent)" : "var(--danger)"} strokeWidth={2} points={g.map((v, i) => `${sx(STOP + i + 1)},${sy(v)}`).join(" ")} />
        {[0, 1, 2].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[0, 30, 60, 90, 120].map((i) => (
          <text key={i} x={sx(i)} y={H + 12} textAnchor="middle" className="viz-label">{i}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {last === 0 ? "weights identical to the last bit at every step" : `largest weight difference at step ${TOTAL}: ${last.toFixed(4)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A small regression trained with momentum and input dropout is stopped at step 30 and resumed from a checkpoint,
        then compared with a run that never stopped. Saving weights, momentum, the step counter and the random generator&apos;s
        state makes the two runs identical. Dropping the momentum buffer gives a difference that the optimiser slowly
        forgets; dropping the generator state replays old dropout masks, and resetting the step counter replays the first
        epoch&apos;s data order, and neither of these fades away.
      </figcaption>
    </figure>
  );
}
