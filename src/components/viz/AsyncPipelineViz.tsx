"use client";

import { useState } from "react";

const G = 5, // time units to generate a batch
  TR = 3, // to train on it
  SY = 1, // to send the new weights to the generator
  NB = 6;
const LAGS = [0, 1, 2];

type Block = { start: number; end: number; label: string };

/** Generator and trainer timelines when the generator may run up to `lag` policy versions ahead of the trainer. */
export function pipeline(lag: number) {
  const avail = [0]; // time each policy version reaches the generator
  const gen: Block[] = [],
    train: Block[] = [],
    sync: Block[] = [];
  let genFree = 0,
    trainFree = 0,
    maxStale = 0;
  for (let b = 0; b < NB; b++) {
    // batch b may use a policy at most `lag` versions old, so it waits for version b - lag
    const start = Math.max(genFree, avail[Math.max(b - lag, 0)]);
    const used = avail.filter((t) => t <= start).length - 1;
    maxStale = Math.max(maxStale, b - used);
    gen.push({ start, end: start + G, label: `v${used}` });
    genFree = start + G;
    // the trainer takes batch b as soon as it and the trainer are free
    const s = Math.max(genFree, trainFree);
    train.push({ start: s, end: s + TR, label: `v${b + 1}` });
    sync.push({ start: s + TR, end: s + TR + SY, label: "" });
    trainFree = s + TR + SY;
    avail.push(trainFree);
  }
  return { gen, train, sync, total: trainFree, maxStale };
}

export function AsyncPipelineViz() {
  const [li, setLi] = useState(1);
  const { gen, train, sync, total, maxStale } = pipeline(LAGS[li]);
  const W = 340,
    X0 = 64,
    X1 = W - 8,
    TMAX = 60;
  const sx = (t: number) => X0 + (t / TMAX) * (X1 - X0);
  const lane = (blocks: Block[], y: number, fill: string, text: string) =>
    blocks.map((b, i) => (
      <g key={i}>
        <rect
          x={sx(b.start)}
          y={y}
          width={sx(b.end) - sx(b.start) - 1}
          height={20}
          style={{ fill }}
        />
        {b.label ? (
          <text
            x={(sx(b.start) + sx(b.end)) / 2}
            y={y + 14}
            textAnchor="middle"
            className="viz-label"
            style={{ fill: text }}
          >
            {b.label}
          </text>
        ) : null}
      </g>
    ));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="How far the generator may run ahead"
        >
          {LAGS.map((l, j) => (
            <button
              key={l}
              type="button"
              className="seg"
              aria-pressed={li === j}
              onClick={() => setLi(j)}
            >
              {l === 0 ? "synchronous" : `${l} step${l > 1 ? "s" : ""} ahead`}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} 92`}
        style={{
          width: "100%",
          maxWidth: 560,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Timelines of generation, training and weight sync"
      >
        <text x={4} y={24} className="viz-label">
          generator
        </text>
        <text x={4} y={56} className="viz-label">
          trainer
        </text>
        {lane(gen, 10, "var(--accent-soft)", "var(--text)")}
        {lane(train, 42, "var(--accent)", "var(--bg)")}
        {lane(sync, 42, "var(--danger)", "var(--bg)")}
        {[0, 20, 40, 60].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={84}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        six updates finish at time {total}; samples up to {maxStale} version
        {maxStale === 1 ? "" : "s"} old
      </div>
      <figcaption className="viz-caption">
        Generating a batch takes 5 units, training on it 3, and sending the new
        weights 1 (red). Each generation block is labelled with the policy
        version it samples from; each training block with the version it
        produces. Synchronously, each side waits for the other. Letting the
        generator run one step ahead hides training behind generation, at the
        cost of samples from a policy one update old. Allowing two steps changes
        nothing here: generation is the slower side, so the generator never gets
        further ahead.
      </figcaption>
    </figure>
  );
}
