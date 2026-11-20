"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Cls = "thresholds" | "intervals";
const DRAWS = 300;

/** Best correlation (1/m) Σ σ_i h(x_i) over ±1-valued thresholds (either orientation) or intervals, points in sorted order. */
export function bestFit(sig: number[], cls: Cls) {
  const m = sig.length, P = [0];
  sig.forEach((s) => P.push(P[P.length - 1] + s));
  const total = P[m];
  let best = -Infinity, arg: [number, number] = [0, 0];
  if (cls === "thresholds") {
    // h = -1 on the first k points and +1 after, or the reverse.
    for (let k = 0; k <= m; k++) { const v = total - 2 * P[k]; if (Math.abs(v) > best) { best = Math.abs(v); arg = v >= 0 ? [k, m] : [0, k]; } }
  } else {
    // h = +1 on points i..j-1 and -1 elsewhere (empty interval allowed).
    for (let i = 0; i <= m; i++) for (let j = i; j <= m; j++) { const v = 2 * (P[j] - P[i]) - total; if (v > best) { best = v; arg = [i, j]; } }
  }
  return { value: best / m, arg };
}

export function complexity(m: number, cls: Cls, seed: number) {
  const r = rand(seed);
  let sum = 0;
  for (let k = 0; k < DRAWS; k++) sum += bestFit(Array.from({ length: m }, () => (r() < 0.5 ? -1 : 1)), cls).value;
  return sum / DRAWS;
}

const MS = [10, 40, 160];
const labellings = (m: number, cls: Cls) => (cls === "thresholds" ? 2 * m : 1 + (m * (m + 1)) / 2);

export function RademacherViz() {
  const [cls, setCls] = useState<Cls>("thresholds");
  const [mi, setMi] = useState(0);
  const [draw, setDraw] = useState(1);
  const m = MS[mi];
  const sig = useMemo(() => { const r = rand(100 + draw); return Array.from({ length: m }, () => (r() < 0.5 ? -1 : 1)); }, [m, draw]);
  const fit = bestFit(sig, cls);
  const avg = useMemo(() => complexity(m, cls, 9), [m, cls]);
  const massart = Math.sqrt((2 * Math.log(labellings(m, cls))) / m);
  const W = 320, H = 90, X0 = 10, PW = 300;
  const sx = (i: number) => X0 + ((i + 0.5) / m) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Hypothesis class">
          {(["thresholds", "intervals"] as Cls[]).map((c) => <button key={c} type="button" className="seg" aria-pressed={cls === c} onClick={() => setCls(c)}>{c}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of points">
          {MS.map((k, i) => <button key={k} type="button" className="seg" aria-pressed={mi === i} onClick={() => setMi(i)}>m = {k}</button>)}
        </div>
        <button type="button" className="btn" onClick={() => setDraw((d) => d + 1)}>new signs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Random signs and the hypothesis that best matches them">
        <rect x={X0 + (fit.arg[0] / m) * PW} y={10} width={((fit.arg[1] - fit.arg[0]) / m) * PW} height={70} fill="var(--accent)" fillOpacity={0.15} />
        <line x1={X0} x2={X0 + PW} y1={45} y2={45} stroke="var(--border)" />
        {sig.map((s, i) => <circle key={i} cx={sx(i)} cy={s > 0 ? 25 : 65} r={Math.min(4, 120 / m)} fill={s > 0 ? "var(--accent)" : "var(--code-function)"} />)}
        <text x={X0} y={8} className="viz-label">σ = +1</text>
        <text x={X0} y={H - 1} className="viz-label">σ = −1</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        this draw: best correlation {fit.value.toFixed(3)}; average over {DRAWS} draws {avg.toFixed(3)}; Massart bound {massart.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Points in a row receive random signs, and the shaded region is where the best hypothesis in the class predicts +1.
        Its average correlation with pure noise is the empirical Rademacher complexity. Intervals, being richer, fit noise
        better than thresholds; both fall roughly like 1/√m, and Massart&apos;s bound from the number of labellings sits above
        them: at m = 160 intervals reach 0.183 against a bound of 0.344.
      </figcaption>
    </figure>
  );
}
