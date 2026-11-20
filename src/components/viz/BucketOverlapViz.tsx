"use client";

import { useState } from "react";

const S = 2e9, T = 0.4, ALPHA = 50e-6, BETA = 1 / 20e9;
const KS = [1, 4, 40, 400, 40000];

/**
 * Overlap of the gradient all-reduce with the backward pass: 2 GB of gradients produced evenly over a 400 ms backward pass, split
 * into k equal buckets. Each all-reduce costs 50 µs plus the bytes at 20 GB/s, and the network handles buckets one at a time in the
 * order they become ready. Returns each bucket's start and end and the time the step waits after the backward pass.
 */
export function bucketTimeline(k: number) {
  const c = ALPHA + (BETA * S) / k;
  let f = 0;
  const segs: [number, number][] = [];
  for (let j = 1; j <= k; j++) {
    const start = Math.max(f, (j * T) / k);
    f = start + c;
    if (k <= 400) segs.push([start, f]);
  }
  return { segs, finish: f, exposed: f - T, perBucket: c };
}

export function BucketOverlapViz() {
  const [i, setI] = useState(2);
  const k = KS[i];
  const r = bucketTimeline(k);
  const W = 330, X0 = 66, PW = 254, MAX = 0.6;
  const px = (t: number) => X0 + (Math.min(t, MAX) / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Number of buckets">
          {KS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>{v === 1 ? "one bucket" : `${v} buckets`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} 92`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Backward pass and gradient all-reduces on a time line">
        <text x={X0 - 6} y={24} textAnchor="end" className="viz-label">backward</text>
        <rect x={px(0)} y={12} width={px(T) - px(0)} height={18} style={{ fill: "var(--text-muted)" }} opacity={0.7} />
        <text x={X0 - 6} y={52} textAnchor="end" className="viz-label">all-reduce</text>
        {k <= 400
          ? r.segs.map(([a, b], j) => <rect key={j} x={px(a)} y={40} width={Math.max(px(b) - px(a) - (k <= 40 ? 0.8 : 0), 0.4)} height={18} style={{ fill: "var(--accent)" }} />)
          : <rect x={px(T / k)} y={40} width={px(r.finish) - px(T / k)} height={18} style={{ fill: "var(--accent)" }} />}
        <line x1={px(T)} x2={px(T)} y1={8} y2={62} stroke="var(--text)" strokeDasharray="3 2" />
        {r.finish > MAX && <text x={X0 + PW - 4} y={53} textAnchor="end" className="viz-label" style={{ fill: "var(--bg)" }}>continues to {(r.finish * 1000).toFixed(0)} ms</text>}
        {[0, 0.2, 0.4, 0.6].map((v) => <text key={v} x={px(v)} y={78} textAnchor={v === 0.6 ? "end" : "middle"} className="viz-label">{Math.round(v * 1000)} ms</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {k} bucket{k > 1 ? "s" : ""} of {(S / k / 1e6).toFixed(k >= 400 ? 2 : 0)} MB, {(r.perBucket * 1000).toFixed(3)} ms each; the step waits {(r.exposed * 1000).toFixed(2)} ms after the backward pass
      </div>
      <figcaption className="viz-caption">
        Gradients appear steadily during a 400 ms backward pass, last layers first. One all-reduce at the end waits for everything and
        then takes 100 ms. Buckets overlap communication with the rest of the backward pass, leaving only the last bucket exposed. Too
        many tiny buckets pay the fixed cost of each call so often that the network falls behind and the wait grows again.
      </figcaption>
    </figure>
  );
}
