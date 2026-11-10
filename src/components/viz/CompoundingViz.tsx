"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const PLANS: { n: number; name: string }[] = [
  { n: 1, name: "once a year" },
  { n: 2, name: "twice a year" },
  { n: 4, name: "quarterly" },
  { n: 12, name: "monthly" },
  { n: 52, name: "weekly" },
  { n: 365, name: "daily" },
  { n: 8760, name: "hourly" },
  { n: 525600, name: "every minute" },
];

const W = 620, H = 200, x0 = 60, x1 = 600;
const lo = 1.9, hi = 2.8;
const X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);

/** Rs 1 at 100 percent a year, compounded n times: (1 + 1/n)^n creeps up towards e and never passes it. */
export function CompoundingViz() {
  const [k, setK] = useState(0);
  const { n, name } = PLANS[k];
  const value = (1 + 1 / n) ** n;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Compounding ${name}: one rupee grows to ${value.toFixed(6)} rupees in a year`}>
        <line x1={x0} y1={120} x2={x1} y2={120} className="viz-axis" />
        {[2, 2.2, 2.4, 2.6, 2.8].map((t) => (
          <g key={t}>
            <line x1={X(t)} y1={114} x2={X(t)} y2={126} className="viz-axis" />
            <text x={X(t)} y={144} textAnchor="middle" className="plot-tick">{fmtNum(t)}</text>
          </g>
        ))}
        <line x1={X(Math.E)} y1={60} x2={X(Math.E)} y2={130} className="plot-line" />
        <text x={X(Math.E)} y={52} textAnchor="middle" className="viz-label">e</text>
        {PLANS.slice(0, k + 1).map((p, i) => {
          const v = (1 + 1 / p.n) ** p.n;
          return <circle key={p.n} cx={X(v)} cy={120} r={i === k ? 7 : 4} className="plot-point" opacity={i === k ? 1 : 0.35} />;
        })}
        <text x={X(value)} y={100} textAnchor="middle" className="viz-label is-on">{value.toFixed(4)}</text>
        <text x={x0} y={180} className="plot-tick">rupees after one year, starting from Rs 1 at 100 percent interest</text>
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0}>Less often</button>
        <button type="button" className="btn btn-primary" onClick={() => setK(Math.min(PLANS.length - 1, k + 1))} disabled={k === PLANS.length - 1}>More often</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Compounding {name}, <span className="mono">n = {fmtNum(n)}</span>: each period adds <span className="mono">1/{fmtNum(n)}</span> of 100 percent,
        so Rs 1 becomes <span className="mono">(1 + 1/{fmtNum(n)})<sup>{fmtNum(n)}</sup> = {value.toFixed(6)}</span>. More frequent compounding always helps,
        but by less and less. The values approach <span className="mono">e = 2.718281…</span> and never reach it.
      </figcaption>
    </figure>
  );
}
