"use client";

import { useState } from "react";

const Hs = (p: number[]) => p.reduce((a, q) => a + (q > 0 ? -q * Math.log2(q) : 0), 0) + 0;

/** A three-symbol noisy channel: the joint table of X and Y, and the entropies H(X), H(Y), H(X, Y), H(Y | X), H(X | Y). */
export function CondEntropyViz() {
  const [w, setW] = useState(0.5);
  const [eps, setEps] = useState(0.2);
  const px = [w, (1 - w) / 2, (1 - w) / 2];
  const P = px.map((p, i) => [0, 1, 2].map((j) => p * (i === j ? 1 - eps : eps / 2)));
  const py = [0, 1, 2].map((j) => P.reduce((a, r) => a + r[j], 0));
  const HX = Hs(px), HY = Hs(py), HXY = Hs(P.flat());
  const rows = [
    { name: "H(X)", v: HX, c: "var(--accent)" },
    { name: "H(Y)", v: HY, c: "var(--accent)" },
    { name: "H(X, Y)", v: HXY, c: "var(--text-muted)" },
    { name: "H(Y | X)", v: HXY - HX, c: "var(--danger)" },
    { name: "H(X | Y)", v: HXY - HY, c: "var(--danger)" },
  ];
  const W = 330, H = 180, cell = 40, max = Math.max(...P.flat());
  const BX = (v: number) => 210 + (v / Math.log2(9)) * 110;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(X = 0) = {w.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="probability of X equal to 0" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          noise ε = {eps.toFixed(2)}
          <input type="range" min={0} max={1} step={0.01} value={eps} onChange={(e) => setEps(Number(e.target.value))} aria-label="channel noise" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Joint probability table and bars of entropies">
        <text x={30 + 1.5 * cell} y={14} textAnchor="middle" className="viz-label">y = 0, 1, 2</text>
        <text x={14} y={30 + 1.5 * cell} textAnchor="middle" className="viz-label" transform={`rotate(-90 14 ${30 + 1.5 * cell})`}>x = 0, 1, 2</text>
        {P.map((r, i) => r.map((p, j) => (
          <g key={`${i}${j}`}>
            <rect x={30 + j * cell} y={22 + i * cell} width={cell - 2} height={cell - 2} fill="var(--accent)" opacity={max > 0 ? 0.08 + 0.8 * (p / max) : 0.08} />
            <text x={30 + j * cell + cell / 2 - 1} y={22 + i * cell + cell / 2 + 3} textAnchor="middle" className="viz-label">{p.toFixed(2)}</text>
          </g>
        )))}
        {rows.map((r, k) => (
          <g key={r.name}>
            <text x={205} y={30 + k * 28} textAnchor="end" className="viz-label">{r.name}</text>
            <rect x={BX(0)} y={20 + k * 28} width={Math.max(0, BX(r.v) - BX(0))} height={13} fill={r.c} opacity={0.7} />
            <text x={BX(0) + 2} y={44 + k * 28} className="viz-label">{r.v.toFixed(3)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        X is sent through a channel that keeps it with probability 1 − ε and otherwise replaces it by one of the other two
        symbols. H(Y | X) is the uncertainty left in the output once you know the input; with ε = 0 it is 0, since Y is a
        function of X. It never exceeds H(Y), and H(X, Y) never exceeds H(X) + H(Y). At ε = 2/3 the output is independent
        of the input, so H(Y | X) = H(Y) and the joint entropy is the sum.
      </figcaption>
    </figure>
  );
}
