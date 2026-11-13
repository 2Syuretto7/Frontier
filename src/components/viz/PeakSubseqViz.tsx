"use client";

import { useState } from "react";

type Seq = "sin" | "alt";
const F: Record<Seq, (n: number) => number> = {
  sin: (n) => Math.sin(n),
  alt: (n) => (n % 2 === 0 ? 1 : -1) * (1 + 1 / n) * 0.8,
};

/** Peaks of a bounded sequence (terms at least as large as every later term) form a decreasing subsequence. */
export function PeakSubseqViz() {
  const [seq, setSeq] = useState<Seq>("sin");
  const [N, setN] = useState(40);
  const xs = Array.from({ length: N }, (_, i) => F[seq](i + 1));
  const isPeak: boolean[] = new Array(N).fill(false);
  let best = -Infinity;
  for (let i = N - 1; i >= 0; i--) if (xs[i] >= best) { isPeak[i] = true; best = xs[i]; }
  const peakIdx = xs.map((_, i) => i).filter((i) => isPeak[i]);
  const W = 330, H = 180;
  const X = (i: number) => 20 + (i / Math.max(1, N - 1)) * (W - 30);
  const Y = (v: number) => H / 2 - v * (H / 2 - 14);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={seq === "sin"} onClick={() => setSeq("sin")}>sin n</button>
        <button type="button" className="seg" aria-pressed={seq === "alt"} onClick={() => setSeq("alt")}>±(1 + 1/n)</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          terms {N}
          <input type="range" min={10} max={120} value={N} onChange={(e) => setN(Number(e.target.value))} aria-label="number of terms" style={{ width: 130 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Terms of the sequence with the peaks joined into a decreasing subsequence">
        <line x1={20} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.6} points={peakIdx.map((i) => `${X(i).toFixed(1)},${Y(xs[i]).toFixed(1)}`).join(" ")} />
        {xs.map((v, i) => (
          <circle key={i} cx={X(i)} cy={Y(v)} r={isPeak[i] ? 3.4 : 2} fill={isPeak[i] ? "var(--danger)" : "var(--text-muted)"} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        peaks among the first {N} terms: {peakIdx.length}; last peak value {xs[peakIdx[peakIdx.length - 1]].toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A term is a peak if no later term is larger. Joined in order, the peaks never go up, so they form a decreasing
        subsequence. In the infinite sequence either there are infinitely many peaks, giving a decreasing subsequence, or
        after the last peak every term has a strictly larger term later, giving an increasing one. Here only the visible
        terms are checked, so the peak set changes as you show more terms.
      </figcaption>
    </figure>
  );
}
