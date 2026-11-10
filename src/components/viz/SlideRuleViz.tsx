"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const W = 620, L = 560, x0 = 30;
const pos = (v: number) => x0 + Math.log10(v) * L; // 1 at the left, 10 at the right
const MAJOR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MINOR = Array.from({ length: 90 }, (_, i) => 1 + (i + 1) / 10).filter((v) => v < 10 && Math.round(v * 10) % 10 !== 0);

function Scale({ y, flip }: { y: number; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <g>
      <rect x={x0 - 18} y={flip ? y - 34 : y} width={L + 36} height={34} rx={4} className="viz-cell" />
      {MINOR.map((v) => <line key={v} x1={pos(v)} y1={y} x2={pos(v)} y2={y + d * 7} className="viz-axis" />)}
      {MAJOR.map((v) => (
        <g key={v}>
          <line x1={pos(v)} y1={y} x2={pos(v)} y2={y + d * 14} className="viz-axis" />
          <text x={pos(v)} y={y + d * 27 + (flip ? 4 : 0)} textAnchor="middle" className="viz-label" style={{ fontSize: 12 }}>{v}</text>
        </g>
      ))}
    </g>
  );
}

/** A slide rule: two logarithmic scales. Sliding one along the other adds lengths, which multiplies numbers. */
export function SlideRuleViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const product = a * b;
  const fits = product <= 10;
  const shift = Math.log10(a) * L;

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 170`} role="img" aria-label={`A slide rule multiplying ${a} by ${b}`}>
        <Scale y={70} flip />
        <g transform={`translate(${shift} 0)`}>
          <Scale y={74} />
        </g>
        <line x1={pos(a)} y1={14} x2={pos(a)} y2={158} className="plot-line" />
        {fits && <line x1={pos(product)} y1={14} x2={pos(product)} y2={158} className="plot-line" style={{ stroke: "var(--accent)" }} />}
        <text x={pos(a)} y={10} textAnchor="middle" className="plot-tick">{fmtNum(a)}</text>
        {fits && <text x={pos(product)} y={10} textAnchor="middle" className="plot-tick">{fmtNum(Math.round(product * 100) / 100)}</text>}
      </svg>
      <div className="viz-sliders">
        <label>
          <span>First number <span className="mono">a = {fmtNum(a)}</span></span>
          <input type="range" min={1} max={9} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label>
          <span>Second number <span className="mono">b = {fmtNum(b)}</span></span>
          <input type="range" min={1} max={9} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each number <span className="mono">v</span> sits at distance <span className="mono">log v</span> from the left end. The lower scale
        is slid so its 1 sits under <span className="mono">{fmtNum(a)}</span> on the upper scale. Then the lower scale&rsquo;s{" "}
        <span className="mono">{fmtNum(b)}</span> lies at distance <span className="mono">log {fmtNum(a)} + log {fmtNum(b)}</span>, which is{" "}
        <span className="mono">log {fmtNum(Math.round(product * 100) / 100)}</span>.{" "}
        {fits
          ? <>Read the product above it: <span className="mono">{fmtNum(a)} × {fmtNum(b)} = {fmtNum(Math.round(product * 100) / 100)}</span>.</>
          : <>That runs off the end of the upper scale; a real slide rule user would divide one factor by 10 and multiply the answer by 10.</>}
      </figcaption>
    </figure>
  );
}
