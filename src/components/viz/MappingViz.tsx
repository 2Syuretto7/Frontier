"use client";

import { useState } from "react";

const DOMAIN = ["1", "2", "3", "4"];
const CODOMAIN = ["a", "b", "c"];
type Arrow = [number, number];

const PRESETS: { name: string; arrows: Arrow[] }[] = [
  { name: "Example 1", arrows: [[0, 0], [1, 2], [2, 0], [3, 1]] },
  { name: "Example 2", arrows: [[0, 0], [0, 1], [1, 1], [2, 2], [3, 2]] },
  { name: "Example 3", arrows: [[0, 1], [1, 1], [3, 0]] },
];

/** A relation between two finite sets, drawn as arrows. It is a function when every input has exactly one arrow. */
export function MappingViz() {
  const [arrows, setArrows] = useState<Arrow[]>(PRESETS[0].arrows);
  const [picked, setPicked] = useState<number | null>(null);
  const yD = (i: number) => 30 + i * 46, yC = (j: number) => 53 + j * 46;
  const counts = DOMAIN.map((_, i) => arrows.filter(([a]) => a === i).length);
  const isFunction = counts.every((c) => c === 1);
  const image = CODOMAIN.filter((_, j) => arrows.some(([, b]) => b === j));

  const toggle = (i: number, j: number) => {
    setArrows((as) => (as.some(([a, b]) => a === i && b === j) ? as.filter(([a, b]) => !(a === i && b === j)) : [...as, [i, j]]));
    setPicked(null);
  };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" className="btn" onClick={() => { setArrows(p.arrows); setPicked(null); }}>{p.name}</button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => { setArrows([]); setPicked(null); }}>Clear</button>
      </div>
      <svg viewBox="0 0 620 220" role="img" aria-label={`A relation from {1, 2, 3, 4} to {a, b, c}; ${isFunction ? "it is" : "it is not"} a function`}>
        <rect x={110} y={8} width={80} height={200} rx={36} className="viz-cell" />
        <rect x={430} y={20} width={80} height={170} rx={36} className="viz-cell" />
        <text x={150} y={218} textAnchor="middle" className="viz-label">inputs</text>
        <text x={470} y={218} textAnchor="middle" className="viz-label">outputs</text>
        {arrows.map(([i, j]) => (
          <line key={`${i}-${j}`} x1={164} y1={yD(i)} x2={452} y2={yC(j)}
            className={counts[i] === 1 ? "viz-link" : "plot-line"} strokeWidth={2} markerEnd="url(#map-head)" />
        ))}
        <defs>
          <marker id="map-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" className="viz-label" />
          </marker>
        </defs>
        {DOMAIN.map((d, i) => (
          <g key={d} role="button" tabIndex={0} aria-label={`Input ${d}`} style={{ cursor: "pointer" }}
            onClick={() => setPicked(picked === i ? null : i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPicked(picked === i ? null : i); }}>
            <circle cx={150} cy={yD(i)} r={15} className={picked === i ? "viz-node is-paired" : counts[i] === 1 ? "viz-node" : "viz-node plot-hot"} />
            <text x={150} y={yD(i) + 5} textAnchor="middle" className="viz-label">{d}</text>
          </g>
        ))}
        {CODOMAIN.map((c, j) => (
          <g key={c} role="button" tabIndex={0} aria-label={`Output ${c}`} style={{ cursor: picked === null ? "default" : "pointer" }}
            onClick={() => picked !== null && toggle(picked, j)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && picked !== null) toggle(picked, j); }}>
            <circle cx={470} cy={yC(j)} r={15} className={picked !== null ? "viz-node is-paired" : "viz-node"} />
            <text x={470} y={yC(j) + 5} textAnchor="middle" className="viz-label">{c}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {picked !== null
          ? `Now choose an output for ${DOMAIN[picked]}. Choosing one it already points to removes that arrow.`
          : "Click an input, then an output, to add or remove an arrow. "}
        {picked === null && (isFunction
          ? <>This <strong>is a function</strong>: every input has exactly one arrow. Its range is {"{"}{image.join(", ")}{"}"}{image.length < CODOMAIN.length ? ", which need not be every output" : ""}.</>
          : <>This is <strong>not a function</strong>: {counts.map((c, i) => (c === 1 ? null : `${DOMAIN[i]} has ${c === 0 ? "no arrow" : `${c} arrows`}`)).filter(Boolean).join("; ")}.</>)}
      </figcaption>
    </figure>
  );
}
