"use client";

import { useState } from "react";

const ROUNDS = 32;

function trace(events: Record<number, "dup" | "timeout">, start: number) {
  let cwnd = 1, ss = start;
  const out: { cwnd: number; ss: number }[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    out.push({ cwnd, ss });
    const e = events[r];
    if (e) { ss = Math.max(Math.floor(cwnd / 2), 2); cwnd = e === "timeout" ? 1 : ss; }
    else if (cwnd < ss) cwnd = Math.min(2 * cwnd, ss);
    else cwnd += 1;
  }
  return out;
}

/** TCP's congestion window per round trip: slow start, additive increase, and halving on loss. Click a round to mark a loss there. */
export function CwndViz() {
  const [events, setEvents] = useState<Record<number, "dup" | "timeout">>({ 12: "dup", 22: "dup" });
  const [kind, setKind] = useState<"dup" | "timeout">("dup");
  const t = trace(events, 16);
  const maxY = Math.max(24, ...t.map((p) => p.cwnd)) + 2;
  const X0 = 30, W = 470, H = 200, Y0 = 170;
  const x = (r: number) => X0 + (r * (W - X0 - 10)) / (ROUNDS - 1);
  const y = (v: number) => Y0 - (v * (Y0 - 10)) / maxY;
  const toggle = (r: number) => {
    const e = { ...events };
    if (e[r]) delete e[r]; else e[r] = kind;
    setEvents(e);
  };
  const sent = t.reduce((s, p) => s + p.cwnd, 0);
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Loss signal">
        <button type="button" className="seg" aria-pressed={kind === "dup"} onClick={() => setKind("dup")}>loss seen by duplicate ACKs</button>
        <button type="button" className="seg" aria-pressed={kind === "timeout"} onClick={() => setKind("timeout")}>loss seen by timeout</button>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setEvents({})}>No losses</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Congestion window over ${ROUNDS} round trips`}>
        {[0, 8, 16, 24, 32].filter((v) => v <= maxY).map((v) => (
          <g key={v}>
            <line x1={X0} x2={W - 10} y1={y(v)} y2={y(v)} className="plot-grid" />
            <text x={X0 - 4} y={y(v) + 3} textAnchor="end" className="plot-tick" style={{ fontSize: 9 }}>{v}</text>
          </g>
        ))}
        <polyline points={t.map((p, r) => `${x(r)},${y(p.ss)}`).join(" ")} className="plot-curve" style={{ strokeDasharray: "4 4", opacity: 0.6 }} fill="none" />
        <polyline points={t.map((p, r) => `${x(r)},${y(p.cwnd)}`).join(" ")} className="plot-curve" fill="none" style={{ strokeWidth: 2.5 }} />
        {t.map((p, r) => (
          <g key={r} onClick={() => toggle(r)} style={{ cursor: "pointer" }}>
            <rect x={x(r) - 6} y={4} width={12} height={Y0} fill="transparent" />
            <circle cx={x(r)} cy={y(p.cwnd)} r={events[r] ? 5 : 2.5} className="viz-node" style={events[r] ? { fill: "var(--danger)" } : undefined} />
          </g>
        ))}
        <text x={W - 10} y={H - 6} textAnchor="end" className="plot-tick" style={{ fontSize: 10 }}>round trip</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Solid: congestion window in segments; dashed: the slow-start threshold. Click a round to add or remove a loss (red).
        Over {ROUNDS} round trips the sender sent <span className="mono">{sent}</span> segments.{" "}
        {kind === "timeout"
          ? "A timeout means the pipe may be empty, so TCP starts again from one segment."
          : "Duplicate ACKs mean later packets still arrive, so TCP only halves the window: the sawtooth of additive increase, multiplicative decrease."}
      </figcaption>
    </figure>
  );
}
