"use client";

import { useMemo, useState } from "react";

const TS = [16, 32];
const NDOC = 8;
const COLORS = ["var(--accent)", "var(--success)", "var(--danger)", "var(--text-muted)"];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Document lengths (including the end-of-text token) with a long tail, then both layouts: padded rows and packed rows. */
export function layouts(T: number, seed: number) {
  const u = rand(seed);
  const lens = Array.from({ length: NDOC }, () => 2 + Math.floor(-Math.log(1 - u()) * T * 0.45));
  const padded: number[][] = [];
  lens.forEach((n, d) => {
    for (let s = 0; s < n; s += T) padded.push(Array.from({ length: T }, (_, i) => (s + i < n ? d : -1)));
  });
  const stream = lens.flatMap((n, d) => new Array(n).fill(d));
  const packed: number[][] = [];
  for (let s = 0; s + T <= stream.length; s += T) packed.push(stream.slice(s, s + T));
  const used = lens.reduce((a, b) => a + b, 0);
  return { lens, padded, packed, used, padWaste: 1 - used / (padded.length * T), dropped: stream.length - packed.length * T };
}

function Grid({ rows, T, label }: { rows: number[][]; T: number; label: string }) {
  const W = 320, c = W / T, H = rows.length * c;
  return (
    <div style={{ margin: "8px 0" }}>
      <div className="viz-label" style={{ marginBottom: 4 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block" }} role="img" aria-label={label}>
        {rows.map((r, i) => r.map((d, j) => (
          <rect key={`${i}-${j}`} x={j * c + 0.5} y={i * c + 0.5} width={c - 1} height={c - 1}
            fill={d < 0 ? "none" : COLORS[d % COLORS.length]} stroke="var(--border)" strokeWidth={0.5} />
        )))}
      </svg>
    </div>
  );
}

export function PackPadViz() {
  const [ti, setTi] = useState(0);
  const [seed, setSeed] = useState(2);
  const T = TS[ti];
  const r = useMemo(() => layouts(T, seed), [T, seed]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">row length T</span>
        {TS.map((t, i) => (
          <button key={t} type="button" className="seg" aria-pressed={ti === i} onClick={() => setTi(i)}>{t}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new documents</button>
      </div>
      <div aria-live="polite">
        <Grid rows={r.padded} T={T} label={`one document per row, padded: ${r.padded.length} rows, ${(100 * r.padWaste).toFixed(0)}% padding`} />
        <Grid rows={r.packed} T={T} label={`packed: ${r.packed.length} rows, no padding, ${r.dropped} tokens left over for the next batch`} />
      </div>
      <figcaption className="viz-caption">
        Eight documents of random length, each ending in an end-of-text token, shown by colour. Giving each document its own
        rows wastes every empty square on padding, and with a long-tailed spread of lengths that is often around half of
        the batch. Packing concatenates the documents and cuts the stream into rows, so every square trains the model. A
        row can then hold the end of one document and the start of the next; a document mask, or simply the end-of-text
        token, tells the model where one ends.
      </figcaption>
    </figure>
  );
}
