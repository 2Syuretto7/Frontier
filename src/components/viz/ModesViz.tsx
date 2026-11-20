"use client";

import { useState } from "react";

const tw = (n: number) => {
  let k = 0;
  while (n >= 2 ** k) { n -= 2 ** k; k++; }
  return [n / 2 ** k, (n + 1) / 2 ** k];
};

export const SEQS = [
  { label: "typewriter", f: (n: number, w: number) => { const [a, b] = tw(n); return w >= a && w < b ? 1 : 0; }, modes: "Converges to 0 in probability and in mean, but not almost surely: every point is hit once per sweep" },
  { label: "spike n·1[0, 1/n)", f: (n: number, w: number) => (w < 1 / n ? n : 0), modes: "Converges to 0 almost surely and in probability, but not in mean: E|Xₙ| stays 1" },
  { label: "power ωⁿ", f: (n: number, w: number) => w ** n, modes: "Converges to 0 in every mode: almost surely, in probability and in mean" },
  { label: "nth binary digit", f: (n: number, w: number) => Math.floor(w * 2 ** n) % 2, modes: "Converges in distribution to a fair bit, since every Xₙ is one, but not in probability to anything" },
];

/** Exact P(|X_n| > 1/2) and E|X_n| for each sequence. */
export function stats(s: number, n: number) {
  if (s === 0) { const [a, b] = tw(n); return { far: b - a, mean: b - a }; }
  if (s === 1) return { far: 1 / n, mean: 1 };
  if (s === 2) return { far: 1 - 2 ** (-1 / n), mean: 1 / (n + 1) };
  return { far: 0.5, mean: 0.5 };
}

export function ModesViz() {
  const [s, setS] = useState(0);
  const [n, setN] = useState(5);
  const st = stats(s, n);
  const W = 330, H = 140, X0 = 26, PW = 296, Y0 = 8, PH = 110;
  const top = s === 1 ? Math.max(2, n) * 1.05 : 1.1;
  const sx = (w: number) => X0 + w * PW, sy = (y: number) => Y0 + PH - (Math.min(y, top) / top) * PH;
  const pts = Array.from({ length: 1201 }, (_, i) => i / 1200);
  const d = pts.map((w, i) => `${i ? "L" : "M"}${sx(w).toFixed(1)},${sy(SEQS[s].f(n, Math.min(w, 1 - 1e-9))).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Sequence of random variables" style={{ flexWrap: "wrap" }}>
          {SEQS.map((q, i) => (
            <button key={q.label} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{q.label}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          n = {n}
          <input type="range" min={1} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Index n" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Graph of the random variable X_n as a function of omega in the unit interval">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0 + PW} y1={sy(0.5)} y2={sy(0.5)} stroke="var(--border)" strokeDasharray="2 3" />
        {[0, 0.5, 1].map((v) => <text key={v} x={sx(v)} y={H - 2} textAnchor={v === 1 ? "end" : "middle"} className="viz-label">{v}</text>)}
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X0 - 4} y={Y0 + 8} textAnchor="end" className="viz-label">{s === 1 ? Math.round(top) : 1}</text>
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        P(|Xₙ| &gt; 1/2) = {st.far.toFixed(3)}, E|Xₙ| = {st.mean.toFixed(3)}. {SEQS[s].modes}.
      </div>
      <figcaption className="viz-caption">
        Four sequences of random variables on [0, 1) with Lebesgue measure, drawn as functions of ω. Move n and watch the
        probability of being far from 0 and the mean. The typewriter shrinks in probability while sweeping past every point
        forever; the spike vanishes at every ω &gt; 0 while carrying mass 1; the binary digits all have the same law but never
        settle down.
      </figcaption>
    </figure>
  );
}
