"use client";

import { useState } from "react";

const DIM = 128,
  BASE = 10000;

export function RopeWavelengthViz() {
  const [fi, setFi] = useState(0);
  const factor = 2 ** fi;
  const base = BASE * factor ** (DIM / (DIM - 2));
  const ctx = 4096 * factor;
  const waves = Array.from(
    { length: DIM / 2 },
    (_, i) => 2 * Math.PI * base ** ((2 * i) / DIM),
  );
  const unseen = waves.filter((w) => w > ctx).length;
  const W = 340,
    H = 170,
    x0 = 34,
    x1 = W - 8,
    y0 = 8,
    y1 = H - 26;
  const lo = 0,
    hi = 6;
  const Y = (w: number) => y1 - ((Math.log10(w) - lo) / (hi - lo)) * (y1 - y0);
  const bw = (x1 - x0) / waves.length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          extension factor: {factor}×{" "}
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={fi}
            onChange={(e) => setFi(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Wavelength of each rotary frequency pair on a log scale, with the context length marked"
      >
        {[1, 2, 3, 4, 5, 6].map((e) => (
          <g key={e}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(10 ** e)}
              y2={Y(10 ** e)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={Y(10 ** e) + 4}
              textAnchor="end"
              className="viz-label"
            >
              1e{e}
            </text>
          </g>
        ))}
        {waves.map((w, i) => (
          <rect
            key={i}
            x={x0 + i * bw + 0.5}
            y={Math.max(y0, Y(w))}
            width={Math.max(0.5, bw - 1)}
            height={y1 - Math.max(y0, Y(w))}
            fill={w > ctx ? "var(--danger)" : "var(--accent)"}
            opacity={0.8}
          />
        ))}
        <line
          x1={x0}
          x2={x1}
          y1={Y(ctx)}
          y2={Y(ctx)}
          stroke="var(--text)"
          strokeDasharray="5 3"
        />
        <text x={x1} y={y1 + 16} textAnchor="end" className="viz-label">
          frequency pair, fast to slow
        </text>
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        context {ctx} tokens; {unseen} of {DIM / 2} pairs never complete a turn
        within it
      </p>
      <figcaption className="viz-caption">
        Each bar is the wavelength, in tokens, of one rotary frequency pair for
        a head of width {DIM}; the dashed line is the context length. Pairs
        above the line (red) never complete a full rotation during training, so
        their angles beyond it are unfamiliar. Raising the rotary base as the
        context grows stretches the slow pairs by the same factor, keeping the
        picture almost unchanged.
      </figcaption>
    </figure>
  );
}
