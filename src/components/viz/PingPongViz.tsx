"use client";

import { useState } from "react";

const DS = [64, 128, 256];
const MMA = 989, EXP = 3.9; // dense 16-bit tensor core TFLOP/s and exponentials per second (10^12) on an H100 SXM

type Seg = { lane: number; g: number; s: number; e: number; tc: boolean };

/**
 * Attention tiles for a head dimension d, timed per score: each GEMM takes 2d / 989 and each exponential 1 / 3.9 (in units of
 * 10^-12 s). One warp group runs six tiles alone, or two groups run three tiles each and share the tensor cores; a greedy scheduler
 * starts whichever operation can start soonest. Returns the segments, the makespan and the tensor-core busy fraction.
 */
export function pingPong(d: number, groups: number) {
  const gemm = (2 * d) / MMA, exp = 1 / EXP, tiles = 6 / groups;
  const ops = Array.from({ length: tiles }, () => [["tc", gemm], ["exp", exp], ["tc", gemm]] as [string, number][]).flat();
  const ready = new Array(groups).fill(0), nxt = new Array(groups).fill(0);
  let tcFree = 0, busy = 0;
  const segs: Seg[] = [];
  while (nxt.some((i) => i < ops.length)) {
    let best = -1, bs = Infinity;
    for (let g = 0; g < groups; g++) {
      if (nxt[g] >= ops.length) continue;
      const [kind] = ops[nxt[g]];
      const st = kind === "tc" ? Math.max(ready[g], tcFree) : ready[g];
      if (st < bs) { bs = st; best = g; }
    }
    const [kind, dur] = ops[nxt[best]];
    ready[best] = bs + dur;
    if (kind === "tc") { tcFree = bs + dur; busy += dur; }
    segs.push({ lane: kind === "tc" ? 0 : 1 + best, g: best, s: bs, e: bs + dur, tc: kind === "tc" });
    nxt[best]++;
  }
  const span = Math.max(...ready);
  return { segs, span, util: busy / span };
}

export function PingPongViz() {
  const [k, setK] = useState(1);
  const [m, setM] = useState(1);
  const groups = m + 1;
  const r = pingPong(DS[k], groups);
  const ref = pingPong(DS[k], 1).span;
  const W = 340, X0 = 86, PW = 244, LH = 26, Y0 = 8;
  const lanes = ["tensor cores", "exp, group 1", "exp, group 2"].slice(0, groups + 1);
  const H = Y0 + lanes.length * LH + 22;
  const px = (t: number) => X0 + (t / ref) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Head dimension">
          {DS.map((d, i) => <button key={d} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>d = {d}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Warp groups">
          {["one warp group", "two, ping-pong"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Timeline of matrix multiplications and softmax for attention tiles">
        {lanes.map((n, i) => (
          <g key={n}>
            <text x={X0 - 6} y={Y0 + i * LH + 15} textAnchor="end" className="viz-label">{n}</text>
            <line x1={X0} x2={X0 + PW} y1={Y0 + i * LH + 20} y2={Y0 + i * LH + 20} stroke="var(--border)" />
          </g>
        ))}
        {r.segs.map((sg, i) => (
          <rect key={i} x={px(sg.s)} y={Y0 + sg.lane * LH + 4} width={Math.max(px(sg.e) - px(sg.s) - 0.8, 0.5)} height={16}
            style={{ fill: sg.g === 0 ? "var(--accent)" : "var(--text-muted)" }} opacity={sg.tc ? 0.9 : 0.6} />
        ))}
        <line x1={px(r.span)} x2={px(r.span)} y1={Y0} y2={Y0 + lanes.length * LH} stroke="var(--text)" strokeDasharray="3 2" />
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">time; accent: group 1, grey: group 2</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        tensor cores busy {(100 * r.util).toFixed(0)}% of the time; {(100 * (1 - r.span / ref)).toFixed(0)}% faster than one group
      </div>
      <figcaption className="viz-caption">
        Six tiles of attention, each a score GEMM, a softmax and a second GEMM, timed with the H100&apos;s rates: 989 TFLOP/s on tensor
        cores but only 3.9 trillion exponentials per second. One warp group leaves the tensor cores idle during every softmax. Two groups
        working on different query blocks take turns, one exponentiating while the other multiplies, as in FlashAttention-3.
      </figcaption>
    </figure>
  );
}
