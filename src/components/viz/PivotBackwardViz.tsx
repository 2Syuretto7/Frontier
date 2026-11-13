"use client";

import { useState } from "react";

type V = [number, number];

function solveNoPivot(e: number): V {
  const l = 1 / e;
  const u22 = 1 - l * 1;
  const x2 = (2 - l * 1) / u22;
  const x1 = (1 - 1 * x2) / e;
  return [x1, x2];
}

function solvePivot(e: number): V {
  const l = e / 1;
  const u22 = 1 - l * 1;
  const x2 = (1 - l * 2) / u22;
  const x1 = (2 - 1 * x2) / 1;
  return [x1, x2];
}

const nrm = (v: V) => Math.hypot(v[0], v[1]);

function errors(e: number, x: V) {
  const r: V = [1 - (e * x[0] + x[1]), 2 - (x[0] + x[1])];
  const tr = (1 + e) / 2, d = Math.sqrt(((1 - e) / 2) ** 2 + 1);
  const normA = Math.max(Math.abs(tr + d), Math.abs(tr - d));
  const bwd = nrm(r) / (normA * nrm(x) + Math.sqrt(5));
  const xt: V = [1 / (1 - e), (1 - 2 * e) / (1 - e)];
  const fwd = nrm([x[0] - xt[0], x[1] - xt[1]]) / nrm(xt);
  return { bwd, fwd };
}

const FLOOR = -18;
const lg = (v: number) => (v > 0 ? Math.max(Math.log10(v), FLOOR) : FLOOR);
const fmt = (v: number) => (v === 0 ? "0" : v.toExponential(1));

/** Solving [[ε, 1], [1, 1]]x = (1, 2) by elimination with and without row swapping: backward and forward error as ε shrinks. */
export function PivotBackwardViz() {
  const [k, setK] = useState(40);
  const ex = k / 4;
  const W = 330, H = 170;
  const X = (t: number) => 34 + (t / 20) * (W - 46);
  const Y = (y: number) => 10 + (-y / -FLOOR) * (H - 34);
  const grid = Array.from({ length: 81 }, (_, i) => i / 4);
  const curve = (f: (t: number) => number) => grid.map((t) => `${X(t).toFixed(1)},${Y(f(t)).toFixed(1)}`).join(" ");
  const eps = 10 ** -ex;
  const xn = solveNoPivot(eps), xp = solvePivot(eps);
  const en = errors(eps, xn), ep = errors(eps, xp);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          ε = 10^−{ex.toFixed(2)}
          <input type="range" min={0} max={80} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="pivot size exponent" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Backward and forward errors of elimination with and without pivoting against the size of the pivot">
        {[0, -4, -8, -12, -16].map((y) => (
          <g key={y}>
            <line x1={X(0)} x2={X(20)} y1={Y(y)} y2={Y(y)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={30} y={Y(y) + 3} textAnchor="end" className="viz-label">{y === 0 ? "1" : `1e${y}`}</text>
          </g>
        ))}
        <line x1={X(0)} x2={X(20)} y1={Y(Math.log10(2 ** -53))} y2={Y(Math.log10(2 ** -53))} stroke="var(--text-muted)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={curve((t) => lg(errors(10 ** -t, solveNoPivot(10 ** -t)).bwd))} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.2} strokeDasharray="5 3" points={curve((t) => lg(errors(10 ** -t, solveNoPivot(10 ** -t)).fwd))} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={curve((t) => lg(errors(10 ** -t, solvePivot(10 ** -t)).bwd))} />
        <line x1={X(ex)} x2={X(ex)} y1={8} y2={H - 24} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={X(0)} y={H - 8} className="viz-label">ε = 1</text>
        <text x={X(20)} y={H - 8} textAnchor="end" className="viz-label">ε = 1e−20</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        no swap: x = ({xn[0].toPrecision(4)}, {xn[1].toPrecision(4)}), backward {fmt(en.bwd)}, forward {fmt(en.fwd)}
        <br />
        swap: x = ({xp[0].toPrecision(4)}, {xp[1].toPrecision(4)}), backward {fmt(ep.bwd)}, forward {fmt(ep.fwd)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The system with rows (ε, 1) and (1, 1) and right side (1, 2) has condition number about 2.6 for every small ε, so it
        is a well-conditioned problem. Eliminating with the tiny ε as pivot (red, solid for backward error, dashed for
        forward error) multiplies by 1/ε and wipes out information: both errors grow roughly like u/ε, where u is the unit
        roundoff, and reach order 1 once ε is near 10⁻¹⁶. Swapping the rows first (solid accent curve) keeps the backward error at the level of the unit roundoff
        (grey dotted line) or exactly zero, which is what backward stability means.
      </figcaption>
    </figure>
  );
}
