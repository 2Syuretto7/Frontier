"use client";

import { useMemo, useState } from "react";

type Seq = "alt" | "harm" | "cf";
const NMAX = 400;
function build(s: Seq) {
  const out: number[] = [];
  let acc = 0, x = 1;
  for (let k = 1; k <= NMAX; k++) {
    if (s === "alt") { acc += (k % 2 === 1 ? 1 : -1) / k; out.push(acc); }
    else if (s === "harm") { acc += 1 / k; out.push(acc); }
    else { out.push(x); x = 1 / (1 + x); }
  }
  return out;
}
const LABEL: Record<Seq, string> = { alt: "1 − 1/2 + 1/3 − …", harm: "1 + 1/2 + 1/3 + …", cf: "xₙ₊₁ = 1/(1 + xₙ)" };

/** The spread of the tail of a sequence after index N: it shrinks to 0 exactly for Cauchy sequences. */
export function CauchyTailViz() {
  const [seq, setSeq] = useState<Seq>("alt");
  const [N, setN] = useState(10);
  const xs = useMemo(() => build(seq), [seq]);
  const tail = xs.slice(N - 1);
  const hi = Math.max(...tail), lo = Math.min(...tail);
  const yMin = Math.min(...xs), yMax = Math.max(...xs);
  const W = 330, H = 180;
  const X = (i: number) => 24 + (Math.log(i) / Math.log(NMAX)) * (W - 34);
  const Y = (v: number) => H - 22 - ((v - yMin) / (yMax - yMin || 1)) * (H - 34);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(LABEL) as Seq[]).map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={seq === s} onClick={() => setSeq(s)}>{LABEL[s]}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          N = {N}
          <input type="range" min={1} max={300} value={N} onChange={(e) => setN(Number(e.target.value))} aria-label="start of the tail" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Terms on a log index scale with the band spanned by the tail">
        <rect x={X(N)} y={Y(hi)} width={X(NMAX) - X(N)} height={Math.max(1, Y(lo) - Y(hi))} fill="var(--accent-soft)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.4} points={xs.map((v, i) => `${X(i + 1).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")} />
        <line x1={X(N)} x2={X(N)} y1={8} y2={H - 22} stroke="var(--danger)" strokeDasharray="3 3" />
        {[1, 10, 100, 400].map((t) => <text key={t} x={X(t)} y={H - 6} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        spread of terms N to {NMAX}: {(hi - lo).toFixed(5)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded band covers every term from index N on (up to {NMAX}, index on a log scale). A sequence is Cauchy when this
        spread can be made as small as you like by moving N right. The alternating series and the iteration pass the test;
        the harmonic partial sums do not, since their consecutive steps 1/n shrink but the spread keeps growing as more terms
        are shown.
      </figcaption>
    </figure>
  );
}
