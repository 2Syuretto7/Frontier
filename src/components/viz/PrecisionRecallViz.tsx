"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type P = [number, number];
const N = 400, K = 3;

/** n points from a mixture of Gaussians at the given angles on the unit circle, plus a fraction of uniform junk. */
export function ring(n: number, angles: number[], sd: number, junk: number, seed: number): P[] {
  const r = rand(seed);
  const nrm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: n }, () => {
    if (r() < junk) return [3 * r() - 1.5, 3 * r() - 1.5] as P;
    const a = angles[Math.floor(r() * angles.length)];
    return [Math.cos(a) + sd * nrm(), Math.sin(a) + sd * nrm()] as P;
  });
}

const d2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/** Fraction of `test` points inside the k-nearest-neighbour ball of some `ref` point. */
export function coverage(ref: P[], test: P[], k: number) {
  const rad = ref.map((p) => ref.map((q) => d2(p, q)).sort((a, b) => a - b)[k]);
  return test.filter((t) => ref.some((p, i) => d2(p, t) <= rad[i])).length / test.length;
}

/** Fréchet distance between Gaussians fitted to two 2-D samples. */
export function frechet(a: P[], b: P[]) {
  const stats = (s: P[]) => {
    const m = [0, 1].map((j) => s.reduce((acc, p) => acc + p[j], 0) / s.length);
    const c = [0, 1].map((i) => [0, 1].map((j) => s.reduce((acc, p) => acc + (p[i] - m[i]) * (p[j] - m[j]), 0) / s.length));
    return { m, c };
  };
  const A = stats(a), B = stats(b);
  const M = [[0, 0], [0, 0]].map((row, i) => row.map((_, j) => A.c[i][0] * B.c[0][j] + A.c[i][1] * B.c[1][j]));
  const trSqrt = Math.sqrt(M[0][0] + M[1][1] + 2 * Math.sqrt(M[0][0] * M[1][1] - M[0][1] * M[1][0]));
  return (A.m[0] - B.m[0]) ** 2 + (A.m[1] - B.m[1]) ** 2 + A.c[0][0] + A.c[1][1] + B.c[0][0] + B.c[1][1] - 2 * trSqrt;
}

const EIGHT = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
export const MODELS: [string, () => P[]][] = [
  ["faithful", () => ring(N, EIGHT, 0.1, 0, 2)],
  ["4 of 8 modes", () => ring(N, EIGHT.filter((_, i) => i % 2 === 0), 0.1, 0, 3)],
  ["blurry", () => ring(N, EIGHT, 0.3, 0, 4)],
  ["20% junk", () => ring(N, EIGHT, 0.1, 0.2, 5)],
];
export const realData = () => ring(N, EIGHT, 0.1, 0, 1);

export function PrecisionRecallViz() {
  const [mi, setMi] = useState(1);
  const real = useMemo(realData, []);
  const fake = useMemo(() => MODELS[mi][1](), [mi]);
  const prec = useMemo(() => coverage(real, fake, K), [real, fake]);
  const rec = useMemo(() => coverage(fake, real, K), [real, fake]);
  const fd = useMemo(() => frechet(real, fake), [real, fake]);
  const W = 240, c = W / 2, s = W / 3.4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">model</span>
        <div className="segmented" role="group" aria-label="Model samples" style={{ flexWrap: "wrap" }}>
          {MODELS.map(([name], i) => <button key={name} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }} role="img" aria-label="Real and generated samples">
        <rect x={0} y={0} width={W} height={W} fill="var(--bg-subtle)" />
        {real.map((p, i) => <circle key={`r${i}`} cx={c + s * p[0]} cy={c - s * p[1]} r={1.6} fill="var(--text-muted)" fillOpacity={0.6} />)}
        {fake.map((p, i) => <circle key={`f${i}`} cx={c + s * p[0]} cy={c - s * p[1]} r={1.6} fill="var(--accent)" fillOpacity={0.7} />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--text-muted)" }}>●</span> data</span>
        <span><span style={{ color: "var(--accent)" }}>●</span> model samples</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`precision ${prec.toFixed(2)}, recall ${rec.toFixed(2)}, Fréchet distance ${fd.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Precision is the fraction of model samples that land near some data point (inside the ball reaching its third nearest
        data neighbour); recall is the fraction of data points near some model sample. The faithful model scores 0.97 on both.
        Dropping half the modes keeps precision at 0.94 but recall falls to 0.51. Blurry samples lose precision (0.44) and keep
        recall; 20% junk lowers precision alone, to 0.79. The Fréchet distance between Gaussians fitted to the two samples stays
        below 0.012 for all four, because evenly spaced modes have almost the same mean and covariance whichever are kept: a
        single number computed from weak features can miss exactly the failures that matter.
      </figcaption>
    </figure>
  );
}
