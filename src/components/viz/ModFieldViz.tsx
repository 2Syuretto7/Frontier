"use client";

import { useState } from "react";

/** Arithmetic modulo n: a multiplication table that shows when every non-zero element has an inverse. */
export function ModFieldViz() {
  const [n, setN] = useState(7);
  const [sel, setSel] = useState<number | null>(3);
  const els = Array.from({ length: n }, (_, i) => i);
  const inv = (a: number) => els.find((b) => (a * b) % n === 1);
  const noInv = els.filter((a) => a !== 0 && inv(a) === undefined);
  const zeroDiv = (() => { for (let a = 1; a < n; a++) for (let b = 1; b < n; b++) if ((a * b) % n === 0) return [a, b]; return null; })();
  const C = Math.min(40, Math.floor(480 / (n + 1)));
  const s = sel !== null && sel < n ? sel : null;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-stepper"><span className="viz-stepper-label">n</span>
          <button type="button" className="btn" onClick={() => setN(Math.max(2, n - 1))} disabled={n <= 2} aria-label="Smaller n">−</button>
          <span className="mono viz-stepper-value">{n}</span>
          <button type="button" className="btn" onClick={() => setN(Math.min(12, n + 1))} disabled={n >= 12} aria-label="Larger n">+</button>
        </span>
      </div>
      <svg viewBox={`0 0 ${C * (n + 1) + 10} ${C * (n + 1) + 10}`} style={{ width: Math.min(480, C * (n + 1) + 10), maxWidth: "100%", display: "block", margin: "12px auto 0" }} role="img" aria-label={`Multiplication table modulo ${n}`}>
        <text x={C / 2} y={C / 2 + 5} textAnchor="middle" className="plot-tick">×</text>
        {els.map((a) => (
          <g key={a}>
            <text x={C * (a + 1) + C / 2} y={C / 2 + 5} textAnchor="middle" className="viz-label">{a}</text>
            <text x={C / 2} y={C * (a + 1) + C / 2 + 5} textAnchor="middle" className={a === s ? "viz-label is-on" : "viz-label"} style={{ cursor: "pointer" }} onClick={() => setSel(a)}>{a}</text>
          </g>
        ))}
        {els.map((a) => els.map((b) => {
          const v = (a * b) % n;
          const one = v === 1, zd = a > 0 && b > 0 && v === 0;
          return (
            <g key={`${a}-${b}`} onClick={() => setSel(a)} style={{ cursor: "pointer" }}>
              <rect x={C * (b + 1) + 2} y={C * (a + 1) + 2} width={C - 4} height={C - 4} rx={4} className={one ? "viz-cell is-on" : "viz-cell"} style={zd ? { stroke: "var(--danger)", strokeWidth: 1.5 } : a === s ? { strokeWidth: 2 } : undefined} />
              <text x={C * (b + 1) + C / 2} y={C * (a + 1) + C / 2 + 4} textAnchor="middle" className={one ? "viz-label is-on" : "plot-tick"} style={zd ? { fill: "var(--danger)" } : undefined}>{v}</text>
            </g>
          );
        }))}
      </svg>
      <p className={noInv.length ? "viz-verdict viz-verdict-wrong" : "viz-verdict viz-verdict-right"} style={{ margin: "8px 0 0" }}>
        {noInv.length
          ? `Not a field: ${noInv.join(", ")} ${noInv.length === 1 ? "has" : "have"} no multiplicative inverse modulo ${n}.`
          : `A field: every non-zero element has a multiplicative inverse modulo ${n}.`}
      </p>
      <figcaption className="viz-caption" aria-live="polite">
        Shaded squares hold the product 1, so a row with a shaded square has an inverse.{" "}
        {s !== null && s > 0 && (inv(s) !== undefined ? <>Row {s}: {s} × {inv(s)} = 1 modulo {n}, so {s}⁻¹ = {inv(s)}. </> : <>Row {s} has no 1 in it, so {s} has no inverse modulo {n}. </>)}
        {zeroDiv && <>Red squares are products of two non-zero numbers that equal 0, such as {zeroDiv[0]} × {zeroDiv[1]}; this cannot happen in a field. </>}
        Try a prime n, then a composite one.
      </figcaption>
    </figure>
  );
}
