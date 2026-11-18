"use client";

import { useState } from "react";

const Q = [1.2, 0.4], K = [0.9, -0.6];

function rot([x, y]: number[], a: number) {
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Score between a query at position m and a key at position n after rotary encoding of one frequency pair. */
export function ropeScore(m: number, n: number, theta: number) {
  const q = rot(Q, m * theta), k = rot(K, n * theta);
  return { q, k, score: q[0] * k[0] + q[1] * k[1] };
}

export function RopeRotationViz() {
  const [m, setM] = useState(6);
  const [n, setN] = useState(2);
  const [theta, setTheta] = useState(0.3);
  const { q, k, score } = ropeScore(m, n, theta);
  const S = 240, C = S / 2, R = 1.6;
  const p = (v: number[]) => [C + (v[0] / R) * (C - 10), C - (v[1] / R) * (C - 10)];
  const [qx, qy] = p(q), [kx, ky] = p(k);
  const raw = Q[0] * K[0] + Q[1] * K[1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="rope-m">query position m: {m}</label>
        <input id="rope-m" type="range" min={0} max={30} value={m} onChange={(e) => setM(Number(e.target.value))} style={{ flex: "1 1 120px" }} />
        <label className="viz-label" htmlFor="rope-n">key position n: {n}</label>
        <input id="rope-n" type="range" min={0} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ flex: "1 1 120px" }} />
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">frequency θ</span>
        {[1.0, 0.3, 0.05].map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={theta === v} onClick={() => setTheta(v)}>{v}</button>
        ))}
        <button type="button" className="seg" onClick={() => { if (Math.max(m, n) <= 25) { setM(m + 5); setN(n + 5); } else if (Math.min(m, n) >= 5) { setM(m - 5); setN(n - 5); } }}>shift both by 5</button>
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }} role="img" aria-label="Rotated query and key vectors">
        <circle cx={C} cy={C} r={(1 / R) * (C - 10)} fill="none" stroke="var(--border)" />
        <line x1={10} y1={C} x2={S - 10} y2={C} stroke="var(--border)" />
        <line x1={C} y1={10} x2={C} y2={S - 10} stroke="var(--border)" />
        <line x1={C} y1={C} x2={qx} y2={qy} stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={C} y1={C} x2={kx} y2={ky} stroke="var(--danger)" strokeWidth={2.5} />
        <text x={qx + 4} y={qy - 4} className="viz-label">q</text>
        <text x={kx + 4} y={ky - 4} className="viz-label">k</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        <div>{`offset n − m = ${n - m}; score ${score.toFixed(3)} (unrotated ${raw.toFixed(3)})`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        One frequency pair of rotary position encoding. The query is rotated by mθ and the key by nθ, so the angle between
        them changes by (n − m)θ and the score depends only on the offset: shifting both positions by the same amount turns
        both vectors together and leaves the score unchanged. Fast frequencies distinguish nearby offsets; slow ones turn
        so little that they behave almost like unrotated features over short ranges.
      </figcaption>
    </figure>
  );
}
