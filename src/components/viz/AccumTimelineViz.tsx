"use client";

import { useState } from "react";

const TMB = 100, C = 70, H = 30;
const KS = [1, 2, 4, 8];

/**
 * One replica's step with k accumulation micro-batches of 100 ms each. The gradient all-reduce costs 70 ms, of which 30 ms hides
 * behind the backward pass it overlaps. With no_sync only the last micro-batch all-reduces; without it every micro-batch does.
 */
export function accumTimeline(k: number, noSync: boolean) {
  const e = Math.max(0, C - H);
  const blocks: { kind: "compute" | "comm"; a: number; b: number }[] = [];
  let t = 0;
  for (let j = 1; j <= k; j++) {
    blocks.push({ kind: "compute", a: t, b: t + TMB });
    t += TMB;
    if (!noSync || j === k) {
      blocks.push({ kind: "comm", a: t, b: t + e });
      t += e;
    }
  }
  return { blocks, total: t, exposed: noSync ? e : k * e };
}

export function AccumTimelineViz() {
  const [i, setI] = useState(2);
  const [noSync, setNoSync] = useState(true);
  const k = KS[i];
  const r = accumTimeline(k, noSync);
  const W = 330, X0 = 8, PW = 314;
  const MAX = 1200;
  const px = (t: number) => X0 + (t / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Accumulation steps">
          {KS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>k = {v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Synchronisation">
          <button type="button" className="seg" aria-pressed={noSync} onClick={() => setNoSync(true)}>no_sync</button>
          <button type="button" className="seg" aria-pressed={!noSync} onClick={() => setNoSync(false)}>sync every time</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} 64`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Time line of micro-batches and exposed all-reduces">
        {r.blocks.map((b, j) => (
          <rect key={j} x={px(b.a)} y={10} width={Math.max(px(b.b) - px(b.a) - 1, 0.5)} height={22}
            style={{ fill: b.kind === "compute" ? "var(--text-muted)" : "var(--accent)" }} opacity={b.kind === "compute" ? 0.6 : 1} />
        ))}
        <line x1={px(0)} x2={px(MAX)} y1={40} y2={40} stroke="var(--border)" />
        {[0, 400, 800, 1200].map((v) => <text key={v} x={px(v)} y={54} textAnchor={v === 0 ? "start" : v === 1200 ? "end" : "middle"} className="viz-label">{v} ms</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        step {r.total} ms for {k} micro-batch{k > 1 ? "es" : ""}; exposed all-reduce {r.exposed} ms ({((100 * r.exposed) / r.total).toFixed(1)}%)
      </div>
      <figcaption className="viz-caption">
        Grey blocks are a micro-batch&apos;s forward and backward pass, accent blocks the part of the gradient all-reduce that the
        backward pass does not hide. Skipping synchronisation until the last micro-batch pays that cost once per optimiser step, so its
        share of the step falls as the number of micro-batches grows.
      </figcaption>
    </figure>
  );
}
