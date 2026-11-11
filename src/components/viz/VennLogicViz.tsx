"use client";

import { useId, useState } from "react";

type F = (p: boolean, q: boolean) => boolean;
const PAIRS: { a: string; fa: F; b: string; fb: F }[] = [
  { a: "¬(P ∧ Q)", fa: (p, q) => !(p && q), b: "¬P ∨ ¬Q", fb: (p, q) => !p || !q },
  { a: "¬(P ∨ Q)", fa: (p, q) => !(p || q), b: "¬P ∧ ¬Q", fb: (p, q) => !p && !q },
  { a: "P → Q", fa: (p, q) => !p || q, b: "¬P ∨ Q", fb: (p, q) => !p || q },
  { a: "P → Q", fa: (p, q) => !p || q, b: "Q → P", fb: (p, q) => !q || p },
  { a: "¬(P ∧ Q)", fa: (p, q) => !(p && q), b: "¬P ∧ ¬Q", fb: (p, q) => !p && !q },
];
const REGIONS: { p: boolean; q: boolean; name: string }[] = [
  { p: true, q: true, name: "P and Q both true" },
  { p: true, q: false, name: "only P true" },
  { p: false, q: true, name: "only Q true" },
  { p: false, q: false, name: "both false" },
];

function Venn({ f, label, x }: { f: F; label: string; x: number }) {
  const id = useId().replace(/:/g, "");
  const P = { cx: x + 105, cy: 120 }, Q = { cx: x + 175, cy: 120 }, r = 70;
  const box = { x: x + 10, y: 20, w: 260, h: 200 };
  const fill = (on: boolean) => (on ? "color-mix(in srgb, var(--accent) 35%, transparent)" : "transparent");
  return (
    <g>
      <defs>
        <clipPath id={`cp-${id}`}><circle cx={P.cx} cy={P.cy} r={r} /></clipPath>
        <clipPath id={`cq-${id}`}><circle cx={Q.cx} cy={Q.cy} r={r} /></clipPath>
        <mask id={`np-${id}`}><rect x={box.x} y={box.y} width={box.w} height={box.h} fill="white" /><circle cx={P.cx} cy={P.cy} r={r} fill="black" /></mask>
        <mask id={`nq-${id}`}><rect x={box.x} y={box.y} width={box.w} height={box.h} fill="white" /><circle cx={Q.cx} cy={Q.cy} r={r} fill="black" /></mask>
      </defs>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={fill(f(false, false))} />
      <circle cx={P.cx} cy={P.cy} r={r} fill="var(--surface)" />
      <circle cx={Q.cx} cy={Q.cy} r={r} fill="var(--surface)" />
      <g clipPath={`url(#cq-${id})`}><circle cx={P.cx} cy={P.cy} r={r} fill={fill(f(true, true))} /></g>
      <g mask={`url(#nq-${id})`}><circle cx={P.cx} cy={P.cy} r={r} fill={fill(f(true, false))} /></g>
      <g mask={`url(#np-${id})`}><circle cx={Q.cx} cy={Q.cy} r={r} fill={fill(f(false, true))} /></g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="var(--border-strong)" />
      <circle cx={P.cx} cy={P.cy} r={r} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
      <circle cx={Q.cx} cy={Q.cy} r={r} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
      <text x={P.cx - 40} y={P.cy + 5} textAnchor="middle" className="viz-label">P</text>
      <text x={Q.cx + 40} y={Q.cy + 5} textAnchor="middle" className="viz-label">Q</text>
      <text x={x + 140} y={244} textAnchor="middle" className="viz-label is-on mono">{label}</text>
    </g>
  );
}

/** Two formulas are equivalent when they are true in exactly the same cases: their shaded regions match. */
export function VennLogicViz() {
  const [k, setK] = useState(0);
  const pair = PAIRS[k];
  const diff = REGIONS.filter((g) => pair.fa(g.p, g.q) !== pair.fb(g.p, g.q));

  return (
    <figure className="viz">
      <div className="choices" role="radiogroup" aria-label="Pair of formulas">
        {PAIRS.map((pr, i) => (
          <label key={i} className={`choice ${i === k ? "is-picked" : ""}`}>
            <input type="radio" name="pair" checked={i === k} onChange={() => setK(i)} />
            <span className="mono">{pr.a} &nbsp;and&nbsp; {pr.b}</span>
          </label>
        ))}
      </div>
      <svg viewBox="0 0 580 256" role="img" aria-label={`Shaded regions where ${pair.a} and ${pair.b} are true`} style={{ marginTop: 12 }}>
        <Venn f={pair.fa} label={pair.a} x={10} />
        <Venn f={pair.fb} label={pair.b} x={300} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Each region is one row of the truth table; shading marks where the formula is true.{" "}
        {diff.length === 0
          ? <>The shadings match in all four regions, so the two formulas are <strong>logically equivalent</strong>.</>
          : <>They differ where {diff.map((g) => g.name).join(" and where ")}, so they are <strong>not</strong> equivalent.</>}
      </figcaption>
    </figure>
  );
}
