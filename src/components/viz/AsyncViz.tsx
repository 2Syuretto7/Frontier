"use client";

import { useState } from "react";

type Seg = { k: number; s: number; e: number; kind: "cpu" | "wait" };

const C1 = 1, C2 = 1;

function blocking(n: number, w: number): Seg[] {
  const out: Seg[] = [];
  let t = 0;
  for (let k = 0; k < n; k++) {
    out.push({ k, s: t, e: t + C1, kind: "cpu" }, { k, s: t + C1, e: t + C1 + w, kind: "wait" }, { k, s: t + C1 + w, e: t + C1 + w + C2, kind: "cpu" });
    t += C1 + w + C2;
  }
  return out;
}

function eventLoop(n: number, w: number): Seg[] {
  const out: Seg[] = [];
  const ready: { k: number; phase: number }[] = Array.from({ length: n }, (_, k) => ({ k, phase: 0 }));
  const waking: { t: number; k: number }[] = [];
  let t = 0;
  const wake = () => {
    waking.sort((a, b) => a.t - b.t || a.k - b.k);
    while (waking.length && waking[0].t <= t) ready.push({ k: waking.shift()!.k, phase: 1 });
  };
  while (ready.length || waking.length) {
    if (!ready.length) t = Math.max(t, Math.min(...waking.map((x) => x.t)));
    wake();
    const { k, phase } = ready.shift()!;
    if (phase === 0) {
      out.push({ k, s: t, e: t + C1, kind: "cpu" });
      t += C1;
      out.push({ k, s: t, e: t + w, kind: "wait" });
      waking.push({ t: t + w, k });
    } else {
      out.push({ k, s: t, e: t + C2, kind: "cpu" });
      t += C2;
    }
    wake();
  }
  return out;
}

/** n requests, each one unit of CPU, a network wait, and one more unit of CPU: blocking calls versus one event loop. */
export function AsyncViz() {
  const [n, setN] = useState(5);
  const [w, setW] = useState(6);
  const [mode, setMode] = useState<"block" | "async">("async");
  const segs = mode === "block" ? blocking(n, w) : eventLoop(n, w);
  const total = Math.max(...segs.map((g) => g.e));
  const maxT = n * (C1 + w + C2);
  const X0 = 30, W = 460, U = (W - X0 - 10) / maxT, RH = 18;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Style">
        <button type="button" className="seg" aria-pressed={mode === "block"} onClick={() => setMode("block")}>blocking, one at a time</button>
        <button type="button" className="seg" aria-pressed={mode === "async"} onClick={() => setMode("async")}>event loop</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>{n} requests</span>
          <input type="range" min={1} max={8} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Number of requests" />
        </label>
        <label>
          <span>Network wait {w}</span>
          <input type="range" min={1} max={12} value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="Network wait" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${n * RH + 24}`} role="img" aria-label={`Total time ${total}`}>
        {Array.from({ length: n }, (_, k) => (
          <text key={k} x={4} y={10 + k * RH + 9} className="plot-tick" style={{ fontSize: 10 }}>r{k + 1}</text>
        ))}
        {segs.map((g, i) => (
          <rect key={i} x={X0 + g.s * U} y={10 + g.k * RH} width={Math.max(1, (g.e - g.s) * U)} height={RH - 5} rx={2}
            className={g.kind === "cpu" ? "viz-cell is-on" : "viz-cell"} style={g.kind === "wait" ? { strokeDasharray: "3 3", opacity: 0.7 } : undefined} />
        ))}
        <line x1={X0 + total * U} x2={X0 + total * U} y1={4} y2={n * RH + 10} className="plot-grid" style={{ strokeWidth: 2 }} />
        <text x={Math.min(X0 + total * U, W - 30)} y={n * RH + 21} textAnchor="middle" className="plot-tick" style={{ fontSize: 10 }}>{total}</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Solid bars use the CPU; dashed bars wait for the network. Total time <span className="mono">{total}</span>, against{" "}
        <span className="mono">{2 * n}</span> units of actual CPU work.{" "}
        {mode === "block"
          ? "Each blocking call leaves the thread idle for the whole wait."
          : "The loop starts every request, then handles each reply as it arrives: the waits overlap, and only the CPU work is serial."}
      </figcaption>
    </figure>
  );
}
