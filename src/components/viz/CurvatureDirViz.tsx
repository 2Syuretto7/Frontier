"use client";

import { useState } from "react";

const PRESETS: { label: string; H: [number, number, number] }[] = [
  { label: "bowl", H: [2, 0, 1] },
  { label: "narrow valley", H: [1, 0.9, 1] },
  { label: "saddle", H: [2, 1, -1] },
  { label: "flat direction", H: [1, 0, 0] },
];
const S = 280, C = S / 2;

function eig(a: number, b: number, d: number) {
  const tr = a + d, det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const v1: [number, number] = Math.abs(b) > 1e-12 ? [l1 - d, b] : a >= d ? [1, 0] : [0, 1];
  const n = Math.hypot(...v1);
  return { l1, l2, v1: [v1[0] / n, v1[1] / n] as [number, number] };
}

/** The curvature uᵀHu of a function in each unit direction u, drawn as a polar plot, with the eigenvectors of H. */
export function CurvatureDirViz() {
  const [pi, setPi] = useState(0);
  const [deg, setDeg] = useState(30);
  const [a, b, d] = PRESETS[pi].H;
  const { l1, l2, v1 } = eig(a, b, d);
  const scale = 100 / Math.max(Math.abs(l1), Math.abs(l2), 1e-9);
  const curv = (t: number) => a * Math.cos(t) ** 2 + 2 * b * Math.cos(t) * Math.sin(t) + d * Math.sin(t) ** 2;
  const segs: { pts: string; pos: boolean }[] = [];
  let cur: string[] = [];
  let sign = curv(0) >= 0;
  for (let k = 0; k <= 180; k++) {
    const t = (2 * Math.PI * k) / 180;
    const c = curv(t);
    const s = c >= 0;
    const r = Math.abs(c) * scale;
    const p = `${(C + r * Math.cos(t)).toFixed(1)},${(C - r * Math.sin(t)).toFixed(1)}`;
    if (s !== sign && cur.length) { segs.push({ pts: cur.join(" "), pos: sign }); cur = [`${C},${C}`]; sign = s; }
    cur.push(p);
  }
  segs.push({ pts: cur.join(" "), pos: sign });
  const th = (deg * Math.PI) / 180;
  const c0 = curv(th);
  const v2: [number, number] = [-v1[1], v1[0]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "8px auto" }} role="img" aria-label="Curvature in each direction as a polar plot">
        <line x1={C - 120 * v1[0]} y1={C + 120 * v1[1]} x2={C + 120 * v1[0]} y2={C - 120 * v1[1]} stroke="var(--text-faint)" strokeDasharray="4 4" />
        <line x1={C - 120 * v2[0]} y1={C + 120 * v2[1]} x2={C + 120 * v2[0]} y2={C - 120 * v2[1]} stroke="var(--text-faint)" strokeDasharray="4 4" />
        {segs.map((s, i) => (
          <polyline key={i} points={s.pts} fill="none" stroke={s.pos ? "var(--accent)" : "var(--danger)"} strokeWidth={2} />
        ))}
        <line x1={C} y1={C} x2={C + Math.abs(c0) * scale * Math.cos(th)} y2={C - Math.abs(c0) * scale * Math.sin(th)} stroke="var(--text)" strokeWidth={2} />
        <circle cx={C} cy={C} r={3} fill="var(--text)" />
      </svg>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">u at {deg}°</span>
        <input type="range" min={0} max={180} step={5} value={deg} onChange={(e) => setDeg(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, textAlign: "center", overflowWrap: "anywhere" }}>
        H = [[{a}, {b}], [{b}, {d}]], eigenvalues {l1.toFixed(2)} and {l2.toFixed(2)}; uᵀHu = {c0.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The distance from the centre in direction u is |uᵀHu|, <span style={{ color: "var(--accent)" }}>positive</span> or{" "}
        <span style={{ color: "var(--danger)" }}>negative</span>. The extremes lie along the eigenvectors (dashed), and the
        extreme values are the eigenvalues.{" "}
        {pi === 1
          ? `Condition number ${(l1 / l2).toFixed(0)}: steep across the valley, nearly flat along it, which is what slows gradient descent.`
          : pi === 2
            ? "Curving up in some directions and down in others: a saddle."
            : pi === 3
              ? "Zero curvature along one eigenvector: the second-order test cannot decide there."
              : "All curvatures positive: a bowl."}
      </figcaption>
    </figure>
  );
}
