"use client";

import { useMemo, useState } from "react";

type Step = { remainder: number; digit: number };

function divide(n: number, d: number, max = 100) {
  const steps: Step[] = [];
  const seen = new Map<number, number>();
  let r = n % d;
  while (r !== 0 && !seen.has(r) && steps.length < max) {
    seen.set(r, steps.length);
    const digit = Math.floor((r * 10) / d);
    steps.push({ remainder: r, digit });
    r = (r * 10) % d;
  }
  return { whole: Math.floor(n / d), steps, repeatsFrom: r === 0 ? null : seen.get(r) ?? null, terminates: r === 0 };
}

/** Long division one step at a time. There are fewer than d possible remainders, so one must come back. */
export function LongDivisionViz() {
  const [n, setN] = useState(1);
  const [d, setD] = useState(7);
  const [shown, setShown] = useState(0);
  const result = useMemo(() => divide(n, d), [n, d]);
  const total = result.steps.length;
  const k = Math.min(shown, total);
  const done = k === total;
  const digits = result.steps.slice(0, k).map((s) => s.digit);

  const reset = (nn: number, dd: number) => { setN(nn); setD(dd); setShown(0); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-stepper">
          <span className="viz-stepper-label">Numerator</span>
          <input className="input mono" style={{ width: 72, height: 32 }} type="number" min={1} max={99} value={n}
            onChange={(e) => reset(Math.max(1, Math.min(99, Number(e.target.value) || 1)), d)} />
        </label>
        <label className="viz-stepper">
          <span className="viz-stepper-label">Denominator</span>
          <input className="input mono" style={{ width: 72, height: 32 }} type="number" min={2} max={99} value={d}
            onChange={(e) => reset(n, Math.max(2, Math.min(99, Number(e.target.value) || 2)))} />
        </label>
      </div>

      <p className="mono" style={{ fontSize: 22, margin: "16px 0 8px", letterSpacing: "0.04em", overflowWrap: "anywhere" }} aria-live="polite">
        {n}/{d} = {result.whole}{total > 0 ? "." : ""}
        {digits.map((g, i) => (
          <span key={i} style={done && result.repeatsFrom !== null && i >= result.repeatsFrom ? { color: "var(--accent)", textDecoration: "overline" } : undefined}>{g}</span>
        ))}
        {!done && "…"}
        {done && result.repeatsFrom !== null && <span style={{ color: "var(--accent)" }}>…</span>}
      </p>

      <div className="viz-remainders" aria-label="Remainders so far">
        {result.steps.slice(0, k).map((s, i) => (
          <span key={i} className={`viz-chip mono ${done && result.repeatsFrom === i ? "is-on" : ""}`}>{s.remainder}</span>
        ))}
        {done && result.repeatsFrom !== null && <span className="viz-chip mono is-on">{result.steps[result.repeatsFrom].remainder} again</span>}
        {done && result.terminates && <span className="viz-chip mono is-on">0, so it stops</span>}
      </div>

      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setShown((s) => s + 1)} disabled={done}>Next digit</button>
        <button type="button" className="btn" onClick={() => setShown(total)} disabled={done}>Finish</button>
        <button type="button" className="btn btn-ghost" onClick={() => setShown(0)} disabled={k === 0}>Start again</button>
      </div>
      <figcaption className="viz-caption">
        Each step multiplies the remainder by 10 and divides by {d}. The remainders, shown as chips, can only be 1 to {d - 1}.
        {done && (result.terminates
          ? " Here a remainder of 0 appeared, so the decimal terminates."
          : ` After at most ${d - 1} steps a remainder must repeat, and from then on the digits repeat too.`)}
      </figcaption>
    </figure>
  );
}
