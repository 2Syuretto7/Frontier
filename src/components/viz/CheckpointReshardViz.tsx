"use client";

import { useState } from "react";

const N = 120, K = 8;
const KS = [4, 5, 6, 8, 12];

export function ranges(n: number, k: number) {
  const q = Math.floor(n / k), r = n % k;
  const out: [number, number][] = [];
  let lo = 0;
  for (let i = 0; i < k; i++) { const hi = lo + q + (i < r ? 1 : 0); out.push([lo, hi]); lo = hi; }
  return out;
}

/** Every (saved shard, new shard) pair whose ranges overlap is one read when loading onto the new layout. */
export function reads(k2: number) {
  const a = ranges(N, K), b = ranges(N, k2);
  const out: { s: number; t: number; lo: number; hi: number }[] = [];
  b.forEach(([lo, hi], t) => a.forEach(([x, y], s) => { const l = Math.max(lo, x), h = Math.min(hi, y); if (l < h) out.push({ s, t, lo: l, hi: h }); }));
  return out;
}

export function CheckpointReshardViz() {
  const [i, setI] = useState(1);
  const k2 = KS[i];
  const rd = reads(k2);
  const W = 330, X0 = 70, PW = 250, Y1 = 14, Y2 = 74, BH = 18;
  const px = (v: number) => X0 + (v / N) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Ranks after restart">
          {KS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={i === j} onClick={() => setI(j)}>{v} ranks</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y2 + BH + 8}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Saved shards above, new shards below, and the reads that connect them">
        <text x={X0 - 6} y={Y1 + 13} textAnchor="end" className="viz-label">saved on 8</text>
        <text x={X0 - 6} y={Y2 + 13} textAnchor="end" className="viz-label">load on {k2}</text>
        {ranges(N, K).map(([a, b], s) => <rect key={`s${s}`} x={px(a)} y={Y1} width={px(b) - px(a) - 1} height={BH} style={{ fill: "var(--text-muted)" }} opacity={s % 2 ? 0.55 : 0.8} />)}
        {ranges(N, k2).map(([a, b], t) => <rect key={`t${t}`} x={px(a)} y={Y2} width={px(b) - px(a) - 1} height={BH} style={{ fill: "var(--accent)" }} opacity={t % 2 ? 0.55 : 0.85} />)}
        {rd.map((r, j) => (
          <polygon key={j} points={`${px(r.lo)},${Y1 + BH} ${px(r.hi) - 1},${Y1 + BH} ${px(r.hi) - 1},${Y2} ${px(r.lo)},${Y2}`}
            style={{ fill: "var(--accent)", stroke: "var(--bg)" }} opacity={0.18} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {rd.length} reads to rebuild {k2} shards from 8 saved ones
      </div>
      <figcaption className="viz-caption">
        A flat tensor of 120 elements saved as eight shards and reloaded on a different number of ranks. Each band is one read: a
        new rank takes the overlapping slice of one saved shard. A rank reads from every saved shard its range touches, so the number
        of reads is the number of pieces the two sets of cut points make together.
      </figcaption>
    </figure>
  );
}
