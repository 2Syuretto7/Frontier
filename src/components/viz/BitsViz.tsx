"use client";

import { useState } from "react";

/** An 8-bit register: click bits to flip them and read the same pattern as unsigned, two's complement and hex; add 1 to watch it wrap. */
export function BitsViz() {
  const [x, setX] = useState(0b01111110);
  const [carry, setCarry] = useState<string | null>(null);
  const bits = Array.from({ length: 8 }, (_, k) => (x >> (7 - k)) & 1);
  const signed = x >= 128 ? x - 256 : x;
  const C = 52, W = 8 * C + 10;
  const add = (d: number) => {
    const raw = x + (d & 0xff);
    const r = raw & 0xff;
    const sOld = signed, sNew = r >= 128 ? r - 256 : r;
    const ovf = d > 0 ? sOld >= 0 && sNew < 0 : sOld < 0 && sNew >= 0;
    setCarry(`${d > 0 ? "+1" : "−1"}: ${raw > 0xff ? "carry out of bit 7 (unsigned wrap). " : ""}${ovf ? "Signed overflow: the true answer does not fit in −128 to 127, so the sign flipped." : ""}`);
    setX(r);
  };
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 96`} role="img" aria-label={`Bits ${bits.join("")}`}>
        {bits.map((b, k) => (
          <g key={k} onClick={() => { setX(x ^ (1 << (7 - k))); setCarry(null); }} style={{ cursor: "pointer" }}>
            <rect x={5 + k * C + 3} y={8} width={C - 6} height={C - 6} rx={6} className={b ? "viz-cell is-on" : "viz-cell"} />
            <text x={5 + k * C + C / 2} y={8 + C / 2 + 4} textAnchor="middle" className="viz-label">{b}</text>
            <text x={5 + k * C + C / 2} y={78} textAnchor="middle" className="plot-tick">{k === 0 ? "−128" : 2 ** (7 - k)}</text>
          </g>
        ))}
        <text x={5 + C / 2} y={92} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>(+128 unsigned)</text>
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => add(1)}>Add 1</button>
        <button type="button" className="btn" onClick={() => add(-1)}>Subtract 1</button>
        <button type="button" className="btn" onClick={() => { setX(0b01111111); setCarry(null); }}>Set to 127</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Click a bit to flip it. Unsigned <span className="mono">{x}</span>, two&rsquo;s complement <span className="mono">{signed}</span>, hex <span className="mono">0x{x.toString(16).toUpperCase().padStart(2, "0")}</span>. The top bit is worth −128 when signed and +128 when unsigned; all others are the same. {carry}
      </figcaption>
    </figure>
  );
}
