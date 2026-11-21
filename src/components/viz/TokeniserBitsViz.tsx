"use client";

import { useState } from "react";

/** Tokens and codebook sizes for a 256 x 256 image. */
const TOKS: [string, number, number][] = [
  ["VQGAN, f = 16, K = 1024", 256, 1024],
  ["VQ, f = 16, K = 16384", 256, 16384],
  ["LFQ, f = 16, K = 2¹⁸", 256, 2 ** 18],
  ["VQ, f = 8, K = 16384", 1024, 16384],
  ["1-D, 32 tokens, K = 4096", 32, 4096],
];

export function bitsPerImage(tokens: number, K: number) {
  return tokens * Math.log2(K);
}

export function TokeniserBitsViz() {
  const [view, setView] = useState<"bits" | "tokens">("bits");
  const vals = TOKS.map(([, n, K]) =>
    view === "bits" ? bitsPerImage(n, K) : n,
  );
  const raw = 256 * 256 * 3 * 8;
  const W = 330,
    RH = 30,
    X0 = 150,
    PW = 150,
    H = TOKS.length * RH + 30;
  const lmin = 1,
    lmax = view === "bits" ? Math.log10(raw) : 4;
  const sx = (v: number) => X0 + ((Math.log10(v) - lmin) / (lmax - lmin)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Quantity">
          {(["bits", "tokens"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Size of tokenised images on a log scale"
      >
        {TOKS.map(([name], i) => (
          <g key={name}>
            <text
              x={X0 - 6}
              y={i * RH + 19}
              textAnchor="end"
              className="viz-label"
              style={{ fontSize: 10 }}
            >
              {name}
            </text>
            <rect
              x={X0}
              y={i * RH + 6}
              width={Math.max(1, sx(vals[i]) - X0)}
              height={RH - 12}
              fill="var(--accent)"
              fillOpacity={0.7}
            />
            <text
              x={sx(vals[i]) + 4}
              y={i * RH + 19}
              className="viz-label"
              style={{ fontSize: 10 }}
            >
              {Math.round(vals[i]).toLocaleString("en-IN")}
            </text>
          </g>
        ))}
        {view === "bits" && (
          <line
            x1={sx(raw)}
            x2={sx(raw)}
            y1={0}
            y2={TOKS.length * RH}
            stroke="var(--danger)"
            strokeDasharray="3 3"
          />
        )}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="viz-label">
          {view === "bits" ? "log scale; dashed line: raw pixels" : "log scale"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        How much a tokeniser keeps of a 256 × 256 image: tokens times log₂ of
        the codebook size. Even the largest is over a hundred times smaller than
        the raw pixels, and the one-dimensional tokeniser describes the whole
        image in 384 bits. A generator then models these tokens; fewer tokens
        make generation cheaper but force the decoder to invent more of the
        detail.
      </figcaption>
    </figure>
  );
}
