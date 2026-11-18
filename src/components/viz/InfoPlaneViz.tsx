"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const PYX = [[0.9, 0.1], [0.8, 0.2], [0.2, 0.8], [0.1, 0.9]];
const PX = [0.25, 0.25, 0.25, 0.25];
const K = 2;

export function ibSolve(beta: number, iters = 300) {
  const r = makeRng(7);
  let q = PX.map(() => { const a = 0.5 + 0.2 * (r() - 0.5); return [a, 1 - a]; });
  for (let it = 0; it < iters; it++) {
    const pt = Array.from({ length: K }, (_, t) => Math.max(1e-300, PX.reduce((s, p, x) => s + p * q[x][t], 0)));
    const pyt = Array.from({ length: K }, (_, t) => [0, 1].map((y) => Math.max(1e-300, PX.reduce((s, p, x) => s + p * q[x][t] * PYX[x][y], 0) / pt[t])));
    q = PX.map((_, x) => {
      const w = pt.map((p, t) => p * Math.exp(-beta * PYX[x].reduce((s, v, y) => s + v * Math.log(v / pyt[t][y]), 0)));
      const z = w.reduce((a, b) => a + b, 0);
      return w.map((v) => v / z);
    });
  }
  return q;
}

export function infoTerms(q: number[][]) {
  const pt = Array.from({ length: K }, (_, t) => PX.reduce((s, p, x) => s + p * q[x][t], 0));
  const py = [0, 1].map((y) => PX.reduce((s, p, x) => s + p * PYX[x][y], 0));
  let ixt = 0, ity = 0;
  PX.forEach((p, x) => q[x].forEach((v, t) => { if (v > 0 && pt[t] > 0) ixt += p * v * Math.log2(v / pt[t]); }));
  for (let t = 0; t < K; t++) for (let y = 0; y < 2; y++) {
    const j = PX.reduce((s, p, x) => s + p * q[x][t] * PYX[x][y], 0);
    if (j > 0) ity += j * Math.log2(j / (pt[t] * py[y]));
  }
  return { ixt: Math.max(0, ixt), ity: Math.max(0, ity) };
}

const BETAS = Array.from({ length: 60 }, (_, i) => 0.5 * Math.pow(100, i / 59));

/** The information bottleneck trade-off on a toy problem: compress X into two clusters while keeping information about Y. */
export function InfoPlaneViz() {
  const [bi, setBi] = useState(30);
  const [pts, setPts] = useState<{ ixt: number; ity: number; q: number[][] }[]>([]);
  useEffect(() => {
    setPts(BETAS.map((b) => { const q = ibSolve(b); return { ...infoTerms(q), q }; }));
  }, []);
  const W = 330, H = 190, X0 = 40, PW = W - 55, PH = 150, XM = 2, YM = 0.45;
  const sx = (v: number) => X0 + (v / XM) * PW, sy = (v: number) => 10 + (1 - v / YM) * PH;
  const ixy = 1 - (0.4689955935892812 + 0.7219280948873623) / 2;
  const cur = pts[bi];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          β {BETAS[bi].toFixed(2)}
          <input type="range" min={0} max={BETAS.length - 1} value={bi} onChange={(e) => setBi(Number(e.target.value))} aria-label="trade-off parameter beta" style={{ width: 140 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The information plane: information about Y against information kept about X">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(YM)} stroke="var(--border)" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(ixy)} y2={sy(ixy)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <line x1={sx(ixy)} y1={sy(ixy)} x2={sx(XM)} y2={sy(ixy)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <text x={sx(XM)} y={sy(ixy) - 4} textAnchor="end" className="viz-label">I(X;Y) = {ixy.toFixed(3)}</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">I(X;T), bits kept about X</text>
        <text x={X0 - 4} y={sy(YM) + 4} textAnchor="end" className="viz-label">{YM}</text>
        <text x={X0 + PW} y={sy(0) + 12} textAnchor="end" className="viz-label">{XM}</text>
        {pts.map((p, i) => <circle key={i} cx={sx(p.ixt)} cy={sy(p.ity)} r={2.5} fill="var(--accent)" opacity={0.6} />)}
        {cur && <circle cx={sx(cur.ixt)} cy={sy(cur.ity)} r={5} fill="var(--danger)" />}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {cur ? `I(X;T) = ${cur.ixt.toFixed(3)}, I(T;Y) = ${cur.ity.toFixed(3)}; P(T = 1 | x) = ${cur.q.map((r) => r[1].toFixed(2)).join(", ")}` : "computing"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Four inputs x, the first two mostly followed by y = 0 and the last two by y = 1, are squeezed into two clusters T.
        Small β values compression: T ignores x and both informations are 0. Between β = 2 and 2.5 the solution jumps,
        splitting the inputs into the two natural groups. The dashed lines are the data processing bounds: T can never know more about Y
        than X does, nor more than it knows about X.
      </figcaption>
    </figure>
  );
}
