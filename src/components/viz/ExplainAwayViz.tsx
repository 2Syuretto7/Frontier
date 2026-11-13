"use client";

import { useState } from "react";

/** Two independent causes of an alarm (alarm = burglary or earthquake): conditioning on the alarm makes the causes dependent. */
export function ExplainAwayViz() {
  const [b, setB] = useState(10);
  const [e, setE] = useState(20);
  const pb = b / 100, pe = e / 100;
  const pa = 1 - (1 - pb) * (1 - pe);
  const rows: [string, number, string][] = [
    ["P(B)", pb, "var(--text-muted)"],
    ["P(B | alarm)", pb / pa, "var(--accent)"],
    ["P(B | alarm, quake)", pb, "var(--danger)"],
    ["P(B | alarm, no quake)", 1, "var(--text)"],
  ];
  const W = 320;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(burglary) = {pb.toFixed(2)}
          <input type="range" min={1} max={60} value={b} onChange={(ev) => setB(Number(ev.target.value))} aria-label="probability of burglary" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          P(quake) = {pe.toFixed(2)}
          <input type="range" min={1} max={60} value={e} onChange={(ev) => setE(Number(ev.target.value))} aria-label="probability of earthquake" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} 124`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of burglary under different conditioning">
        {rows.map(([name, v, col], r) => (
          <g key={name}>
            <text x={132} y={20 + r * 28} textAnchor="end" className="viz-label">{name}</text>
            <rect x={138} y={8 + r * 28} width={Math.max(2, v * (W - 180))} height={16} fill={col} opacity={0.75} />
            <text x={142 + v * (W - 180)} y={20 + r * 28} className="viz-label">{v.toFixed(3)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Burglary and earthquake are independent, and either sets off the alarm. Hearing the alarm raises the probability of a
        burglary. Learning that there was also an earthquake drops it back to the prior: the quake explains the alarm away.
        Given the alarm, the two causes are dependent, even though they were independent before.
      </figcaption>
    </figure>
  );
}
