"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NPTS = 150, MU = [0.9, 0], ANG = Math.PI / 6, SD = [2.2, 0.5];

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

function bestAcc(pos: number[], neg: number[]) {
  const all = [...pos.map((s) => ({ s, y: 1 })), ...neg.map((s) => ({ s, y: 0 }))].sort((a, b) => a.s - b.s);
  let right = pos.length, best = 0;
  for (const p of all) {
    right += p.y ? -1 : 1;
    best = Math.max(best, right);
  }
  return best / all.length;
}

/**
 * Two classes of 2D activations, Gaussian with means +MU and -MU and a shared covariance whose large-variance axis is tilted 30
 * degrees from the mean difference. Returns the samples, the mean-difference and Fisher (inverse covariance times mean difference)
 * directions estimated from them, each direction's best threshold accuracy, and where the negative class's mean lands when each
 * direction, scaled to the length of the mean difference, is added to it.
 */
export function readWrite(seed = 2) {
  const r = rand(seed);
  const c = Math.cos(ANG), s = Math.sin(ANG);
  const draw = (sign: number) => Array.from({ length: NPTS }, () => {
    const a = SD[0] * gauss(r), b = SD[1] * gauss(r);
    return [sign * MU[0] + c * a - s * b, sign * MU[1] + s * a + c * b];
  });
  const pos = draw(1), neg = draw(-1);
  const mean = (X: number[][]) => [0, 1].map((k) => X.reduce((t, x) => t + x[k], 0) / X.length);
  const mp = mean(pos), mn = mean(neg);
  const md = [mp[0] - mn[0], mp[1] - mn[1]];
  const S = [[0, 0], [0, 0]];
  for (const [X, m] of [[pos, mp], [neg, mn]] as [number[][], number[]][])
    for (const x of X) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) S[i][j] += ((x[i] - m[i]) * (x[j] - m[j])) / (2 * NPTS - 2);
  const det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
  const fi = [(S[1][1] * md[0] - S[0][1] * md[1]) / det, (-S[1][0] * md[0] + S[0][0] * md[1]) / det];
  const len = Math.hypot(...md), fl = Math.hypot(...fi);
  const fisher = [(fi[0] / fl) * len, (fi[1] / fl) * len];
  const acc = (v: number[]) => bestAcc(pos.map((x) => x[0] * v[0] + x[1] * v[1]), neg.map((x) => x[0] * v[0] + x[1] * v[1]));
  const miss = (v: number[]) => Math.hypot(mn[0] + v[0] - mp[0], mn[1] + v[1] - mp[1]);
  return { pos, neg, mp, mn, md, fisher, accMd: acc(md), accF: acc(fisher), missMd: miss(md), missF: miss(fisher) };
}

const MODES = ["no steering", "add mean difference", "add Fisher direction"];

export function ReadWriteDirectionViz() {
  const [m, setM] = useState(0);
  const d = useMemo(() => readWrite(), []);
  const shift = m === 1 ? d.md : m === 2 ? d.fisher : [0, 0];
  const W = 320, H = 220, CX = 160, CY = 100, SC = 24;
  const px = (x: number) => CX + x * SC;
  const py = (y: number) => CY - y * SC;
  const arrow = (v: number[], col: string) => {
    const x2 = px(d.mn[0] + v[0]), y2 = py(d.mn[1] + v[1]);
    return <line x1={px(d.mn[0])} y1={py(d.mn[1])} x2={x2} y2={y2} stroke={col} strokeWidth={2.4} markerEnd="url(#rw-head)" style={{ color: col }} />;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How to steer the negative class">
          {MODES.map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Two classes of activations with the mean-difference and Fisher directions">
        <defs>
          <marker id="rw-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        <rect x={0} y={0} width={W} height={H - 14} style={{ fill: "none", stroke: "var(--border)" }} />
        {d.pos.map((x, i) => <circle key={`p${i}`} cx={px(x[0])} cy={py(x[1])} r={1.8} style={{ fill: "var(--accent)" }} opacity={0.55} />)}
        {d.neg.map((x, i) => <circle key={`n${i}`} cx={px(x[0] + shift[0])} cy={py(x[1] + shift[1])} r={1.8} style={{ fill: "var(--text-muted)" }} opacity={0.65} />)}
        {arrow(d.md, "var(--accent)")}
        {arrow(d.fisher, "var(--text)")}
        <circle cx={px(d.mp[0])} cy={py(d.mp[1])} r={4} style={{ fill: "none", stroke: "var(--text)" }} strokeWidth={1.5} />
        <text x={W / 2} y={H - 2} textAnchor="middle" className="viz-label">coloured arrow: mean difference; dark arrow: Fisher</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        reading: mean difference {(100 * d.accMd).toFixed(0)}%, Fisher {(100 * d.accF).toFixed(0)}% correct; writing: grey mean is{" "}
        {m === 1 ? d.missMd.toFixed(2) : m === 2 ? d.missF.toFixed(2) : Math.hypot(d.md[0], d.md[1]).toFixed(2)} from the ring
      </div>
      <figcaption className="viz-caption">
        Two simulated classes of activations share a tilted, elongated spread. Both arrows start at the grey class&apos;s mean and have the
        same length; the ring marks the coloured class&apos;s mean. The Fisher direction leans away from the long axis of the spread, so it
        separates the classes better, but adding it moves the grey class off target. Adding the mean difference lands exactly on the other
        class. The best direction for reading is not the best for writing.
      </figcaption>
    </figure>
  );
}
