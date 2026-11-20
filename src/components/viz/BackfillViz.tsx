"use client";

import { useState } from "react";

const TOTAL = 8;
const JOBS: [number, number][] = [[6, 3], [8, 2], [2, 2], [1, 4], [4, 3], [2, 1], [3, 2]];
const COLORS = ["var(--accent)", "var(--danger)", "var(--success)", "var(--code-number)", "var(--code-function)", "var(--text-muted)", "var(--text)"];

type Slot = { start: number; end: number; n: number };
const used = (s: Slot[], x: number) => s.reduce((a, j) => a + (j.start <= x && x < j.end ? j.n : 0), 0);

/** Start times of the jobs (nodes, hours), in queue order, under strict FIFO or conservative backfilling. */
export function scheduleJobs(backfill: boolean) {
  const sched: Slot[] = [];
  let t = 0;
  for (const [n, d] of JOBS) {
    if (backfill) {
      const cands = [...new Set([0, ...sched.map((j) => j.end)])].sort((a, b) => a - b);
      t = cands.find((c) => [c, ...sched.filter((j) => c < j.start && j.start < c + d).map((j) => j.start)].every((x) => used(sched, x) + n <= TOTAL))!;
    } else {
      while (sched.reduce((a, j) => a + (j.end > t ? j.n : 0), 0) + n > TOTAL) t = Math.min(...sched.filter((j) => j.end > t).map((j) => j.end));
    }
    sched.push({ start: t, end: t + d, n });
  }
  const end = Math.max(...sched.map((j) => j.end)), work = JOBS.reduce((a, [n, d]) => a + n * d, 0);
  return { sched, end, util: work / (TOTAL * end), wait: sched.reduce((a, j) => a + j.start, 0) / sched.length };
}

/** Assign each job to rows (nodes) for drawing: at every moment, a running job keeps the same rows. */
function rows(sched: Slot[]) {
  const occ: [number, number][][] = Array.from({ length: TOTAL }, () => []);
  return sched.map((j) => {
    const free = occ.map((iv, r) => (iv.every(([s, e]) => e <= j.start || s >= j.end) ? r : -1)).filter((r) => r >= 0).slice(0, j.n);
    for (const r of free) occ[r].push([j.start, j.end]);
    return free;
  });
}

export function BackfillViz() {
  const [bf, setBf] = useState(true);
  const { sched, end, util, wait } = scheduleJobs(bf), rs = rows(sched);
  const W = 330, H = 160, X0 = 46, Y0 = 6, PW = W - 54, rh = 15, TMAX = 10;
  const sx = (t: number) => X0 + (t / TMAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">policy</span>
        <div className="segmented" role="group" aria-label="Scheduling policy">
          <button type="button" className="seg" aria-pressed={!bf} onClick={() => setBf(false)}>strict FIFO</button>
          <button type="button" className="seg" aria-pressed={bf} onClick={() => setBf(true)}>backfilling</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Which job runs on each node over time">
        {Array.from({ length: TOTAL }, (_, r) => <text key={r} x={X0 - 4} y={Y0 + r * rh + 11} textAnchor="end" className="viz-label">{`node ${r}`}</text>)}
        {Array.from({ length: TMAX + 1 }, (_, t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={Y0} y2={Y0 + TOTAL * rh} stroke="var(--border)" strokeDasharray="2 3" />
            {t % 2 === 0 && <text x={sx(t)} y={Y0 + TOTAL * rh + 13} textAnchor="middle" className="viz-label">{t}</text>}
          </g>
        ))}
        {sched.map((j, k) => rs[k].map((r) => (
          <g key={`${k}-${r}`}>
            <rect x={sx(j.start) + 0.5} y={Y0 + r * rh + 1} width={sx(j.end) - sx(j.start) - 1} height={rh - 2} fill={COLORS[k]} opacity={0.85} />
            <text x={(sx(j.start) + sx(j.end)) / 2} y={Y0 + r * rh + 11} textAnchor="middle" className="viz-label" style={{ fill: "var(--bg)" }}>{`J${k + 1}`}</text>
          </g>
        )))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">hours</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`all jobs done at ${end} h; utilisation ${(util * 100).toFixed(0)}%; mean wait ${wait.toFixed(2)} h`}
      </div>
      <figcaption className="viz-caption">
        Seven jobs queue for an 8-node cluster, in the order J1 to J7, each needing a fixed number of nodes for a fixed time.
        Strict first-in, first-out starts each job only after the one before it, so J3 waits for J2 even though two nodes sit
        idle next to J1. Backfilling lets a later job start early whenever it fits into a gap without delaying any job ahead
        of it: J3 and J6 slip in beside J1, J7 joins J4 and J5, and the queue finishes in 9 hours instead of 10.
      </figcaption>
    </figure>
  );
}
