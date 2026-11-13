"use client";

import { useState } from "react";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Model initialisation draws `width` numbers, then the data is shuffled. */
function run(seed: number, width: number, separate: boolean) {
  const initRng = lcg(seed);
  const dataRng = separate ? lcg(seed ^ 0x9e3779b9) : initRng;
  for (let i = 0; i < width; i++) initRng();
  const order = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(dataRng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Two runs that should see the same data order. Which choices keep it the same? */
export function SeedViz() {
  const [fixed, setFixed] = useState(true);
  const [wide, setWide] = useState(false);
  const [separate, setSeparate] = useState(false);
  const [clock, setClock] = useState(1);
  const a = run(fixed ? 42 : 1000 + clock * 7919, 4, separate);
  const b = run(fixed ? 42 : 2000 + clock * 104729, wide ? 8 : 4, separate);
  const same = a.join() === b.join();
  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button type="button" className="seg" aria-pressed={on} onClick={() => { set(!on); setClock(clock + 1); }}>{label}</button>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {toggle(fixed, setFixed, "fixed seed 42")}
        {toggle(wide, setWide, "run 2 has a wider model")}
        {toggle(separate, setSeparate, "separate generator for data")}
      </div>
      <div className="mono" style={{ fontSize: 14, lineHeight: 1.8 }}>
        <div>run 1 data order: {a.join(" ")}</div>
        <div style={{ color: same ? undefined : "var(--danger)" }}>run 2 data order: {b.join(" ")}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {!fixed
          ? "Seeded from the clock, the two runs differ in everything. Nothing can be compared or reproduced."
          : same
            ? wide
              ? "Same order: the data has its own generator, so drawing more numbers for the wider model does not disturb it."
              : "Same seed, same code: the same order."
            : "Same seed, different order. The wider model drew four more numbers from the shared generator, which shifted every number the shuffle used after it."}
      </figcaption>
    </figure>
  );
}
