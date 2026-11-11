"use client";

import { useState } from "react";

const CLIENTS = 60, CAP = 10, SLOTS = 32;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Policy = "fixed" | "exp" | "jitter";

function simulate(policy: Policy) {
  const r = rng(7);
  // every client first tries in slot 0; the server handles CAP requests per slot and rejects the rest
  let pending = Array.from({ length: CLIENTS }, (_, id) => ({ id, slot: 0, tries: 0 }));
  const load: number[] = Array(SLOTS).fill(0);
  const served: number[] = Array(SLOTS).fill(0);
  for (let s = 0; s < SLOTS; s++) {
    const now = pending.filter((p) => p.slot === s);
    load[s] = now.length;
    const order = now.map((p) => ({ p, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.p);
    const ok = new Set(order.slice(0, CAP).map((p) => p.id));
    served[s] = Math.min(CAP, now.length);
    pending = pending.filter((p) => !ok.has(p.id));
    for (const p of pending) {
      if (p.slot !== s) continue;
      p.tries++;
      const d = policy === "fixed" ? 1 : Math.min(16, 2 ** (p.tries - 1));
      p.slot = s + (policy === "jitter" ? 1 + Math.floor(r() * 2 * d) : d);
    }
  }
  return { load, served, left: pending.length, done: served.reduce((a, b) => a + b, 0) };
}

/** Sixty clients hit a server that handles ten requests per time slot; rejected clients retry with fixed delays, exponential backoff, or backoff with jitter. */
export function BackoffViz() {
  const [policy, setPolicy] = useState<Policy>("exp");
  const { load, served, left } = simulate(policy);
  const total = load.reduce((a, b) => a + b, 0);
  const lastServed = served.reduce((m, v, i) => (v > 0 ? i : m), 0);
  const maxY = Math.max(CLIENTS, ...load);
  const X0 = 26, W = 470, H = 190, Y0 = 165, bw = (W - X0 - 10) / SLOTS;
  const y = (v: number) => Y0 - (v * (Y0 - 10)) / maxY;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Retry policy">
        <button type="button" className="seg" aria-pressed={policy === "fixed"} onClick={() => setPolicy("fixed")}>retry next slot</button>
        <button type="button" className="seg" aria-pressed={policy === "exp"} onClick={() => setPolicy("exp")}>exponential backoff</button>
        <button type="button" className="seg" aria-pressed={policy === "jitter"} onClick={() => setPolicy("jitter")}>backoff with jitter</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${total} requests in total; ${left} clients still unserved`}>
        {load.map((v, s) => (
          <g key={s}>
            <rect x={X0 + s * bw + 1} y={y(v)} width={bw - 2} height={Y0 - y(v)} className="viz-cell" />
            <rect x={X0 + s * bw + 1} y={y(served[s])} width={bw - 2} height={Y0 - y(served[s])} className="viz-cell is-on" />
          </g>
        ))}
        <line x1={X0} x2={W - 10} y1={y(CAP)} y2={y(CAP)} className="plot-curve" style={{ stroke: "var(--danger)", strokeDasharray: "4 4" }} />
        <text x={W - 12} y={y(CAP) - 4} textAnchor="end" className="plot-tick" style={{ fontSize: 10 }}>capacity</text>
        {[0, 10, 20, 30].map((s) => (
          <text key={s} x={X0 + s * bw + bw / 2} y={H - 8} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{s}</text>
        ))}
        <text x={X0 - 4} y={y(maxY) + 8} textAnchor="end" className="plot-tick" style={{ fontSize: 9 }}>{maxY}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Bars: requests arriving in each time slot; shaded: those served. <span className="mono">{total}</span> requests in
        all for 60 clients; the last client was served in slot <span className="mono">{lastServed}</span>
        {left ? <>, and <span className="mono">{left}</span> were still waiting at the end</> : null}.{" "}
        {policy === "fixed"
          ? "Everyone rejected retries together, so every slot is swamped: wasted requests and an overloaded server."
          : policy === "exp"
            ? "Waiting longer after each failure spreads the load, but clients that failed together still retry together in synchronised waves."
            : "Random jitter breaks up the waves: fewer wasted requests than either other policy, and everyone is served far sooner than with plain backoff."}
      </figcaption>
    </figure>
  );
}
