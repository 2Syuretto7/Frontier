"use client";

import { useState } from "react";

const SIZE = 11, FREQ = 0.2, SIGMA = 2.4, NF = 8;
const ANGLES = Array.from({ length: NF }, (_, i) => (i * Math.PI) / NF);

const coord = (i: number) => i - (SIZE - 1) / 2;
export const grating = (theta: number, phase: number) =>
  Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => Math.cos(2 * Math.PI * FREQ * (coord(c) * Math.cos(theta) + coord(r) * Math.sin(theta)) + phase)));

/** Zero-mean Gabor filter: an oriented cosine under a Gaussian window. */
export function gabor(theta: number) {
  const g = grating(theta, 0).map((row, r) => row.map((v, c) => v * Math.exp(-(coord(r) ** 2 + coord(c) ** 2) / (2 * SIGMA * SIGMA))));
  const m = g.flat().reduce((a, v) => a + v, 0) / (SIZE * SIZE);
  return g.map((row) => row.map((v) => v - m));
}

/** Response of a filter to a grating of the given orientation, maximised over 8 phases (a simple complex cell). */
export const response = (k: number[][], theta: number) =>
  Math.max(...Array.from({ length: 8 }, (_, p) => {
    const g = grating(theta, (p * Math.PI) / 4);
    return k.reduce((a, row, r) => a + row.reduce((b, v, c) => b + v * g[r][c], 0), 0);
  }));

const BANK = ANGLES.map(gabor);

export function OrientationTuningViz() {
  const [gi, setGi] = useState(2);
  const g = grating(ANGLES[gi], 0);
  const resp = BANK.map((k) => Math.max(0, response(k, ANGLES[gi])));
  const top = Math.max(...BANK.map((k) => response(k, 0)));
  const W = 330, cell = 3.2, fw = SIZE * cell, gap = (W - 20 - NF * fw) / (NF - 1);
  const px = (m: number[][], x0: number, y0: number, sc: number) =>
    m.flatMap((row, r) => row.map((v, c) => (
      <rect key={`${r}-${c}`} x={x0 + c * sc} y={y0 + r * sc} width={sc} height={sc} fill={v >= 0 ? "var(--accent)" : "var(--danger)"} opacity={Math.min(1, Math.abs(v))} />
    )));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}>
        {ANGLES.map((a, i) => (
          <button key={i} type="button" className="seg" aria-pressed={i === gi} onClick={() => setGi(i)}>{Math.round((a * 180) / Math.PI)}°</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 170`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A grating input, a bank of oriented filters and each filter's response">
        <text x={10} y={12} className="viz-label">input grating</text>
        {px(g, 10, 18, 4)}
        <text x={70} y={12} className="viz-label">filters and their responses</text>
        {BANK.map((k, i) => {
          const x0 = 10 + i * (fw + gap), h = (resp[i] / top) * 48;
          return (
            <g key={i}>
              {px(k.map((row) => row.map((v) => v * 1.4)), x0, 70, cell)}
              <rect x={x0 + 2} y={160 - h} width={fw - 4} height={h} fill={i === gi ? "var(--accent)" : "var(--text-muted)"} />
            </g>
          );
        })}
        <line x1={10} y1={160} x2={W - 10} y2={160} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        strongest response: the {Math.round((ANGLES[resp.indexOf(Math.max(...resp))] * 180) / Math.PI)}° filter
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Eight Gabor filters, oriented cosines under a Gaussian window, like the first-layer filters trained CNNs learn on
        natural images (colour positive, red negative). Each bar is a filter&apos;s best response to the grating over shifts of
        its phase. The filter matching the grating&apos;s orientation responds strongly and its neighbours weakly: the bank turns
        orientation, a property no single pixel holds, into which unit is active.
      </figcaption>
    </figure>
  );
}
