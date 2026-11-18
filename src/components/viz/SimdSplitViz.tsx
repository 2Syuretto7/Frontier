"use client";

import { useState } from "react";

const N = 40;
const WIDTHS = [4, 8, 16];

/** Split a loop over n elements into a scalar prologue up to an aligned address, full vectors, and a scalar epilogue. */
export function splitLoop(n: number, width: number, offset: number) {
  const pro = Math.min(((-offset % width) + width) % width, n);
  const body = Math.floor((n - pro) / width);
  return { pro, body, epi: n - pro - body * width };
}

export function SimdSplitViz() {
  const [w, setW] = useState(8);
  const [off, setOff] = useState(3);
  const { pro, body, epi } = splitLoop(N, w, off);
  const total = pro + body + epi;
  const COLS = 20, cs = 15, W = COLS * cs + 4, H = 2 * (cs + 6) + 4;
  const cells = Array.from({ length: N }, (_, i) => {
    if (i < pro) return { fill: "var(--border)", label: "s" };
    if (i < pro + body * w) {
      const v = Math.floor((i - pro) / w);
      return { fill: v % 2 ? "var(--accent-soft)" : "var(--accent)", label: "" };
    }
    return { fill: "var(--border)", label: "s" };
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Vector width">
          {WIDTHS.map((x) => (
            <button key={x} type="button" className="seg" aria-pressed={w === x} onClick={() => setW(x)}>{`${x} lanes`}</button>
          ))}
        </div>
        <label className="viz-label" htmlFor="simd-off">start offset: {off}</label>
        <input id="simd-off" type="range" min={0} max={15} step={1} value={off} onChange={(e) => setOff(Number(e.target.value))} style={{ flex: 1, minWidth: 100 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Forty array elements coloured by how they are processed">
        {cells.map((c, i) => {
          const x = 2 + (i % COLS) * cs, y = 2 + Math.floor(i / COLS) * (cs + 6);
          return (
            <g key={i}>
              <rect x={x} y={y} width={cs - 2} height={cs} fill={c.fill} stroke="var(--border)" />
              {c.label && <text x={x + (cs - 2) / 2} y={y + cs - 4} textAnchor="middle" style={{ fontSize: 8, fill: "var(--text-muted)" }}>{c.label}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${pro} scalar + ${body} vector + ${epi} scalar = ${total} instructions for ${N} elements, ${(N / total).toFixed(2)}× fewer`}
      </div>
      <figcaption className="viz-caption">
        Forty elements, processed by a loop that uses vector instructions only on full, aligned groups. Shaded blocks are
        vectors; cells marked s are handled one at a time before the first aligned address and after the last full vector.
        With 8 lanes and the array aligned, the loop needs 5 instructions instead of 40; with 16 lanes and an unlucky
        offset, the scalar ends dominate and wider vectors help little.
      </figcaption>
    </figure>
  );
}
