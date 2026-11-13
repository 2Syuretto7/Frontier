"use client";

import { useState } from "react";

type Seq = "alt" | "sin" | "mix";
const F: Record<Seq, (n: number) => number> = {
  alt: (n) => (n % 2 === 0 ? 1 : -1) * (1 + 2 / n),
  sin: (n) => Math.sin(n) * (1 + 3 / n),
  mix: (n) => (n % 3 === 0 ? 2 : n % 3 === 1 ? -1 : 0.5) + 2 / n,
};
const LABEL: Record<Seq, string> = { alt: "(−1)ⁿ(1 + 2/n)", sin: "sin n · (1 + 3/n)", mix: "period 3 + 2/n" };
const LIM: Record<Seq, [number, number]> = { alt: [1, -1], sin: [1, -1], mix: [2, -1] };
const N = 150;

/** A bounded sequence with its tail suprema and tail infima, which decrease and increase to limsup and liminf. */
export function LimsupEnvelopeViz() {
  const [seq, setSeq] = useState<Seq>("alt");
  const [m, setM] = useState(20);
  const xs = Array.from({ length: N }, (_, i) => F[seq](i + 1));
  const sups: number[] = new Array(N), infs: number[] = new Array(N);
  let hi = -Infinity, lo = Infinity;
  for (let i = N - 1; i >= 0; i--) { hi = Math.max(hi, xs[i]); lo = Math.min(lo, xs[i]); sups[i] = hi; infs[i] = lo; }
  const W = 330, H = 190;
  const yMax = 3.2, yMin = -3.2;
  const X = (i: number) => 26 + (i / (N - 1)) * (W - 34);
  const Y = (v: number) => 8 + ((yMax - Math.max(yMin, Math.min(yMax, v))) / (yMax - yMin)) * (H - 28);
  const line = (arr: number[]) => arr.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const [ls, li] = LIM[seq];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(F) as Seq[]).map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={seq === s} onClick={() => setSeq(s)}>{LABEL[s]}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {m}
          <input type="range" min={1} max={N - 20} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="index n" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Sequence with its upper and lower tail envelopes">
        {[ls, li].map((v, i) => <line key={i} x1={26} x2={W - 8} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeDasharray="4 3" />)}
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} points={line(sups.slice(0, N - 20))} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(infs.slice(0, N - 20))} />
        {xs.slice(0, N - 20).map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={1.6} fill="var(--text-muted)" />)}
        <line x1={X(m - 1)} x2={X(m - 1)} y1={Y(sups[m - 1])} y2={Y(infs[m - 1])} stroke="var(--text)" strokeWidth={1.4} />
        <text x={22} y={Y(ls) + 4} textAnchor="end" className="viz-label">{ls}</text>
        <text x={22} y={Y(li) + 4} textAnchor="end" className="viz-label">{li}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        sup of terms from n on: {sups[m - 1].toFixed(3)}; inf: {infs[m - 1].toFixed(3)}; limsup {ls}, liminf {li}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The upper curve at n is the supremum of all terms from n onwards, and the lower curve the infimum. As n grows there
        is less to take the supremum over, so the upper curve can only fall and the lower can only rise; both are monotone
        and bounded, so they converge, to limsup and liminf (dashed). The sequence converges exactly when the two meet.
      </figcaption>
    </figure>
  );
}
