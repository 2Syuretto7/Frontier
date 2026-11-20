"use client";

import { useState } from "react";

const GS = [4, 8, 16];

/** For a prompt solved with probability p and a group of G samples: the chance the group is not all-correct or all-wrong,
 *  and the expected update strength with and without dividing advantages by the group's standard deviation, each scaled to
 *  a maximum of 1. With binary rewards the raw policy-gradient signal is about p(1 − p); dividing by the standard deviation
 *  √(p(1 − p)) leaves √(p(1 − p)). */
export function signal(p: number, G: number) {
  const informative = 1 - p ** G - (1 - p) ** G;
  return { informative, grpo: informative * 2 * Math.sqrt(p * (1 - p)), drgrpo: informative * 4 * p * (1 - p) };
}

export function GroupSignalViz() {
  const [gi, setGi] = useState(1);
  const G = GS[gi];
  const W = 330, H = 190, X0 = 34, PW = 286, Y0 = 10, PH = 140;
  const ps = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  const px = (p: number) => X0 + p * PW, py = (v: number) => Y0 + PH - v * PH;
  const line = (k: "informative" | "grpo" | "drgrpo") => ps.map((p, i) => `${i ? "L" : "M"}${px(p).toFixed(1)},${py(signal(p, G)[k]).toFixed(1)}`).join(" ");
  const at = (p: number) => signal(p, G);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">samples per prompt</span>
        <div className="segmented" role="group" aria-label="Group size">
          {GS.map((g, i) => <button key={g} type="button" className="seg" aria-pressed={gi === i} onClick={() => setGi(i)}>{g}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Learning signal against prompt difficulty">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
            <text x={px(v)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{v}</text>
          </g>
        ))}
        <path d={line("informative")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={line("grpo")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={line("drgrpo")} fill="none" stroke="var(--text)" strokeWidth={1.5} />
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">probability the policy solves the prompt</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        G = {G}: groups with mixed results at p = 0.02: {(at(0.02).informative * 100).toFixed(0)}%, at p = 0.5: {(at(0.5).informative * 100).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Dashed: the chance a group of samples has both right and wrong answers; otherwise every advantage is zero and the prompt
        teaches nothing. Coloured: relative update strength when advantages are divided by the group&apos;s standard deviation, as in
        GRPO. Dark: without that division, as in Dr. GRPO. Larger groups rescue hard and easy prompts; the division gives them
        more weight still, relative to prompts of middling difficulty.
      </figcaption>
    </figure>
  );
}
