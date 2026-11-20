"use client";

import { useState } from "react";

const BUGS = [
  { label: "bugs on common inputs", a: 2, b: 2 },
  { label: "edge-case bugs", a: 0.5, b: 4 },
];
const MS = [1, 2, 3, 5, 10, 20, 30, 50, 100];

/** A wrong program fails on a fraction f of random inputs, f ~ Beta(a, b). The chance it passes m independent random tests
 *  is E[(1 − f)^m] = B(a, b + m) / B(a, b) = Π_{j<m} (b + j) / (a + b + j). */
export function passAll(a: number, b: number, m: number) {
  let p = 1;
  for (let j = 0; j < m; j++) p *= (b + j) / (a + b + j);
  return p;
}

export function WeakTestsViz() {
  const [bi, setBi] = useState(1);
  const { a, b } = BUGS[bi];
  const W = 330, H = 180, X0 = 40, PW = 280, Y0 = 10, PH = 130;
  const px = (m: number) => X0 + (Math.log10(m) / 2) * PW;
  const py = (v: number) => Y0 + PH - v * PH;
  const grid = Array.from({ length: 100 }, (_, i) => i + 1);
  const curve = (aa: number, bb: number) => grid.map((m, i) => `${i ? "L" : "M"}${px(m).toFixed(1)},${py(passAll(aa, bb, m)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Kind of bug">
          {BUGS.map((g, i) => <button key={g.label} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{g.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Share of wrong programs that pass every test">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{Math.round(v * 100)}%</text>
          </g>
        ))}
        {[1, 10, 100].map((m) => <text key={m} x={px(m)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{m}</text>)}
        {BUGS.map((g, i) => (
          <path key={g.label} d={curve(g.a, g.b)} fill="none" stroke={i === bi ? "var(--accent)" : "var(--border)"} strokeWidth={i === bi ? 2.5 : 1.5} />
        ))}
        {MS.map((m) => <circle key={m} cx={px(m)} cy={py(passAll(a, b, m))} r={2.5} style={{ fill: "var(--accent)" }} />)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">random tests per problem</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        wrong programs passing every test: {MS.filter((m) => [3, 10, 100].includes(m)).map((m) => `${m} tests ${(passAll(a, b, m) * 100).toFixed(1)}%`).join(", ")}
      </div>
      <figcaption className="viz-caption">
        A test suite is a verifier with false positives: a wrong program passes when no test hits its bug. If bugs show up on
        many inputs, a handful of random tests catch almost all of them. Bugs that only fire on rare edge cases slip through
        for far longer, and the false-positive rate falls only slowly as tests are added. Under RL, the policy is rewarded
        for every wrong program that passes, so it learns exactly the bugs the tests miss.
      </figcaption>
    </figure>
  );
}
