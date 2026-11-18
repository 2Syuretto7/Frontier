"use client";

import { useState } from "react";

const LO = 0, HI = Math.log10(500);
const CORES_PER_CM2 = 1950;

/** Probability that a Poisson(lambda) count is at most s, summed in log space. */
export function poissonCdf(lambda: number, s: number) {
  let logTerm = -lambda, total = Math.exp(logTerm);
  for (let j = 1; j <= s; j++) {
    logTerm += Math.log(lambda) - Math.log(j);
    total += Math.exp(logTerm);
    if (total >= 1) return 1;
  }
  return Math.min(1, total);
}

/** Yield of a die of the given area (cm²) without redundancy, and with 1% of its cores as spares. */
export function yields(area: number, D: number) {
  const lambda = area * D;
  const spares = Math.floor(0.01 * CORES_PER_CM2 * area);
  return { lambda, plain: Math.exp(-lambda), spares, spared: poissonCdf(lambda, spares) };
}

export function WaferYieldViz() {
  const [la, setLa] = useState(Math.log10(8));
  const [D, setD] = useState(0.1);
  const area = 10 ** la;
  const y = yields(area, D);
  const W = 330, H = 180, X0 = 40, Y0 = 8, PW = W - X0 - 10, PH = H - Y0 - 34;
  const sx = (l: number) => X0 + ((l - LO) / (HI - LO)) * PW;
  const sy = (v: number) => Y0 + PH - v * PH;
  const ls = Array.from({ length: 121 }, (_, i) => LO + (i * (HI - LO)) / 120);
  const curve = ls.map((l, i) => `${i ? "L" : "M"}${sx(l).toFixed(1)},${sy(Math.exp(-(10 ** l) * D)).toFixed(1)}`).join("");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="wy-a">die area: {area >= 10 ? area.toFixed(0) : area.toFixed(1)} cm²</label>
        <input id="wy-a" type="range" min={LO} max={HI} step={0.01} value={la} onChange={(e) => setLa(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="wy-d">defects per cm²: {D.toFixed(2)}</label>
        <input id="wy-d" type="range" min={0.02} max={0.5} step={0.01} value={D} onChange={(e) => setD(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Die yield against die area">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={W - 10} y1={sy(v)} y2={sy(v)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{`${v * 100}%`}</text>
          </g>
        ))}
        {[1, 10, 100, 500].map((a) => (
          <text key={a} x={sx(Math.log10(a))} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{a}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">die area, cm² (log)</text>
        <path d={curve} fill="none" stroke="var(--danger)" strokeWidth={2} />
        <line x1={X0} x2={W - 10} y1={sy(1)} y2={sy(1)} stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 3" />
        <circle cx={sx(la)} cy={sy(y.plain)} r={4} fill="var(--danger)" />
        <circle cx={sx(la)} cy={sy(y.spared)} r={4} fill="var(--accent)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`expected defects ${y.lambda.toFixed(1)}; yield ${(y.plain * 100).toPrecision(3)}% without spares, ${(y.spared * 100).toFixed(1)}% with ${y.spares} spare cores`}
      </div>
      <figcaption className="viz-caption">
        With defects scattered at random, a die of area A survives with probability e<sup>−DA</sup> (red). A large GPU die
        of 8 cm² at 0.1 defects per cm² yields 45%; a whole wafer of 460 cm² would essentially never be perfect. Wafer-scale
        chips survive by redundancy: if 1% of the small cores are spares and each defect disables one core, the chip works
        whenever the defects are fewer than the spares (blue dashed), which for any realistic density is almost always.
      </figcaption>
    </figure>
  );
}
