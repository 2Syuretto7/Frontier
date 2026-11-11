"use client";

import { useState } from "react";

type Job = { name: string; arrival: number; burst: number };
type Seg = { name: string; s: number; e: number };

const JOBS: Job[] = [
  { name: "A", arrival: 0, burst: 8 },
  { name: "B", arrival: 1, burst: 4 },
  { name: "C", arrival: 2, burst: 9 },
  { name: "D", arrival: 3, burst: 2 },
];

function merge(segs: Seg[]) {
  const out: Seg[] = [];
  for (const g of segs) {
    const l = out[out.length - 1];
    if (l && l.name === g.name && l.e === g.s) l.e = g.e;
    else out.push({ ...g });
  }
  return out;
}

function nonPreemptive(sjf: boolean): Seg[] {
  const pending = JOBS.map((j, k) => ({ ...j, k }));
  const segs: Seg[] = [];
  let t = 0;
  while (pending.length) {
    const ready = pending.filter((j) => j.arrival <= t);
    if (!ready.length) { t = Math.min(...pending.map((j) => j.arrival)); continue; }
    ready.sort((a, b) => (sjf ? a.burst - b.burst : 0) || a.arrival - b.arrival || a.k - b.k);
    const j = ready[0];
    pending.splice(pending.indexOf(j), 1);
    segs.push({ name: j.name, s: t, e: t + j.burst });
    t += j.burst;
  }
  return segs;
}

function srtf(): Seg[] {
  const left = JOBS.map((j) => j.burst);
  const segs: Seg[] = [];
  let t = 0;
  while (left.some((x) => x > 0)) {
    const ready = JOBS.map((j, k) => k).filter((k) => left[k] > 0 && JOBS[k].arrival <= t);
    if (!ready.length) { t++; continue; }
    ready.sort((a, b) => left[a] - left[b] || JOBS[a].arrival - JOBS[b].arrival || a - b);
    const k = ready[0];
    segs.push({ name: JOBS[k].name, s: t, e: t + 1 });
    left[k]--; t++;
  }
  return merge(segs);
}

function rr(q: number): Seg[] {
  const left = JOBS.map((j) => j.burst);
  const queue: number[] = [];
  const segs: Seg[] = [];
  let t = 0, next = 0;
  const admit = () => { while (next < JOBS.length && JOBS[next].arrival <= t) queue.push(next++); };
  while (next < JOBS.length || queue.length) {
    admit();
    if (!queue.length) { t = JOBS[next].arrival; continue; }
    const k = queue.shift()!;
    const run = Math.min(q, left[k]);
    segs.push({ name: JOBS[k].name, s: t, e: t + run });
    t += run; left[k] -= run;
    admit();
    if (left[k] > 0) queue.push(k);
  }
  return merge(segs);
}

const POLICIES = { fcfs: "FCFS", sjf: "SJF", srtf: "SRTF", rr: "Round robin" } as const;
type Policy = keyof typeof POLICIES;

/** Four jobs on one CPU under four scheduling policies, as a Gantt chart with average waiting and response times. */
export function SchedViz() {
  const [pol, setPol] = useState<Policy>("rr");
  const [q, setQ] = useState(2);
  const segs = pol === "fcfs" ? nonPreemptive(false) : pol === "sjf" ? nonPreemptive(true) : pol === "srtf" ? srtf() : rr(q);
  const end = Math.max(...segs.map((g) => g.e));
  const stats = JOBS.map((j) => {
    const mine = segs.filter((g) => g.name === j.name);
    const fin = Math.max(...mine.map((g) => g.e)), start = Math.min(...mine.map((g) => g.s));
    return { wait: fin - j.arrival - j.burst, resp: start - j.arrival };
  });
  const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2);
  const switches = segs.length - 1;
  const U = 13, X0 = 24, W = X0 + end * U + 10;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Policy">
        {(Object.keys(POLICIES) as Policy[]).map((p) => (
          <button key={p} type="button" className="seg" aria-pressed={pol === p} onClick={() => setPol(p)}>{POLICIES[p]}</button>
        ))}
      </div>
      {pol === "rr" && (
        <div className="viz-sliders">
          <label>
            <span>Quantum {q}</span>
            <input type="range" min={1} max={10} value={q} onChange={(e) => setQ(Number(e.target.value))} aria-label="Time quantum" />
          </label>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${JOBS.length * 22 + 26}`} role="img" aria-label={`Average waiting time ${avg(stats.map((s) => s.wait))}`}>
        {JOBS.map((j, r) => (
          <g key={j.name}>
            <text x={4} y={14 + r * 22 + 4} className="plot-tick" style={{ fontSize: 11 }}>{j.name}</text>
            <line x1={X0 + j.arrival * U} x2={X0 + j.arrival * U} y1={14 + r * 22 - 9} y2={14 + r * 22 + 9} className="plot-grid" style={{ strokeWidth: 2 }} />
            {segs.filter((g) => g.name === j.name).map((g, i) => (
              <rect key={i} x={X0 + g.s * U} y={14 + r * 22 - 8} width={(g.e - g.s) * U} height={16} rx={2} className="viz-cell is-on" />
            ))}
          </g>
        ))}
        {Array.from({ length: Math.floor(end / 5) + 1 }, (_, i) => (
          <text key={i} x={X0 + i * 5 * U} y={JOBS.length * 22 + 20} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{i * 5}</text>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Jobs (arrival, burst): A (0, 8), B (1, 4), C (2, 9), D (3, 2); the tick marks arrival. Average waiting{" "}
        <span className="mono">{avg(stats.map((s) => s.wait))}</span>, average response{" "}
        <span className="mono">{avg(stats.map((s) => s.resp))}</span>, <span className="mono">{switches}</span> switches.{" "}
        {pol === "srtf" ? "Shortest remaining time first gives the least average waiting of any schedule." : pol === "rr" ? "A small quantum gives quick responses but many switches; a huge one turns into FCFS." : pol === "sjf" ? "SJF cannot interrupt A, but then always runs the shortest ready job." : "Short jobs stuck behind a long one wait: the convoy effect."}
      </figcaption>
    </figure>
  );
}
