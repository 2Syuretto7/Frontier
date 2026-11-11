"use client";

import { useId, useState } from "react";

type F = (a: boolean, b: boolean, c: boolean) => boolean;
const PAIRS: { l: string; fl: F; r: string; fr: F }[] = [
  { l: "A ∩ (B ∪ C)", fl: (a, b, c) => a && (b || c), r: "(A ∩ B) ∪ (A ∩ C)", fr: (a, b, c) => (a && b) || (a && c) },
  { l: "A ∪ (B ∩ C)", fl: (a, b, c) => a || (b && c), r: "(A ∪ B) ∩ (A ∪ C)", fr: (a, b, c) => (a || b) && (a || c) },
  { l: "(A ∪ B)ᶜ", fl: (a, b) => !(a || b), r: "Aᶜ ∩ Bᶜ", fr: (a, b) => !a && !b },
  { l: "A ∖ (B ∪ C)", fl: (a, b, c) => a && !(b || c), r: "(A ∖ B) ∩ (A ∖ C)", fr: (a, b, c) => a && !b && a && !c },
  { l: "A ∖ (B ∖ C)", fl: (a, b, c) => a && !(b && !c), r: "(A ∖ B) ∖ C", fr: (a, b, c) => a && !b && !c },
  { l: "A △ B", fl: (a, b) => a !== b, r: "(A ∪ B) ∖ (A ∩ B)", fr: (a, b) => (a || b) && !(a && b) },
];
const TF = [true, false];
const REGIONS = TF.flatMap((a) => TF.flatMap((b) => TF.map((c) => [a, b, c] as [boolean, boolean, boolean])));
const regionName = ([a, b, c]: boolean[]) => {
  const ins = ["A", "B", "C"].filter((_, i) => [a, b, c][i]);
  return ins.length === 0 ? "outside all three" : ins.length === 3 ? "inside all three" : `in ${ins.join(" and ")} only`;
};

function Venn({ f, label, x }: { f: F; label: string; x: number }) {
  const id = useId().replace(/:/g, "");
  const r = 58;
  const C = [{ cx: x + 112, cy: 92, n: "A" }, { cx: x + 178, cy: 92, n: "B" }, { cx: x + 145, cy: 150, n: "C" }];
  const box = { x: x + 10, y: 18, w: 270, h: 212 };
  const wrap = (inside: boolean[], i: number, child: React.ReactNode): React.ReactNode =>
    i === 3 ? child : (
      <g clipPath={inside[i] ? `url(#c${i}-${id})` : undefined} mask={inside[i] ? undefined : `url(#m${i}-${id})`}>
        {wrap(inside, i + 1, child)}
      </g>
    );
  return (
    <g>
      <defs>
        {C.map((c, i) => (
          <g key={i}>
            <clipPath id={`c${i}-${id}`}><circle cx={c.cx} cy={c.cy} r={r} /></clipPath>
            <mask id={`m${i}-${id}`}><rect x={box.x} y={box.y} width={box.w} height={box.h} fill="white" /><circle cx={c.cx} cy={c.cy} r={r} fill="black" /></mask>
          </g>
        ))}
      </defs>
      {REGIONS.map((reg, k) => (
        <g key={k}>{wrap(reg, 0, <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={f(...reg) ? "color-mix(in srgb, var(--accent) 35%, transparent)" : "transparent"} />)}</g>
      ))}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="var(--border-strong)" />
      {C.map((c) => <circle key={c.n} cx={c.cx} cy={c.cy} r={r} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />)}
      <text x={C[0].cx - 30} y={C[0].cy - 18} textAnchor="middle" className="viz-label">A</text>
      <text x={C[1].cx + 30} y={C[1].cy - 18} textAnchor="middle" className="viz-label">B</text>
      <text x={C[2].cx} y={C[2].cy + 38} textAnchor="middle" className="viz-label">C</text>
      <text x={x + 145} y={252} textAnchor="middle" className="viz-label is-on mono">{label}</text>
    </g>
  );
}

/** Two set expressions are equal when they shade exactly the same regions of the Venn diagram. */
export function SetOpsViz() {
  const [k, setK] = useState(0);
  const p = PAIRS[k];
  const diff = REGIONS.filter((reg) => p.fl(...reg) !== p.fr(...reg));

  return (
    <figure className="viz">
      <div className="choices" role="radiogroup" aria-label="Pair of set expressions">
        {PAIRS.map((pr, i) => (
          <label key={i} className={`choice ${i === k ? "is-picked" : ""}`}>
            <input type="radio" name="set-pair" checked={i === k} onChange={() => setK(i)} />
            <span className="mono">{pr.l} &nbsp;and&nbsp; {pr.r}</span>
          </label>
        ))}
      </div>
      <svg viewBox="0 0 600 262" role="img" aria-label={`Shaded regions for ${p.l} and for ${p.r}`} style={{ marginTop: 12 }}>
        <Venn f={p.fl} label={p.l} x={5} />
        <Venn f={p.fr} label={p.r} x={305} />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The three circles cut the box into eight regions, one for each way an element can be in or out of A, B and C.{" "}
        {diff.length === 0
          ? <>The shadings match in all eight regions, so the two sets are <strong>equal</strong>.</>
          : <>They differ in the region {diff.map(regionName).join(", and the region ")}, so the two sets are <strong>not</strong> equal in general.</>}
      </figcaption>
    </figure>
  );
}
