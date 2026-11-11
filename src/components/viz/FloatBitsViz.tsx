"use client";

import { useState } from "react";

const FORMATS = [
  { name: "float16", e: 5, m: 10, init: 0x3c00 },
  { name: "bfloat16", e: 8, m: 7, init: 0x3f80 },
  { name: "FP8 E5M2", e: 5, m: 2, init: 0x3c },
];

function decode(bits: number, e: number, m: number) {
  const bias = 2 ** (e - 1) - 1;
  const sign = (bits >> (e + m)) & 1 ? -1 : 1;
  const exp = (bits >> m) & (2 ** e - 1);
  const frac = bits & (2 ** m - 1);
  if (exp === 2 ** e - 1) return { v: frac ? NaN : sign * Infinity, kind: frac ? "NaN" : "infinity", ulp: NaN };
  if (exp === 0) return { v: sign * frac * 2 ** (1 - bias - m), kind: frac ? "subnormal" : "zero", ulp: 2 ** (1 - bias - m) };
  return { v: sign * (1 + frac / 2 ** m) * 2 ** (exp - bias), kind: "normal", ulp: 2 ** (exp - bias - m) };
}

/** Floating-point bits: sign, exponent and fraction fields for three small formats; click bits to see the value they encode. */
export function FloatBitsViz() {
  const [f, setF] = useState(0);
  const { e, m, name } = FORMATS[f];
  const n = 1 + e + m;
  const [bits, setBits] = useState(FORMATS[0].init);
  const d = decode(bits, e, m);
  const C = n > 9 ? 30 : 44, W = n * C + 10;
  const field = (k: number) => (k === 0 ? "sign" : k <= e ? "exp" : "frac");
  const exp = (bits >> m) & (2 ** e - 1);
  const show = (v: number) => (Number.isNaN(v) ? "NaN" : !Number.isFinite(v) ? (v > 0 ? "+∞" : "−∞") : Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-4) ? v.toExponential(4) : String(+v.toPrecision(6)));
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Format">
        {FORMATS.map((fm, k) => <button key={fm.name} type="button" className="seg" aria-pressed={f === k} onClick={() => { setF(k); setBits(fm.init); }}>{fm.name}</button>)}
      </div>
      <svg viewBox={`0 0 ${W} 80`} role="img" aria-label={`${name} bits encoding ${show(d.v)}`}>
        {Array.from({ length: n }, (_, k) => {
          const b = (bits >> (n - 1 - k)) & 1;
          const fl = field(k);
          return (
            <g key={k} onClick={() => setBits(bits ^ (1 << (n - 1 - k)))} style={{ cursor: "pointer" }}>
              <rect x={5 + k * C + 2} y={22} width={C - 4} height={C - 4} rx={5} className={b ? "viz-cell is-on" : "viz-cell"} style={fl === "exp" ? { strokeDasharray: "4 2" } : fl === "sign" ? { strokeWidth: 2.5 } : undefined} />
              <text x={5 + k * C + C / 2} y={22 + (C - 4) / 2 + 5} textAnchor="middle" className="viz-label">{b}</text>
            </g>
          );
        })}
        <text x={5 + C / 2} y={14} textAnchor="middle" className="plot-tick">sign</text>
        <text x={5 + C + (e * C) / 2} y={14} textAnchor="middle" className="plot-tick">exponent ({e} bits)</text>
        <text x={5 + (1 + e) * C + (m * C) / 2} y={14} textAnchor="middle" className="plot-tick">fraction ({m})</text>
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Click bits. Value <span className="mono">{show(d.v)}</span> ({d.kind}). Stored exponent {exp}, bias {2 ** (e - 1) - 1}.{" "}
        {d.kind === "normal" && <>Value = ±1.fraction × 2^({exp} − {2 ** (e - 1) - 1}). The gap to the next number here is {show(d.ulp)}, so {name} keeps about {(m * Math.log10(2) + 0.3).toFixed(1)} significant digits. </>}
        {d.kind === "subnormal" && <>Exponent field 0: no hidden 1, so values fade evenly down to zero in steps of {show(d.ulp)}. </>}
        Largest finite value: <span className="mono">{show((2 - 2 ** -m) * 2 ** (2 ** (e - 1) - 1))}</span>.
      </figcaption>
    </figure>
  );
}
