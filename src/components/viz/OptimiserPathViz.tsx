"use client";

import { useMemo, useState } from "react";

type Kind = "sgd" | "momentum" | "adam";
const T = 40;
const f = (x: number, y: number) => 0.5 * (x * x + 25 * y * y);

function path(kind: Kind): [number, number][] {
  let x = -4, y = 1.5, vx = 0, vy = 0, mx = 0, my = 0, sx = 0, sy = 0;
  const pts: [number, number][] = [[x, y]];
  for (let t = 1; t <= T; t++) {
    const gx = x, gy = 25 * y;
    if (kind === "sgd") { x -= 0.07 * gx; y -= 0.07 * gy; }
    else if (kind === "momentum") { vx = 0.7 * vx + gx; vy = 0.7 * vy + gy; x -= 0.05 * vx; y -= 0.05 * vy; }
    else {
      mx = 0.9 * mx + 0.1 * gx; my = 0.9 * my + 0.1 * gy;
      sx = 0.999 * sx + 0.001 * gx * gx; sy = 0.999 * sy + 0.001 * gy * gy;
      const c1 = 1 - 0.9 ** t, c2 = 1 - 0.999 ** t;
      x -= (0.2 * (mx / c1)) / (Math.sqrt(sx / c2) + 1e-8);
      y -= (0.2 * (my / c1)) / (Math.sqrt(sy / c2) + 1e-8);
    }
    pts.push([x, y]);
  }
  return pts;
}

const CAP: Record<Kind, string> = {
  sgd: "Plain SGD, lr 0.07. The valley is 25 times steeper across than along, so the steps bounce across it while creeping slowly along it.",
  momentum: "Momentum 0.7, lr 0.05. The velocity averages recent gradients: the bounces across the valley cancel and the pushes along it add up.",
  adam: "Adam, lr 0.2. Each coordinate's step is divided by the running size of its own gradient, so at first both coordinates move by about lr per step whatever their gradients, and the steep direction no longer forces a tiny learning rate on the flat one.",
};

/** Paths of SGD, momentum and Adam on a long, narrow quadratic valley. */
export function OptimiserPathViz() {
  const [kind, setKind] = useState<Kind>("sgd");
  const [k, setK] = useState(T);
  const pts = useMemo(() => path(kind), [kind]);
  const W = 340, H = 170;
  const px = (x: number) => W / 2 + x * 38, py = (y: number) => H / 2 - y * 38;
  const [cx, cy] = pts[k];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(["sgd", "momentum", "adam"] as Kind[]).map((q) => (
          <button key={q} type="button" className="seg" aria-pressed={kind === q} onClick={() => setKind(q)}>{q === "sgd" ? "SGD" : q === "adam" ? "Adam" : "momentum"}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Optimiser path on contours of a narrow valley">
        {[0.5, 2, 4.5, 8, 12.5].map((c) => (
          <ellipse key={c} cx={px(0)} cy={py(0)} rx={Math.sqrt(2 * c) * 38} ry={(Math.sqrt(2 * c) / 5) * 38} fill="none" stroke="var(--border)" />
        ))}
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} points={pts.slice(0, k + 1).map(([x, y]) => `${px(x)},${py(y)}`).join(" ")} />
        {pts.slice(0, k + 1).map(([x, y], i) => <circle key={i} cx={px(x)} cy={py(y)} r={1.8} fill="var(--accent)" />)}
        <circle cx={px(cx)} cy={py(cy)} r={4} fill="var(--danger)" />
        <circle cx={px(0)} cy={py(0)} r={2.5} fill="var(--text)" />
      </svg>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          step {k}
          <input type="range" min={0} max={T} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="step" style={{ width: 160 }} />
          loss {f(cx, cy).toFixed(4)}
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Loss ½(x² + 25y²), starting at (−4, 1.5). {CAP[kind]}
      </figcaption>
    </figure>
  );
}
