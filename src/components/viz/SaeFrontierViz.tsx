"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline: sparse autoencoders with 20 or 80 latents on the synthetic activations of the
 * previous lesson (40 known features in 16 dimensions, two active on average), trained at eight sparsity penalties from 0.003 to 1.
 * For each: mean active latents (L0), fraction of variance unexplained, and how many of the 40 true features have a decoder
 * direction with cosine above 0.9.
 */
export const FRONTIER: Record<string, { lam: number; l0: number; fvu: number; found: number }[]> = {"20":[{"lam":0.003,"l0":18.29,"fvu":0.0042,"found":0},{"lam":0.0069,"l0":17.33,"fvu":0.0097,"found":1},{"lam":0.0158,"l0":13.5,"fvu":0.0196,"found":3},{"lam":0.0362,"l0":10.2,"fvu":0.0392,"found":0},{"lam":0.0829,"l0":6.93,"fvu":0.0764,"found":7},{"lam":0.1902,"l0":4.26,"fvu":0.1757,"found":9},{"lam":0.4361,"l0":2.02,"fvu":0.3816,"found":11},{"lam":1.0,"l0":0.63,"fvu":0.7355,"found":16}],"80":[{"lam":0.003,"l0":19.45,"fvu":0.0001,"found":0},{"lam":0.0069,"l0":19.45,"fvu":0.0004,"found":0},{"lam":0.0158,"l0":19.4,"fvu":0.0023,"found":2},{"lam":0.0362,"l0":18.13,"fvu":0.0107,"found":4},{"lam":0.0829,"l0":12.25,"fvu":0.0401,"found":14},{"lam":0.1902,"l0":6.36,"fvu":0.1028,"found":32},{"lam":0.4361,"l0":2.99,"fvu":0.2399,"found":37},{"lam":1.0,"l0":1.36,"fvu":0.6092,"found":32}]};

const SERIES = [
  { key: "20", name: "20 latents", col: "var(--text-muted)" },
  { key: "80", name: "80 latents", col: "var(--accent)" },
];

export function SaeFrontierViz() {
  const [m, setM] = useState(0);
  const isFvu = m === 0;
  const W = 330, H = 180, X0 = 30, PW = 290, Y0 = 10, PH = 136, MAXL = 20;
  const px = (l0: number) => X0 + (l0 / MAXL) * PW;
  const py = (v: number) => Y0 + PH - (isFvu ? v / 0.8 : v / 40) * PH;
  const ticks = isFvu ? [0, 0.2, 0.4, 0.6, 0.8] : [0, 10, 20, 30, 40];
  const a = FRONTIER["20"][4], b = FRONTIER["80"][5];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="What to plot against sparsity">
          {["variance unexplained", "true features found"].map((n, i) => <button key={n} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label={isFvu ? "Variance unexplained against active latents" : "True features found against active latents"}>
        {ticks.map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray={y ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y}</text>
          </g>
        ))}
        {SERIES.map((s) => {
          const rows = FRONTIER[s.key];
          const val = (r: (typeof rows)[number]) => (isFvu ? r.fvu : r.found);
          return (
            <g key={s.key}>
              <path d={rows.map((r, i) => `${i ? "L" : "M"}${px(r.l0).toFixed(1)},${py(val(r)).toFixed(1)}`).join(" ")} fill="none" stroke={s.col} strokeWidth={1.5} />
              {rows.map((r, i) => <circle key={i} cx={px(r.l0)} cy={py(val(r))} r={3} style={{ fill: s.col }} />)}
            </g>
          );
        })}
        {[0, 5, 10, 15, 20].map((v) => <text key={v} x={px(v)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{v}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">active latents per input; grey: 20 latents, coloured: 80</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        near 6.5 active latents: 20 latents unexplained {a.fvu.toFixed(3)}, found {a.found}; 80 latents unexplained {b.fvu.toFixed(3)}, found {b.found}
      </div>
      <figcaption className="viz-caption">
        Real sparse autoencoders at eight penalty strengths. On the usual sparsity-fidelity plot the small dictionary looks at least as
        good as the large one. On the measure that matters here, recovering the 40 true features, the large dictionary is far better.
        Reconstruction at a given sparsity is necessary but not sufficient: feature quality has to be measured on its own terms.
      </figcaption>
    </figure>
  );
}
