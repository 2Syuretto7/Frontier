"use client";

import { useState } from "react";

const P = 4, M = 8, F = 1, B = 2;
type Op = ["F" | "B", number];

export function stageOrder(s: number, oneF: boolean): Op[] {
  if (!oneF) return [...Array.from({ length: M }, (_, j): Op => ["F", j]), ...Array.from({ length: M }, (_, j): Op => ["B", j])];
  const warm = Math.min(P - s, M);
  const o: Op[] = Array.from({ length: warm }, (_, j): Op => ["F", j]);
  for (let j = 0; j < M - warm; j++) o.push(["B", j], ["F", warm + j]);
  for (let j = M - warm; j < M; j++) o.push(["B", j]);
  return o;
}

/** Event-driven timing of per-stage op orders: a forward needs the previous stage's forward, a backward the next stage's backward. */
export function runSchedule(oneF: boolean) {
  const orders = Array.from({ length: P }, (_, s) => stageOrder(s, oneF));
  const T = new Map<string, [number, number]>();
  const pos = Array(P).fill(0), free = Array(P).fill(0);
  let progress = true;
  while (progress) {
    progress = false;
    for (let s = 0; s < P; s++) {
      if (pos[s] === orders[s].length) continue;
      const [k, j] = orders[s][pos[s]];
      const dep = k === "F" ? (s ? `${s - 1}F${j}` : null) : s < P - 1 ? `${s + 1}B${j}` : `${s}F${j}`;
      if (dep && !T.has(dep)) continue;
      const a = Math.max(free[s], dep ? T.get(dep)![1] : 0);
      free[s] = a + (k === "F" ? F : B);
      T.set(`${s}${k}${j}`, [a, free[s]]);
      pos[s]++;
      progress = true;
    }
  }
  const peaks = orders.map((o) => {
    let live = 0, peak = 0;
    for (const [k] of o) { live += k === "F" ? 1 : -1; peak = Math.max(peak, live); }
    return peak;
  });
  return { T, end: Math.max(...free), peaks };
}

export function OneFOneBViz() {
  const [oneF, setOneF] = useState(true);
  const r = runSchedule(oneF);
  const W = 330, X0 = 50, PW = 272, RH = 20, Y0 = 6, MAX = 33;
  const px = (t: number) => X0 + (t / MAX) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Schedule">
          <button type="button" className="seg" aria-pressed={!oneF} onClick={() => setOneF(false)}>GPipe</button>
          <button type="button" className="seg" aria-pressed={oneF} onClick={() => setOneF(true)}>1F1B</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + P * RH + 6}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Pipeline schedule on four stages with eight micro-batches">
        {Array.from({ length: P }, (_, s) => (
          <g key={s}>
            <text x={X0 - 6} y={Y0 + s * RH + 13} textAnchor="end" className="viz-label">stage {s}</text>
            <rect x={px(0)} y={Y0 + s * RH} width={px(r.end) - px(0)} height={RH - 3} style={{ fill: "var(--bg-subtle)" }} />
          </g>
        ))}
        {[...r.T.entries()].map(([key, [a, b]]) => {
          const s = Number(key[0]), k = key[1];
          return (
            <g key={key}>
              <rect x={px(a)} y={Y0 + s * RH} width={px(b) - px(a) - 0.8} height={RH - 3}
                style={{ fill: k === "F" ? "var(--accent)" : "var(--text-muted)" }} opacity={k === "F" ? 0.85 : 0.7} />
              <text x={(px(a) + px(b)) / 2} y={Y0 + s * RH + 12} textAnchor="middle" className="viz-label" style={{ fill: "var(--bg)", fontSize: 7 }}>{key.slice(2)}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        step {r.end} units; micro-batches held at the peak, stage 0 to 3: {r.peaks.join(", ")}
      </div>
      <figcaption className="viz-caption">
        Four stages, eight micro-batches, backward twice as long as forward. Both schedules finish at the same time with the same
        idle triangles. One-forward-one-backward starts each micro-batch&apos;s backward as early as possible, so stage s never holds
        more than 4 − s micro-batches&apos; activations, where GPipe holds all eight.
      </figcaption>
    </figure>
  );
}
