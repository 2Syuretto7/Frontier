"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const SIZE = 10, SPAN = 60, COUNT = 120, DELAYS = [0, 2, 5, 10];

/** Events with exponential network delays (mean 1.5 s) processed in arrival order with tumbling windows and a watermark. */
export function streamRun(maxDelay: number, seed = 21) {
  const r = rand(seed);
  const ev = Array.from({ length: COUNT }, () => { const t = SPAN * r(); return { t, a: t - 1.5 * Math.log(1 - r()) }; }).sort((x, y) => x.a - y.a);
  let wm = -Infinity;
  const closedAt = new Map<number, number>(), late: boolean[] = [];
  for (const e of ev) {
    const start = Math.floor(e.t / SIZE) * SIZE;
    late.push(closedAt.has(start));
    if (!closedAt.has(start)) wm = Math.max(wm, e.t - maxDelay);
    for (let s = 0; s + SIZE <= wm; s += SIZE) if (!closedAt.has(s)) closedAt.set(s, e.a);
  }
  const waits = [...closedAt].map(([s, a]) => a - (s + SIZE));
  return { ev, late, dropped: late.filter(Boolean).length, wait: waits.reduce((x, y) => x + y, 0) / waits.length };
}

export function WatermarkViz() {
  const [di, setDi] = useState(1);
  const { ev, late, dropped, wait } = useMemo(() => streamRun(DELAYS[di]), [di]);
  const W = 330, H = 190, X0 = 34, Y0 = 8, PW = W - 42, PH = H - Y0 - 34, AMAX = 8;
  const sx = (t: number) => X0 + (t / SPAN) * PW, sy = (a: number) => Y0 + PH - (Math.min(a, AMAX) / AMAX) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">allowed delay</span>
        <div className="segmented" role="group" aria-label="Watermark delay">
          {DELAYS.map((d, i) => <button key={d} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{`${d} s`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Delay of each event against its event time, late events marked">
        {[0, 2, 4, 6, 8].map((a) => (
          <g key={a}>
            <line x1={X0} x2={X0 + PW} y1={sy(a)} y2={sy(a)} stroke="var(--border)" strokeDasharray={a ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(a) + 4} textAnchor="end" className="viz-label">{a}</text>
          </g>
        ))}
        {[10, 20, 30, 40, 50].map((t) => <line key={t} x1={sx(t)} x2={sx(t)} y1={Y0} y2={Y0 + PH} stroke="var(--border)" />)}
        {ev.map((e, i) => <circle key={i} cx={sx(e.t)} cy={sy(e.a - e.t)} r={late[i] ? 3.2 : 2.2} fill={late[i] ? "var(--danger)" : "var(--accent)"} />)}
        {[0, 10, 20, 30, 40, 50, 60].map((t) => <text key={t} x={sx(t)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">event time (s), windows of 10 s; vertical: delay (s)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`late events dropped ${dropped} of ${COUNT}; windows close on average ${wait.toFixed(1)} s after they end`}
      </div>
      <figcaption className="viz-caption">
        120 events over a minute, each reaching the processor after a random delay (its height). The
        processor counts them in 10-second windows by event time, and closes a window once the watermark, the largest event
        time seen minus the allowed delay, passes its end. Events for a window already closed are late and dropped (red).
        Allowing no delay drops 8 events and closes windows on average 1.3 s after they end. Allowing 2 s drops none in this
        run, and each further second of allowance delays every result by about a second: 11.2 s on average at 10 s.
      </figcaption>
    </figure>
  );
}
