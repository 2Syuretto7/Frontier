"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function draws() {
  const r = makeRng(11);
  return Array.from({ length: 400 }, () => {
    const u1 = r(), u2 = r(), rad = Math.sqrt(-2 * Math.log(1 - u1));
    return { x: rad * Math.cos(2 * Math.PI * u2), z: rad * Math.sin(2 * Math.PI * u2), s: r() < 0.5 ? -1 : 1 };
  });
}

/** Two pairs with standard normal marginals and zero correlation: (X, Z) independent and jointly normal, (X, SX) dependent and not jointly normal. */
export function SignFlipViz() {
  const d = useMemo(draws, []);
  const [mode, setMode] = useState<"joint" | "flip">("flip");
  const pts = d.map((p) => [p.x, mode === "joint" ? p.z : p.s * p.x]);
  const W = 300, H = 240;
  const X = (x: number) => W / 2 + x * 36, Y = (y: number) => H / 2 - y * 30;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={mode === "joint"} onClick={() => setMode("joint")}>(X, Z) independent</button>
        <button type="button" className="seg" aria-pressed={mode === "flip"} onClick={() => setMode("flip")}>(X, S·X), random sign S</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter plots of two uncorrelated pairs with normal marginals">
        <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--border)" />
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="var(--border)" />
        {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={2} fill={mode === "joint" ? "var(--accent)" : "var(--danger)"} opacity={0.55} />)}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "joint"
          ? "X and Z are independent standard normals: a round cloud. The pair is jointly normal, and uncorrelated jointly normal variables are independent."
          : "Y = S·X with S = ±1 by a fair coin is also standard normal, and Cov(X, Y) = E[S]E[X²] = 0. But every point lies on one of the two diagonals, |Y| = |X|, so they are strongly dependent. The pair is not jointly normal: X + Y is 0 half the time."}
      </figcaption>
    </figure>
  );
}
