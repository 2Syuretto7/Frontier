"use client";

import { useState } from "react";

const PTS: [number, number, number][] = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];

/** XOR in input space, and the same four points after a hidden layer with and without ReLU. */
export function HiddenSpaceViz() {
  const [act, setAct] = useState<"relu" | "none">("relu");
  const f = (z: number) => (act === "relu" ? Math.max(z, 0) : z);
  const hid = PTS.map(([a, b, t]) => [f(a + b), f(a + b - 1), t] as [number, number, number]);
  const out = hid.map(([h1, h2]) => h1 - 2 * h2);
  const S = 150, pad = 22;
  const panel = (pts: [number, number, number][], lo: number, hi: number, title: string, sep: boolean) => {
    const P = (v: number) => pad + ((v - lo) / (hi - lo)) * (S - 2 * pad);
    const Q = (v: number) => S - pad - ((v - lo) / (hi - lo)) * (S - 2 * pad);
    return (
      <svg viewBox={`0 0 ${S} ${S + 16}`} style={{ width: "48%", maxWidth: 220 }} role="img" aria-label={title}>
        <rect x={pad} y={pad} width={S - 2 * pad} height={S - 2 * pad} fill="none" stroke="var(--border)" />
        {sep && <line x1={P(lo)} y1={Q((lo - 0.5) / 2)} x2={P(hi)} y2={Q((hi - 0.5) / 2)} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="4 3" />}
        {pts.map(([x, y, t], i) => (t ? <circle key={i} cx={P(x)} cy={Q(y)} r={6} fill="var(--accent)" /> : <rect key={i} x={P(x) - 6} y={Q(y) - 6} width={12} height={12} fill="var(--text-muted)" />))}
        <text x={S / 2} y={S + 10} textAnchor="middle" className="viz-label">{title}</text>
      </svg>
    );
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={act === "relu"} onClick={() => setAct("relu")}>ReLU hidden layer</button>
        <button type="button" className="seg" aria-pressed={act === "none"} onClick={() => setAct("none")}>no activation</button>
      </div>
      <div style={{ display: "flex", gap: "4%", justifyContent: "center", flexWrap: "wrap" }}>
        {panel(PTS, -0.5, 1.5, "input (x1, x2)", false)}
        {panel(hid, -1.5, 2.5, "hidden (h1, h2)", act === "relu")}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        h1 = {act === "relu" ? "relu" : ""}(x1 + x2), h2 = {act === "relu" ? "relu" : ""}(x1 + x2 − 1), y = h1 − 2·h2 → [{out.join(", ")}]
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {act === "relu"
          ? "The hidden layer bends the space: (0, 1) and (1, 0) land on the same hidden point, and the circles and squares can now be split by a line (dashed), which the output unit draws. The outputs are exactly XOR."
          : "Without an activation the hidden layer is linear, so the four points land on one straight line, with the two circles between the two squares. No line in the hidden space separates them, and the output y = x1 + x2 − 2(x1 + x2 − 1) is just another linear function."}
      </figcaption>
    </figure>
  );
}
