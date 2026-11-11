"use client";

import { useState } from "react";

const N = 32, LANES = 8;

/** A Python loop handles one element per trip through the interpreter; a vectorised operation runs a compiled loop over many. */
export function VectoriseViz() {
  const [mode, setMode] = useState<"python" | "numpy">("python");
  const [done, setDone] = useState(0);
  const per = mode === "python" ? 1 : LANES;
  const steps = Math.ceil(done / per);
  const step = () => setDone(Math.min(N, done + per));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Method">
          <button type="button" className="seg" aria-pressed={mode === "python"} onClick={() => { setMode("python"); setDone(0); }}>Python loop</button>
          <button type="button" className="seg" aria-pressed={mode === "numpy"} onClick={() => { setMode("numpy"); setDone(0); }}>NumPy: c = a + b</button>
        </div>
      </div>
      <div className="vec-row" aria-label={`${done} of ${N} elements computed`}>
        {Array.from({ length: N }, (_, i) => <span key={i} className={i < done ? (i >= done - per ? "vec-cell is-new" : "vec-cell is-done") : "vec-cell"} />)}
      </div>
      <pre className="git-status">{mode === "python"
        ? `for i in range(len(a)):
    c[i] = a[i] + b[i]
# each trip: look up a[i] and b[i], check their types,
# find the right + , build a new Python number, store it`
        : `c = a + b
# one call into compiled C code, which loops over raw numbers
# of a known type, ${LANES} at a time using the CPU's vector (SIMD) instructions`}</pre>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={step} disabled={done >= N}>Next step</button>
        <button type="button" className="btn" onClick={() => setDone(0)}>Reset</button>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{steps}</b><span>steps so far</span></div>
        <div className="ml-stat"><b>{Math.ceil(N / per)}</b><span>steps for all {N} elements</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {mode === "python"
          ? "Every element costs a full trip through the interpreter, with type checks and a new Python object each time. The arithmetic itself is a tiny part of the work."
          : `The type is known once for the whole array, so the compiled loop does only arithmetic, ${LANES} numbers per instruction here. Real speed-ups over a Python loop are commonly tens to hundreds of times.`}
      </figcaption>
    </figure>
  );
}
