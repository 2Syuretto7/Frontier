"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const DESIGNS = [
  { label: "easy items", lo: -3, hi: -1 },
  { label: "items at today's level", lo: -0.5, hi: 1.5 },
  { label: "items spread widely", lo: -3, hi: 4 },
];
const A = 1.5, N = 100, FRONTIER = 2.5;
const sig = (x: number) => 1 / (1 + Math.exp(-x));

/** 100 two-parameter IRT items with discrimination 1.5 and difficulties uniform on [lo, hi]. Returns the test information
 *  and expected score as functions of ability θ. */
export function design(lo: number, hi: number, seed = 3) {
  const r = rand(seed);
  const bs = Array.from({ length: N }, () => lo + (hi - lo) * r());
  const info = (t: number) => bs.reduce((s, b) => { const p = sig(A * (t - b)); return s + A * A * p * (1 - p); }, 0);
  const score = (t: number) => bs.reduce((s, b) => s + sig(A * (t - b)), 0) / N;
  return { info, score };
}

export function TestInformationViz() {
  const [di, setDi] = useState(1);
  const { info, score } = useMemo(() => design(DESIGNS[di].lo, DESIGNS[di].hi), [di]);
  const W = 330, H = 180, X0 = 34, PW = 280, Y0 = 12, PH = 130, IMAX = 60;
  const px = (t: number) => X0 + ((t + 4) / 8) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(v, IMAX) / IMAX) * PH;
  const ts = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05);
  const path = ts.map((t, i) => `${i ? "L" : "M"}${px(t).toFixed(1)},${py(info(t)).toFixed(1)}`).join(" ");
  const sPath = ts.map((t, i) => `${i ? "L" : "M"}${px(t).toFixed(1)},${(Y0 + PH - score(t) * PH).toFixed(1)}`).join(" ");
  const iF = info(FRONTIER);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Benchmark design">
          {DESIGNS.map((d, i) => <button key={d.label} type="button" className="seg" aria-pressed={di === i} onClick={() => setDi(i)}>{d.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Test information and expected score against ability">
        {[0, 30, 60].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 5} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[-4, -2, 0, 2, 4].map((t) => <text key={t} x={px(t)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{t}</text>)}
        <path d={sPath} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <line x1={px(FRONTIER)} x2={px(FRONTIER)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeWidth={1} />
        <text x={px(FRONTIER) - 3} y={Y0 + 8} textAnchor="end" className="viz-label">frontier model</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">ability θ; solid: information, dashed: expected score</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        frontier model: expected score {(score(FRONTIER) * 100).toFixed(0)}%, information {iF.toFixed(1)}, ability standard error {(1 / Math.sqrt(iF)).toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Item response theory gives each question a difficulty and a discrimination, and each model an ability θ. A benchmark
        measures ability precisely only where it has items of matching difficulty: the information curve shows where. Easy items
        leave the frontier model near 100% with almost no information, so models near the top cannot be told apart.
        Items spread over a wide range measure everyone moderately well; items concentrated at today&apos;s level are sharp now
        and saturate soon.
      </figcaption>
    </figure>
  );
}
