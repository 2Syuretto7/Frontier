"use client";

import { useState, type ReactElement } from "react";

type Crit = { p: [number, number]; H: [number, number, number] };
type Fn = { label: string; f: (x: number, y: number) => number; scale: number; crits: Crit[] };
const FNS: Fn[] = [
  {
    label: "x³ − 3x + y²",
    f: (x, y) => x ** 3 - 3 * x + y * y,
    scale: 3,
    crits: [{ p: [1, 0], H: [6, 0, 2] }, { p: [-1, 0], H: [-6, 0, 2] }],
  },
  {
    label: "x⁴ + y⁴ − 4xy",
    f: (x, y) => x ** 4 + y ** 4 - 4 * x * y,
    scale: 4,
    crits: [{ p: [0, 0], H: [0, -4, 0] }, { p: [1, 1], H: [12, -4, 12] }, { p: [-1, -1], H: [12, -4, 12] }],
  },
  { label: "x² + y³", f: (x, y) => x * x + y ** 3, scale: 3, crits: [{ p: [0, 0], H: [2, 0, 0] }] },
  { label: "x² − y²", f: (x, y) => x * x - y * y, scale: 3, crits: [{ p: [0, 0], H: [2, 0, -2] }] },
];
const S = 280, N = 40, R = 2;
const px = (x: number) => ((x + R) / (2 * R)) * S;
const py = (y: number) => S - ((y + R) / (2 * R)) * S;

function classify([a, b, d]: [number, number, number]) {
  const tr = a + d, det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 - disc, l2 = tr / 2 + disc;
  const kind = l1 > 1e-9 ? "local minimum" : l2 < -1e-9 ? "local maximum" : l1 < -1e-9 && l2 > 1e-9 ? "saddle point" : "inconclusive";
  return { l1, l2, kind };
}

/** Critical points of a function of two variables, classified by the eigenvalues of the Hessian. */
export function CriticalPointsViz() {
  const [fi, setFi] = useState(0);
  const [ci, setCi] = useState(0);
  const F = FNS[fi];
  const cells: ReactElement[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -R + ((i + 0.5) * 2 * R) / N, y = -R + ((j + 0.5) * 2 * R) / N;
    const v = Math.tanh(F.f(x, y) / F.scale);
    cells.push(
      <rect key={`${i}-${j}`} x={(i * S) / N} y={S - ((j + 1) * S) / N} width={S / N + 0.4} height={S / N + 0.4} fill={v >= 0 ? "var(--accent)" : "var(--danger)"} opacity={Math.abs(v) * 0.75} />,
    );
  }
  const c = F.crits[Math.min(ci, F.crits.length - 1)];
  const { l1, l2, kind } = classify(c.H);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {FNS.map((g, i) => (
          <button key={g.label} type="button" className="seg" aria-pressed={fi === i} onClick={() => { setFi(i); setCi(0); }}>{g.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label={`Values of ${F.label} with critical points marked`}>
        {cells}
        <line x1={0} y1={py(0)} x2={S} y2={py(0)} stroke="var(--border)" />
        <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--border)" />
        {F.crits.map((k, i) => (
          <circle key={i} cx={px(k.p[0])} cy={py(k.p[1])} r={i === ci ? 7 : 5} fill="var(--bg)" stroke="var(--text)" strokeWidth={i === ci ? 3 : 1.5} />
        ))}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <span className="viz-label">critical point</span>
        {F.crits.map((k, i) => (
          <button key={i} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>({k.p.join(", ")})</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        H = [[{c.H[0]}, {c.H[1]}], [{c.H[1]}, {c.H[2]}]], eigenvalues {l1.toFixed(2)} and {l2.toFixed(2)}: {kind}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Colour shows f on [−2, 2]²: <span style={{ color: "var(--accent)" }}>positive</span> and{" "}
        <span style={{ color: "var(--danger)" }}>negative</span>, darker for larger size. Circles mark points where ∇f = 0.{" "}
        {kind === "inconclusive"
          ? fi === 2
            ? "One eigenvalue is 0, so the test says nothing; in fact f = y³ along the y-axis takes both signs, so this is not an extremum."
            : "A zero eigenvalue: higher-order terms decide."
          : kind === "saddle point"
            ? "Eigenvalues of both signs: up in one direction, down in another."
            : "Both eigenvalues have the same sign, so the quadratic model is a bowl and the point is a strict extremum."}
      </figcaption>
    </figure>
  );
}
