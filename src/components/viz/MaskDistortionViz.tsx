"use client";

import { useState } from "react";

const SEQS = ["AA", "BA", "BB"];

/** Two-step model over tokens A, B: p(A first) = pa, p(B | A) = pab, p(· | B) = 1/2. The rule forbids "AB". */
export function compare(pa: number, pab: number) {
  const w = [pa * (1 - pab), (1 - pa) * 0.5, (1 - pa) * 0.5];
  const Z = w.reduce((a, b) => a + b, 0);
  const cond = w.map((v) => v / Z);
  const mask = [pa, (1 - pa) * 0.5, (1 - pa) * 0.5];
  const tv = 0.5 * cond.reduce((a, v, i) => a + Math.abs(v - mask[i]), 0);
  return { cond, mask, tv };
}

const PABS = [0.5, 0.9, 0.99];

export function MaskDistortionViz() {
  const [pa, setPa] = useState(0.9);
  const [bi, setBi] = useState(2);
  const r = compare(pa, PABS[bi]);
  const W = 320, rowH = 30, X0 = 40, PW = W - X0 - 50;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="md-pa">p(first token A) = {pa.toFixed(2)}</label>
        <input id="md-pa" type="range" min={0.05} max={0.95} step={0.05} value={pa} onChange={(e) => setPa(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">p(B after A)</span>
        {PABS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={bi === i} onClick={() => setBi(i)}>{v}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${SEQS.length * rowH * 1.6 + 10}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of each allowed output under masked sampling and under the true conditional distribution">
        {SEQS.map((s, i) => {
          const y = 6 + i * rowH * 1.6;
          return (
            <g key={s}>
              <text x={X0 - 8} y={y + 18} textAnchor="end" className="viz-label">{s}</text>
              <rect x={X0} y={y} width={r.cond[i] * PW} height={rowH / 2 - 2} fill="var(--success)" />
              <text x={X0 + r.cond[i] * PW + 4} y={y + 11} className="viz-label">{r.cond[i].toFixed(3)}</text>
              <rect x={X0} y={y + rowH / 2} width={r.mask[i] * PW} height={rowH / 2 - 2} fill="var(--danger)" />
              <text x={X0 + r.mask[i] * PW + 4} y={y + rowH / 2 + 11} className="viz-label">{r.mask[i].toFixed(3)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`total variation between them: ${r.tv.toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        A two-token output where the rule forbids AB. Green is the model&apos;s distribution restricted to the allowed
        outputs and renormalised, the distribution we would like to sample from; red is what masking each step gives.
        Masking cannot see that choosing A first leads into a corner the model did not want to be in, so it keeps all of
        A&apos;s probability and forces AA. The more the model wanted AB, the further apart the two are; when the model
        has no preference after A, they are closer.
      </figcaption>
    </figure>
  );
}
