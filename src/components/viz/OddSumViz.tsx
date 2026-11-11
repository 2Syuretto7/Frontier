"use client";

import { useState } from "react";

const G = 22, R = 7;

/** Dots for an odd number 2j + 1: j pairs and one dot left over. Two odd numbers' leftovers pair up. */
function Row({ y, pairs, extra, cls, x0 = 210, pairCls }: { y: number; pairs: number; extra: number; cls: string; x0?: number; pairCls?: string }) {
  const dots = [];
  for (let i = 0; i < pairs; i++) {
    dots.push(<circle key={`t${i}`} cx={x0 + i * G} cy={y} r={R} className={cls} />);
    dots.push(<circle key={`b${i}`} cx={x0 + i * G} cy={y + G} r={R} className={cls} />);
  }
  if (extra === 1) dots.push(<circle key="x" cx={x0 + pairs * G} cy={y} r={R} className="plot-hot" />);
  if (extra === 2) {
    dots.push(<circle key="x1" cx={x0 + pairs * G} cy={y} r={R} className="plot-hot" />);
    dots.push(<circle key="x2" cx={x0 + pairs * G} cy={y + G} r={R} className="plot-hot" />);
    dots.push(<rect key="box" x={x0 + pairs * G - 12} y={y - 12} width={24} height={G + 24} rx={8} fill="none" className={pairCls} />);
  }
  return <g>{dots}</g>;
}

export function OddSumViz() {
  const [j, setJ] = useState(3);
  const [k, setK] = useState(5);
  const a = 2 * j + 1, b = 2 * k + 1;

  const stepper = (label: string, v: number, set: (n: number) => void) => (
    <span className="viz-stepper"><span className="viz-stepper-label">{label}</span>
      <button type="button" className="btn" onClick={() => set(Math.max(0, v - 1))} disabled={v <= 0} aria-label={`Decrease ${label}`}>−</button>
      <span className="mono viz-stepper-value">{2 * v + 1}</span>
      <button type="button" className="btn" onClick={() => set(Math.min(6, v + 1))} disabled={v >= 6} aria-label={`Increase ${label}`}>+</button>
    </span>
  );

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 250" role="img" aria-label={`${a} + ${b} drawn as dots in pairs`}>
        <text x={20} y={40} className="viz-label">a = 2·{j} + 1 = {a}</text>
        <Row y={30} pairs={j} extra={1} cls="plot-point" />
        <text x={20} y={110} className="viz-label">b = 2·{k} + 1 = {b}</text>
        <Row y={100} pairs={k} extra={1} cls="plot-point" />
        <line x1={20} x2={600} y1={150} y2={150} className="plot-tick" stroke="var(--border-strong)" />
        <text x={20} y={190} className="viz-label is-on">a + b = 2·{j + k + 1} = {a + b}</text>
        <Row y={180} pairs={j + k} extra={2} cls="plot-point" pairCls="plot-arrow" />
      </svg>
      <div className="viz-controls">
        {stepper("a", j, setJ)}
        <span className="viz-sep" />
        {stepper("b", k, setK)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        An odd number is a set of pairs with one dot left over. Put two odd numbers together and the two leftovers, in red,
        form one more pair, so nothing is left over: <span className="mono">({2}·{j} + 1) + ({2}·{k} + 1) = 2·({j} + {k} + 1)</span>.
        The algebra in the proof says exactly this, for every odd a and b at once.
      </figcaption>
    </figure>
  );
}
