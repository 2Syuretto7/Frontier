"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 400;
export const ETAS = [0.01, 0.1, 1];

/** Losses |x − z_t| on [−1, 1] with z_t = +1 with probability 0.6 and −1 otherwise; D = 2, G = 1, so the tuned step is 2/√400 = 0.1. */
export function ogdRun(eta: number) {
  const r = rand(11);
  const zs = Array.from({ length: T }, () => (r() < 0.6 ? 1 : -1));
  let x = 0, alg = 0, plus = 0, minus = 0;
  const xs: number[] = [], reg: number[] = [];
  zs.forEach((z) => {
    xs.push(x);
    alg += Math.abs(x - z);
    plus += Math.abs(1 - z); minus += Math.abs(-1 - z);
    reg.push(alg - Math.min(plus, minus));
    const g = x > z ? 1 : x < z ? -1 : 0;
    x = Math.max(-1, Math.min(1, x - eta * g));
  });
  return { xs, reg, zs };
}

export function OgdRegretViz() {
  const [ei, setEi] = useState(1);
  const runs = useMemo(() => ETAS.map(ogdRun), []);
  const e = runs[ei];
  const W = 330, H = 150, X0 = 26, PW = 290, Y0 = 8, PH = 124, YH = 80;
  const sx = (t: number) => X0 + (t / T) * PW, sy = (y: number) => Y0 + PH - (Math.max(-5, Math.min(YH, y)) / YH) * PH;
  const line = (ys: number[]) => ys.map((y, t) => `${t ? "L" : "M"}${sx(t + 1).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const H2 = 60, sy2 = (x: number) => 6 + ((1 - x) / 2) * (H2 - 14);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">step size η</span>
        <div className="segmented" role="group" aria-label="Step size">
          {ETAS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Regret of online gradient descent over 400 rounds">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />
        {[0, 40, 80].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        <path d={line(Array.from({ length: T }, (_, t) => 2 * Math.sqrt(t + 1)))} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" />
        {runs.map((r, i) => i !== ei && <path key={i} d={line(r.reg)} fill="none" stroke="var(--text)" strokeOpacity={0.25} strokeWidth={1.2} />)}
        <path d={line(e.reg)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "2px auto 0" }} role="img" aria-label="The iterate x_t over time">
        <line x1={X0} x2={X0 + PW} y1={sy2(1)} y2={sy2(1)} stroke="var(--border)" strokeDasharray="2 3" />
        <line x1={X0} x2={X0 + PW} y1={sy2(-1)} y2={sy2(-1)} stroke="var(--border)" strokeDasharray="2 3" />
        <text x={X0 - 4} y={sy2(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy2(-1) + 4} textAnchor="end" className="viz-label">−1</text>
        <path d={e.xs.map((x, t) => `${t ? "L" : "M"}${sx(t + 1).toFixed(1)},${sy2(x).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={1.2} />
        <text x={X0 + PW} y={H2 - 1} textAnchor="end" className="viz-label">round t</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>━</span> regret</span>
        <span>┅ bound DG√t = 2√t</span>
        <span><span style={{ color: "var(--code-function)" }}>━</span> iterate x_t</span>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        regret after {T} rounds with η = 0.01, 0.1, 1: {runs.map((r) => r.reg[T - 1].toFixed(1)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        Online gradient descent on the losses |x − z_t| over [−1, 1], where z_t is +1 in 251 of the 400 rounds and −1 in the
        rest. A tiny step creeps towards +1 and pays for the slow start: regret 52.0. The tuned step 2/√400 = 0.1 reaches +1
        quickly and stays near it, regret 20.3, inside the guarantee 2√T = 40. A step of 1 lurches between the ends whenever z
        changes sign, and its regret of 74.0 keeps climbing.
      </figcaption>
    </figure>
  );
}
