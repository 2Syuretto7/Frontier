"use client";

import { useState } from "react";

const BASE = 10,
  PER_TOKEN = 0.04; // ms per step for the running decode batch, and ms per prefill token
const PROMPT = 2048,
  ARRIVE = 30; // a new prompt arrives at 30 ms
const CHUNKS: [string, number][] = [
  ["no chunking", PROMPT],
  ["chunk 512", 512],
  ["chunk 128", 128],
];
const HORIZON = 300;

/** Step start and end times: decode-only steps, except that while the prompt is being prefilled each step also carries a chunk. */
export function schedule(chunk: number) {
  const steps: { t0: number; t1: number; chunk: number }[] = [];
  let t = 0,
    left = PROMPT,
    ttft = 0;
  while (t < HORIZON) {
    const c = t >= ARRIVE && left > 0 ? Math.min(chunk, left) : 0;
    const t1 = t + BASE + c * PER_TOKEN;
    steps.push({ t0: t, t1, chunk: c });
    if (c > 0) {
      left -= c;
      if (left === 0) ttft = t1 - ARRIVE;
    }
    t = t1;
  }
  return { steps, ttft };
}

export function ChunkedPrefillViz() {
  const [ci, setCi] = useState(0);
  const { steps, ttft } = schedule(CHUNKS[ci][1]);
  const gap = Math.max(...steps.map((s) => s.t1 - s.t0));
  const W = 330,
    X0 = 10,
    PW = 310,
    Y0 = 18,
    BH = 30;
  const x = (t: number) => X0 + (Math.min(t, HORIZON) / HORIZON) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Prefill chunk size">
          {CHUNKS.map(([name], j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={ci === j}
              onClick={() => setCi(j)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + BH + 22}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Decode steps over time with prefill chunks"
      >
        <line
          x1={x(ARRIVE)}
          x2={x(ARRIVE)}
          y1={4}
          y2={Y0 + BH + 4}
          stroke="var(--text)"
          strokeDasharray="2 2"
        />
        <text x={x(ARRIVE) + 3} y={12} className="viz-label">
          prompt arrives
        </text>
        {steps
          .filter((s) => s.t0 < HORIZON)
          .map((s, i) => {
            const w = x(s.t1) - x(s.t0);
            const frac =
              s.chunk > 0 ? (s.chunk * PER_TOKEN) / (s.t1 - s.t0) : 0;
            return (
              <g key={i}>
                <rect
                  x={x(s.t0) + 0.5}
                  y={Y0}
                  width={Math.max(w - 1, 0.5)}
                  height={BH}
                  rx={2}
                  style={{ fill: "var(--text-muted)" }}
                />
                {frac > 0 && (
                  <rect
                    x={x(s.t0) + 0.5}
                    y={Y0}
                    width={Math.max(w * frac - 1, 0.5)}
                    height={BH}
                    rx={2}
                    style={{ fill: "var(--accent)" }}
                  />
                )}
              </g>
            );
          })}
        {[0, 100, 200, 300].map((v) => (
          <text
            key={v}
            x={x(v)}
            y={Y0 + BH + 16}
            textAnchor={v === 300 ? "end" : v === 0 ? "start" : "middle"}
            className="viz-label"
          >{`${v} ms`}</text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        longest wait between tokens for running sequences {gap.toFixed(1)} ms;
        new prompt&apos;s first token after {ttft.toFixed(1)} ms
      </div>
      <figcaption className="viz-caption">
        Each block is one forward pass of a server that is decoding a batch
        (grey, 10 ms a step) when a 2,048-token prompt arrives. The
        prompt&apos;s prefill (colour) is either done in one long pass, stalling
        every running sequence, or split into chunks that ride along with the
        decode steps: smaller chunks keep token gaps short but delay the new
        request&apos;s first token.
      </figcaption>
    </figure>
  );
}
