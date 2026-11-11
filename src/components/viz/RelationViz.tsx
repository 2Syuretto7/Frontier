"use client";

import { useState } from "react";

const X = [1, 2, 3, 4, 6];
const PRESETS: { name: string; rule: (a: number, b: number) => boolean }[] = [
  { name: "a divides b", rule: (a, b) => b % a === 0 },
  { name: "a < b", rule: (a, b) => a < b },
  { name: "a ≤ b", rule: (a, b) => a <= b },
  { name: "same parity", rule: (a, b) => (a - b) % 2 === 0 },
  { name: "a ≠ b", rule: (a, b) => a !== b },
  { name: "differ by 1", rule: (a, b) => Math.abs(a - b) === 1 },
];

const grid = (r: (a: number, b: number) => boolean) => X.map((a) => X.map((b) => r(a, b)));

/** A relation on a five-element set as a grid of pairs, with its four basic properties checked. */
export function RelationViz() {
  const [preset, setPreset] = useState<number | null>(0);
  const [g, setG] = useState(() => grid(PRESETS[0].rule));
  const R = (i: number, j: number) => g[i][j];
  const idx = X.map((_, i) => i);

  const pairs: string[] = [];
  idx.forEach((i) => idx.forEach((j) => { if (R(i, j)) pairs.push(`(${X[i]}, ${X[j]})`); }));

  let refl = "yes", sym = "yes", anti = "yes", trans = "yes";
  const nr = idx.find((i) => !R(i, i));
  if (nr !== undefined) refl = `no: ${X[nr]} is not related to ${X[nr]}`;
  outerS: for (const i of idx) for (const j of idx) if (R(i, j) && !R(j, i)) { sym = `no: ${X[i]} R ${X[j]} but not ${X[j]} R ${X[i]}`; break outerS; }
  outerA: for (const i of idx) for (const j of idx) if (i !== j && R(i, j) && R(j, i)) { anti = `no: ${X[i]} R ${X[j]} and ${X[j]} R ${X[i]}, yet ${X[i]} ≠ ${X[j]}`; break outerA; }
  outerT: for (const i of idx) for (const j of idx) for (const k of idx) if (R(i, j) && R(j, k) && !R(i, k)) { trans = `no: ${X[i]} R ${X[j]} and ${X[j]} R ${X[k]}, but not ${X[i]} R ${X[k]}`; break outerT; }

  const C = 46, L = 70, T = 40;
  const toggle = (i: number, j: number) => { setG(g.map((row, a) => row.map((v, b) => (a === i && b === j ? !v : v)))); setPreset(null); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.name} type="button" className={i === preset ? "btn btn-primary" : "btn"} aria-pressed={i === preset} onClick={() => { setPreset(i); setG(grid(p.rule)); }}>{p.name}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", marginTop: 12 }}>
        <svg viewBox={`0 0 ${L + 5 * C + 10} ${T + 5 * C + 10}`} style={{ width: 300, maxWidth: "100%" }} role="img" aria-label={`The relation as a grid: ${pairs.length} related pairs`}>
          <text x={L - 10} y={T - 14} textAnchor="end" className="plot-tick">a \ b</text>
          {X.map((b, j) => <text key={`c${b}`} x={L + j * C + C / 2} y={T - 12} textAnchor="middle" className="viz-label">{b}</text>)}
          {X.map((a, i) => (
            <g key={`r${a}`}>
              <text x={L - 14} y={T + i * C + C / 2 + 5} textAnchor="end" className="viz-label">{a}</text>
              {X.map((b, j) => (
                <rect key={b} x={L + j * C + 3} y={T + i * C + 3} width={C - 6} height={C - 6} rx={6} className={R(i, j) ? "viz-cell is-on" : "viz-cell"} style={{ cursor: "pointer" }} onClick={() => toggle(i, j)}>
                  <title>{`(${a}, ${b}): ${R(i, j) ? "related" : "not related"}. Click to change.`}</title>
                </rect>
              ))}
            </g>
          ))}
        </svg>
        <table className="table" style={{ flex: 1, minWidth: 240, margin: 0 }}>
          <tbody>
            {([["Reflexive", refl], ["Symmetric", sym], ["Antisymmetric", anti], ["Transitive", trans]] as const).map(([k, v]) => (
              <tr key={k}><td><strong>{k}</strong></td><td className={v === "yes" ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"}>{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A relation on X = {"{1, 2, 3, 4, 6}"} is just a set of ordered pairs; a shaded square in row a, column b means a R b.{" "}
        {preset === null ? "You have edited it: " : `For “${PRESETS[preset].name}”, `}
        {pairs.length === 0 ? "no pairs are related." : <>the {pairs.length} related {pairs.length === 1 ? "pair is" : "pairs are"} <span className="mono">{pairs.join(", ")}</span>.</>}{" "}
        Click any square to add or remove a pair.
      </figcaption>
    </figure>
  );
}
