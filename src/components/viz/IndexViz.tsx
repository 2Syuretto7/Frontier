"use client";

import { useState } from "react";

type Props = {
  /** The variable name shown in the expressions. */
  name: string;
  /** The items, as Python would print each one. */
  items: string[];
  /** A list shows [a, b], a string shows 'ab'. */
  kind: "list" | "str";
};

/** Pick out one item by index, or a slice, of a list or a string. */
export function IndexViz({ name, items, kind }: Props) {
  const n = items.length;
  const [mode, setMode] = useState<"index" | "slice">("index");
  const [i, setI] = useState(2);
  const [start, setStart] = useState(1);
  const [stop, setStop] = useState(5);
  const [step, setStep] = useState(1);

  const picked = new Set<number>();
  if (mode === "index") picked.add(i < 0 ? i + n : i);
  else for (let k = start; k < stop; k += step) picked.add(k);
  const chosen = [...picked].sort((a, b) => a - b).map((k) => items[k]);

  const show = (xs: string[]) => (kind === "list" ? `[${xs.join(", ")}]` : `'${xs.join("")}'`);
  const expr = mode === "index" ? `${name}[${i}]` : `${name}[${start}:${stop}${step === 1 ? "" : `:${step}`}]`;
  const value = mode === "index" ? (kind === "list" ? items[i < 0 ? i + n : i] : `'${items[i < 0 ? i + n : i]}'`) : show(chosen);

  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Mode">
        <button type="button" className="seg" aria-pressed={mode === "index"} onClick={() => setMode("index")}>One index</button>
        <button type="button" className="seg" aria-pressed={mode === "slice"} onClick={() => setMode("slice")}>A slice</button>
      </div>
      <p className="trace-out" style={{ margin: "16px 0 8px" }}>{`${name} = ${show(items)}`}</p>
      <div className="idx" style={{ gridTemplateColumns: `4.4em repeat(${n}, minmax(0, 1fr))` }}>
        <span className="idx-label">index</span>
        {items.map((_, k) => <span key={`p${k}`} className="idx-num">{k}</span>)}
        <span className="idx-label">item</span>
        {items.map((x, k) => <span key={`c${k}`} className={picked.has(k) ? "idx-cell is-on" : "idx-cell"}>{x}</span>)}
        <span className="idx-label">from end</span>
        {items.map((_, k) => <span key={`m${k}`} className="idx-num">{k - n}</span>)}
      </div>
      <div className="viz-sliders">
        {mode === "index" ? (
          <label>
            index = {i}
            <input type="range" min={-n} max={n - 1} value={i} onChange={(e) => setI(Number(e.target.value))} />
          </label>
        ) : (
          <>
            <label>
              start = {start}
              <input type="range" min={0} max={n} value={start} onChange={(e) => setStart(Number(e.target.value))} />
            </label>
            <label>
              stop = {stop}
              <input type="range" min={0} max={n} value={stop} onChange={(e) => setStop(Number(e.target.value))} />
            </label>
            <label>
              step = {step}
              <input type="range" min={1} max={3} value={step} onChange={(e) => setStep(Number(e.target.value))} />
            </label>
          </>
        )}
      </div>
      <p className="trace-out" style={{ marginTop: 12 }}>{`${expr}  →  ${value}`}</p>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "index"
          ? i < 0
            ? `A negative index counts from the end: ${name}[${i}] is ${name}[${n} + (${i})], which is ${name}[${i + n}].`
            : `Indices start at 0, so ${name}[${i}] is item number ${i + 1}.`
          : chosen.length === 0
            ? "When start is not before stop, the slice is empty. Slicing never raises an error for out-of-range positions."
            : `The slice starts at index ${start} and stops before index ${stop}${step > 1 ? `, taking every ${step === 2 ? "second" : "third"} item` : ""}: ${chosen.length} item${chosen.length === 1 ? "" : "s"}.`}
      </figcaption>
    </figure>
  );
}
