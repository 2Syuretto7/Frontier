"use client";

import { useState } from "react";

const DISC = [0.1, 0.25, 0.4];
const DE = [1, 2, 4];
const GAPS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);

/** Questions needed for 80% power at a two-sided 5% level to detect a gap g (a proportion) in a paired comparison with discordant fraction f and design effect de. */
export function needed(f: number, g: number, de: number) {
  return Math.ceil((de * (1.96 + 0.8416) ** 2 * (f - g * g)) / (g * g));
}

export function QuestionsNeededViz() {
  const [f, setF] = useState(1);
  const [d, setD] = useState(0);
  const [g, setG] = useState(4);
  const W = 330, H = 190, X0 = 40, PW = 280, Y0 = 8, PH = 150, LMIN = 1, LMAX = 6;
  const px = (gap: number) => X0 + ((gap - 1) / 9) * PW;
  const py = (n: number) => Y0 + PH - ((Math.log10(Math.max(10, n)) - LMIN) / (LMAX - LMIN)) * PH;
  const path = GAPS.map((gap, i) => `${i ? "L" : "M"}${px(gap).toFixed(1)},${py(needed(DISC[f], gap / 100, DE[d])).toFixed(1)}`).join(" ");
  const sel = GAPS[g];
  const n = needed(DISC[f], sel / 100, DE[d]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Fraction of questions where the models disagree">
          {DISC.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={f === i} onClick={() => setF(i)}>{v * 100}% differ</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Design effect from clustering">
          {DE.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={d === i} onClick={() => setD(i)}>{v === 1 ? "independent" : `design effect ${v}`}</button>)}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          gap {sel.toFixed(1)} points
          <input type="range" min={0} max={GAPS.length - 1} value={g} onChange={(e) => setG(Number(e.target.value))} aria-label="Gap to detect" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Questions needed against the gap to detect">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <g key={k}>
            <line x1={X0} x2={X0 + PW} y1={py(10 ** k)} y2={py(10 ** k)} stroke="var(--border)" strokeDasharray={k > 1 ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(10 ** k) + 4} textAnchor="end" className="viz-label">{["10", "100", "1k", "10k", "100k", "1M"][k - 1]}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={px(sel)} cy={py(n)} r={4} style={{ fill: "var(--accent)" }} />
        <text x={X0} y={Y0 + PH + 13} className="viz-label">1 point</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">10 points</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">true gap between the models</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        questions needed for 80% power: {n.toLocaleString("en-IN")}
      </div>
      <figcaption className="viz-caption">
        How many questions a paired comparison needs to detect a given gap four times out of five at the 5% level. Halving the gap
        roughly quadruples the questions. Models that disagree on more questions need more, and clustering multiplies the count
        by the design effect. Many benchmarks have a few hundred questions, enough only for gaps of several points.
      </figcaption>
    </figure>
  );
}
