"use client";

import { useState } from "react";

type F = { n: number; d: number };

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function Stepper({ label, value, set, min, max }: { label: string; value: number; set: (v: number) => void; min: number; max: number }) {
  return (
    <span className="viz-stepper">
      <span className="viz-stepper-label">{label}</span>
      <button type="button" className="btn" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Decrease ${label}`}>−</button>
      <span className="mono viz-stepper-value">{value}</span>
      <button type="button" className="btn" onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Increase ${label}`}>+</button>
    </span>
  );
}

function Bar({ f, y, W, x0, refine }: { f: F; y: number; W: number; x0: number; refine: number }) {
  const parts = f.d * refine;
  const w = W / parts;
  return (
    <g>
      {Array.from({ length: parts }, (_, i) => (
        <rect key={i} x={x0 + i * w} y={y} width={w} height={34}
          className={i < f.n * refine ? "viz-cell is-on" : "viz-cell"} />
      ))}
      <rect x={x0} y={y} width={W} height={34} className="viz-frame" />
    </g>
  );
}

/** Two fractions as shaded parts of equal bars. Cutting both into a common number of pieces makes them comparable. */
export function FractionBarsViz() {
  const [a, setA] = useState<F>({ n: 2, d: 3 });
  const [b, setB] = useState<F>({ n: 3, d: 4 });
  const [common, setCommon] = useState(false);
  const lcm = (a.d * b.d) / gcd(a.d, b.d);
  const W = 560, x0 = 60;
  const cmp = a.n * b.d - b.n * a.d;

  return (
    <figure className="viz">
      <svg viewBox="0 0 640 120" role="img" aria-label={`${a.n}/${a.d} compared with ${b.n}/${b.d}`}>
        <text x={x0 - 14} y={38} textAnchor="end" className="viz-label is-on">{a.n}/{a.d}</text>
        <Bar f={a} y={16} W={W} x0={x0} refine={common ? lcm / a.d : 1} />
        <text x={x0 - 14} y={92} textAnchor="end" className="viz-label is-on">{b.n}/{b.d}</text>
        <Bar f={b} y={70} W={W} x0={x0} refine={common ? lcm / b.d : 1} />
      </svg>
      <div className="viz-controls">
        <Stepper label="top" value={a.n} set={(n) => setA({ ...a, n })} min={0} max={a.d} />
        <Stepper label="of" value={a.d} set={(d) => setA({ d, n: Math.min(a.n, d) })} min={1} max={12} />
        <span className="viz-sep" />
        <Stepper label="top" value={b.n} set={(n) => setB({ ...b, n })} min={0} max={b.d} />
        <Stepper label="of" value={b.d} set={(d) => setB({ d, n: Math.min(b.n, d) })} min={1} max={12} />
        <button type="button" className={common ? "btn btn-primary" : "btn"} onClick={() => setCommon((c) => !c)} aria-pressed={common}>
          Common pieces
        </button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {common
          ? <>Cut both bars into {lcm} equal pieces: <span className="mono">{a.n}/{a.d} = {a.n * (lcm / a.d)}/{lcm}</span> and{" "}
            <span className="mono">{b.n}/{b.d} = {b.n * (lcm / b.d)}/{lcm}</span>. </>
          : <>Turn on common pieces to compare piece by piece. </>}
        {cmp === 0 ? "The two fractions are equal." : `The ${cmp > 0 ? "first" : "second"} fraction is larger.`}
      </figcaption>
    </figure>
  );
}
