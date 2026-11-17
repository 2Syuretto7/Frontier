"use client";

import { useState } from "react";

const FORMATS = [
  { label: "3 exponent, 2 fraction bits", e: 3, m: 2 },
  { label: "4 exponent, 3 fraction bits (FP8 E4M3-like)", e: 4, m: 3 },
  { label: "5 exponent, 2 fraction bits (FP8 E5M2-like)", e: 5, m: 2 },
];

/** Every nonnegative finite value of a tiny IEEE-style format on a number line: equal counts per binade, so the gaps double at each power of two, and subnormals fill the gap at zero evenly. */
export function MinifloatLineViz() {
  const [k, setK] = useState(0);
  const [sub, setSub] = useState(true);
  const [zoom, setZoom] = useState(0);
  const { e, m } = FORMATS[k];
  const bias = 2 ** (e - 1) - 1;
  const vals: { v: number; s: boolean }[] = [];
  for (let ex = 0; ex < 2 ** e - 1; ex++) {
    for (let f = 0; f < 2 ** m; f++) {
      if (ex === 0) {
        if (f === 0) vals.push({ v: 0, s: false });
        else if (sub) vals.push({ v: (f / 2 ** m) * 2 ** (1 - bias), s: true });
      } else vals.push({ v: (1 + f / 2 ** m) * 2 ** (ex - bias), s: false });
    }
  }
  const vmax = vals[vals.length - 1].v;
  const minNormal = 2 ** (1 - bias);
  const hi = vmax / 2 ** zoom;
  const W = 330, H = 90;
  const X = (v: number) => 12 + (v / hi) * (W - 24);
  const shown = vals.filter((q) => q.v <= hi * 1.0001);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {FORMATS.map((f, i) => (
          <button key={f.label} type="button" className="seg" aria-pressed={k === i} onClick={() => { setK(i); setZoom(0); }}>{f.label}</button>
        ))}
        <button type="button" className="seg" aria-pressed={sub} onClick={() => setSub(!sub)}>subnormals</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          zoom 2^{zoom}
          <input type="range" min={0} max={2 ** e - 3} value={zoom} onChange={(ev) => setZoom(Number(ev.target.value))} aria-label="zoom towards zero" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Representable values of a small floating-point format on a number line">
        <line x1={X(0)} x2={X(hi)} y1={50} y2={50} stroke="var(--border)" />
        {shown.map((q, i) => (
          <line key={i} x1={X(q.v)} x2={X(q.v)} y1={q.s ? 38 : 32} y2={58} stroke={q.s ? "var(--danger)" : "var(--accent)"} strokeWidth={1.2} />
        ))}
        {minNormal <= hi ? <line x1={X(minNormal)} x2={X(minNormal)} y1={22} y2={62} stroke="var(--text-muted)" strokeDasharray="2 2" /> : null}
        <text x={X(0)} y={78} className="viz-label">0</text>
        <text x={X(hi)} y={78} textAnchor="end" className="viz-label">{hi}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {vals.length} values ≥ 0; largest {vmax}; smallest normal {minNormal}; smallest positive {vals[1].v}; ε = {2 ** -m}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each tick is a representable nonnegative value. Between consecutive powers of two there are always 2^(fraction
        bits) values, so the spacing doubles at every power of two. Zoom in towards zero: below the smallest normal number
        (dotted line) the subnormals, in red, continue with the spacing of the first binade, so the gap between 0 and the
        smallest normal is filled evenly. Turn them off and that whole interval holds nothing but 0, which is flush-to-zero.
      </figcaption>
    </figure>
  );
}
