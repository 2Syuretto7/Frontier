"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const M = 40;
const QS = [0.05, 0.1, 0.2];

/** Sorted p-values from 40 tests, some with real effects, against the Benjamini-Hochberg line iq/m and the Bonferroni threshold q/m. */
export function BhStepViz() {
  const [m1, setM1] = useState(10);
  const [qi, setQi] = useState(1);
  const [seed, setSeed] = useState(1);
  const q = QS[qi];
  const tests = useMemo(() => {
    const r = makeRng(seed * 7717 + m1);
    return Array.from({ length: M }, (_, i) => ({ real: i < m1, p: i < m1 ? Math.pow(r(), 10) : r() })).sort((a, b) => a.p - b.p);
  }, [seed, m1]);
  let k = 0;
  tests.forEach((t, i) => { if (t.p <= (q * (i + 1)) / M) k = i + 1; });
  const falseBh = tests.slice(0, k).filter((t) => !t.real).length;
  const bonf = tests.filter((t) => t.p <= q / M);
  const ymax = 0.3;
  const W = 330, H = 150;
  const X = (i: number) => 20 + (i / (M - 1)) * (W - 36);
  const Y = (p: number) => H - 16 - (Math.min(p, ymax) / ymax) * (H - 26);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          real effects = {m1}
          <input type="range" min={0} max={M} value={m1} onChange={(e) => setM1(Number(e.target.value))} aria-label="number of real effects" style={{ width: 110 }} />
        </label>
        {QS.map((v, i) => (
          <button key={v} type="button" className="seg" aria-pressed={qi === i} onClick={() => setQi(i)}>q = {v}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new data</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Sorted p-values with the Benjamini-Hochberg and Bonferroni thresholds">
        <line x1={X(0)} y1={Y(q / M)} x2={X(M - 1)} y2={Y(q)} stroke="var(--accent)" strokeWidth={1.4} />
        <line x1={X(0)} y1={Y(q / M)} x2={X(M - 1)} y2={Y(q / M)} stroke="var(--danger)" strokeDasharray="3 3" />
        {k > 0 && <rect x={X(0) - 4} y={10} width={X(k - 1) - X(0) + 8} height={Y(0) - 10} fill="var(--accent)" opacity={0.08} />}
        {tests.map((t, i) => (
          <circle key={i} cx={X(i)} cy={Y(t.p)} r={2.6} fill={t.real ? "var(--accent)" : "none"} stroke={t.real ? "var(--accent)" : "var(--text-muted)"} />
        ))}
        <line x1={X(0)} x2={X(M - 1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <text x={X(0)} y={H - 2} className="viz-label">smallest p</text>
        <text x={X(M - 1)} y={H - 2} textAnchor="end" className="viz-label">largest</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        BH: {k} discoveries, {falseBh} false; Bonferroni: {bonf.length} discoveries, {bonf.filter((t) => !t.real).length} false
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The 40 p-values are sorted; filled dots are tests with a real effect, hollow dots true nulls (the plot is cut at
        0.3). Benjamini-Hochberg finds the last sorted p-value under the line iq/m (accent) and rejects it and everything
        before it (shaded). Bonferroni rejects only below q/m (danger dashes). BH makes more discoveries while keeping the
        expected fraction of false ones below q.
      </figcaption>
    </figure>
  );
}
