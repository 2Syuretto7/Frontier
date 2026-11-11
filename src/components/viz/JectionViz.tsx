"use client";

import { useState } from "react";
import { MapDiagram } from "./MapDiagram";

const LET = ["a", "b", "c", "d", "e"], NUM = ["1", "2", "3", "4", "5"];
const PRESETS: { name: string; m: number; n: number; f: number[] }[] = [
  { name: "Injective only", m: 3, n: 4, f: [0, 2, 3] },
  { name: "Surjective only", m: 4, n: 3, f: [0, 1, 2, 2] },
  { name: "Bijective", m: 4, n: 4, f: [2, 0, 3, 1] },
  { name: "Neither", m: 4, n: 4, f: [0, 0, 1, 3] },
];

/** Injections, surjections and bijections between small finite sets. */
export function JectionViz() {
  const [m, setM] = useState(3), [n, setN] = useState(4);
  const [f, setF] = useState([0, 2, 3, 1, 0]);
  const fx = f.slice(0, m).map((t) => t % n);
  const hits = Array.from({ length: n }, (_, y) => fx.filter((t) => t === y).length);
  let clash: [number, number] | null = null;
  for (let i = 0; i < m && !clash; i++) for (let j = i + 1; j < m; j++) if (fx[i] === fx[j]) { clash = [i, j]; break; }
  const missed = hits.findIndex((h) => h === 0);
  const inj = clash === null, sur = missed < 0;
  const preset = PRESETS.findIndex((p) => p.m === m && p.n === n && p.f.every((v, i) => v === fx[i]));

  const stepper = (label: string, v: number, set: (k: number) => void) => (
    <span className="viz-stepper"><span className="viz-stepper-label">{label}</span>
      <button type="button" className="btn" onClick={() => set(Math.max(1, v - 1))} disabled={v <= 1} aria-label={`Fewer elements in ${label}`}>−</button>
      <span className="mono viz-stepper-value">{v}</span>
      <button type="button" className="btn" onClick={() => set(Math.min(5, v + 1))} disabled={v >= 5} aria-label={`More elements in ${label}`}>+</button>
    </span>
  );

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PRESETS.map((p, i) => (
          <button key={p.name} type="button" className={i === preset ? "btn btn-primary" : "btn"} aria-pressed={i === preset} onClick={() => { setM(p.m); setN(p.n); setF([...p.f, 0, 0, 0, 0].slice(0, 5)); }}>{p.name}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {stepper("A", m, setM)}
        {stepper("B", n, setN)}
      </div>
      <MapDiagram
        label={`A function from a ${m}-element set to a ${n}-element set`}
        columns={[{ title: "A", items: LET.slice(0, m) }, { title: "B", items: NUM.slice(0, n), on: hits.map((h) => h > 0) }]}
        maps={[fx.map((t) => [t])]}
        arrowClass={(_, i, t) => (hits[t] > 1 ? "plot-arrow is-hot" : "plot-arrow")}
        onItem={(col, i) => { if (col === 0) setF(f.map((t, j) => (j === i ? ((t % n) + 1) % n : t))); }}
      />
      <table className="table" style={{ marginTop: 4, marginBottom: 8 }}>
        <tbody>
          <tr><td><strong>Injective</strong></td><td className={inj ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"}>{inj ? "yes: no two arrows meet" : `no: f(${LET[clash![0]]}) = f(${LET[clash![1]]}) = ${NUM[fx[clash![0]]]}`}</td></tr>
          <tr><td><strong>Surjective</strong></td><td className={sur ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"}>{sur ? "yes: every element of B is hit" : `no: nothing is sent to ${NUM[missed]}`}</td></tr>
          <tr><td><strong>Bijective</strong></td><td className={inj && sur ? "viz-verdict viz-verdict-right" : "viz-verdict viz-verdict-wrong"}>{inj && sur ? "yes: both" : "no"}</td></tr>
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        Click an element of A to move its arrow. Red arrows land on the same element.{" "}
        {m > n
          ? <>With {m} elements in A and only {n} in B, some two arrows must meet, so no function here can be injective: the pigeonhole principle.</>
          : m < n
            ? <>With only {m} {m === 1 ? "arrow" : "arrows"} and {n} elements in B, some element must be missed, so no function here can be surjective.</>
            : <>A and B have the same size, so a function between them is injective exactly when it is surjective.</>}
      </figcaption>
    </figure>
  );
}
