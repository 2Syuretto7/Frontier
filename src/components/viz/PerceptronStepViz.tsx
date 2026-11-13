"use client";

import { useMemo, useState } from "react";

type P = [number, number, number];
const SEP: P[] = [[-1, 0.5, -1], [1, 3, 1], [0.5, -0.5, 1], [2.5, 2.5, 1], [-0.5, 1, -1], [2, -1, 1], [-2, 1, -1], [0, -2, -1], [-1.5, -2.5, -1]];
const XOR: P[] = [[-1.5, -1.5, -1], [1.5, 1.5, -1], [-1.5, 1.5, 1], [1.5, -1.5, 1]];

/** Run the perceptron one example at a time: on each mistake, w += y x. */
function trace(data: P[]) {
  let w = [0, 0, 0];
  const steps: { w: number[]; idx: number; mistake: boolean; epoch: number }[] = [];
  for (let e = 0; e < 8; e++) {
    let m = 0;
    data.forEach(([a, b, t], idx) => {
      const s = w[0] * a + w[1] * b + w[2];
      const mistake = t * s <= 0;
      if (mistake) { w = [w[0] + t * a, w[1] + t * b, w[2] + t]; m++; }
      steps.push({ w, idx, mistake, epoch: e });
    });
    if (m === 0) break;
  }
  return steps;
}

export function PerceptronStepViz() {
  const [which, setWhich] = useState<"sep" | "xor">("sep");
  const [k, setK] = useState(0);
  const data = which === "sep" ? SEP : XOR;
  const steps = useMemo(() => trace(data), [data]);
  const s = steps[Math.min(k, steps.length - 1)];
  const W = 260, sc = 36, c = W / 2;
  const X = (x: number) => c + x * sc, Y = (y: number) => c - y * sc;
  const [w0, w1, b] = s.w;
  let line: string | null = null;
  if (Math.abs(w1) > 1e-9) line = `${X(-4)},${Y((-b - w0 * -4) / w1)} ${X(4)},${Y((-b - w0 * 4) / w1)}`;
  else if (Math.abs(w0) > 1e-9) line = `${X(-b / w0)},${Y(-4)} ${X(-b / w0)},${Y(4)}`;
  const mistakesSoFar = steps.slice(0, k + 1).filter((t) => t.mistake).length;
  const done = k >= steps.length - 1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={which === "sep"} onClick={() => { setWhich("sep"); setK(0); }}>separable</button>
        <button type="button" className="seg" aria-pressed={which === "xor"} onClick={() => { setWhich("xor"); setK(0); }}>XOR</button>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Points and the perceptron's current decision line">
        <defs><clipPath id="pst-clip"><rect x={0} y={0} width={W} height={W} /></clipPath></defs>
        <rect x={0} y={0} width={W} height={W} fill="none" stroke="var(--border)" />
        <line x1={0} x2={W} y1={c} y2={c} stroke="var(--border)" />
        <line y1={0} y2={W} x1={c} x2={c} stroke="var(--border)" />
        {line && <polyline points={line} stroke="var(--accent)" strokeWidth={2} clipPath="url(#pst-clip)" />}
        {data.map(([a, bb, t], i) => (
          <g key={i}>
            {t > 0 ? <circle cx={X(a)} cy={Y(bb)} r={6} fill="var(--accent)" /> : <rect x={X(a) - 6} y={Y(bb) - 6} width={12} height={12} fill="var(--text-muted)" />}
            {i === s.idx && <circle cx={X(a)} cy={Y(bb)} r={11} fill="none" stroke={s.mistake ? "var(--danger)" : "var(--text)"} strokeWidth={2} />}
          </g>
        ))}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => setK(Math.min(steps.length - 1, k + 1))} disabled={done}>Next example</button>
        <button type="button" className="btn" onClick={() => setK(steps.length - 1)}>Run</button>
        <button type="button" className="btn" onClick={() => setK(0)}>Reset</button>
      </div>
      <div className="mono" style={{ fontSize: 13 }}>
        epoch {s.epoch + 1}, w = ({w0}, {w1}), b = {b}, mistakes so far {mistakesSoFar}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Circles are labelled +1, squares −1. The ringed point is the one being checked; a red ring is a mistake, and the
        update w ← w + y·x tilts the line towards classifying it correctly.{" "}
        {which === "sep"
          ? done ? `A whole epoch with no mistakes: the perceptron has converged after ${mistakesSoFar} updates.` : "On separable data the mistakes must stop."
          : done ? "After 8 epochs there is still a mistake in every epoch. No line separates XOR, so the perceptron cycles for ever." : "No single line can put both circles on one side and both squares on the other."}
      </figcaption>
    </figure>
  );
}
