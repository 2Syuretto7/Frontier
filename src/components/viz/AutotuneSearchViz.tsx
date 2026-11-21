"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const BM = [16, 32, 64, 128, 256, 512];
const BN = [16, 32, 64, 128, 256, 512];
type Strat = "random" | "model";

export function AutotuneSearchViz() {
  const [k, setK] = useState(6);
  const [strat, setStrat] = useState<Strat>("model");
  const { truth, pred, perm } = useMemo(() => {
    const r = rand(29);
    const truth: number[] = [],
      pred: number[] = [];
    BM.forEach((m, i) =>
      BN.forEach((n, j) => {
        const lm = Math.log2(m),
          ln = Math.log2(n);
        let t = 1 + 0.06 * (lm - 7) ** 2 + 0.05 * (ln - 7.2) ** 2;
        if (m * n > 65536) t += 0.9;
        t *= 1 + 0.12 * r();
        truth.push(t);
        pred.push(t * (1 + 0.35 * (r() - 0.5)));
        void i;
        void j;
      }),
    );
    const perm = truth.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return { truth, pred, perm };
  }, []);
  const order =
    strat === "random"
      ? perm
      : truth.map((_, i) => i).sort((a, b) => pred[a] - pred[b]);
  const measured = order.slice(0, k);
  const pick = measured.reduce((a, b) => (truth[b] < truth[a] ? b : a));
  const best = truth.reduce((a, _, i) => (truth[i] < truth[a] ? i : a), 0);
  const lo = Math.min(...truth),
    hi = Math.max(...truth);
  const W = 330,
    cs = 34,
    x0 = 60,
    y0 = 6;
  const H = y0 + BM.length * cs + 30;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          measurements: {k}{" "}
          <input
            type="range"
            min={1}
            max={36}
            step={1}
            value={k}
            onChange={(e) => setK(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Strategy"
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {(
            [
              ["random", "random order"],
              ["model", "cost model first"],
            ] as [Strat, string][]
          ).map(([s, l]) => (
            <button
              key={s}
              type="button"
              className={s === strat ? "btn btn-primary" : "btn"}
              aria-pressed={s === strat}
              onClick={() => setStrat(s)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Grid of block sizes shaded by run time, with measured configurations outlined"
      >
        {BM.map((m, i) => (
          <text
            key={m}
            x={x0 - 6}
            y={y0 + i * cs + cs / 2 + 4}
            textAnchor="end"
            className="viz-label"
          >
            BM {m}
          </text>
        ))}
        {BN.map((n, j) => (
          <text
            key={n}
            x={x0 + j * cs + cs / 2}
            y={y0 + BM.length * cs + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        {truth.map((t, idx) => {
          const i = Math.floor(idx / BN.length),
            j = idx % BN.length;
          const isM = measured.includes(idx);
          return (
            <rect
              key={idx}
              x={x0 + j * cs + 1}
              y={y0 + i * cs + 1}
              width={cs - 2}
              height={cs - 2}
              fill="var(--accent)"
              opacity={0.1 + 0.8 * (1 - (t - lo) / (hi - lo))}
              stroke={
                idx === pick ? "var(--success)" : isM ? "var(--text)" : "none"
              }
              strokeWidth={idx === pick ? 3 : 1.5}
            />
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        BN across, BM down; best found is{" "}
        {((truth[pick] / truth[best] - 1) * 100).toFixed(1)}% slower than the
        best of all 36
      </p>
      <figcaption className="viz-caption">
        Darker cells run faster. Outlined cells have been measured, and the
        green one is the fastest measured so far. Measuring in a random order
        needs many runs to stumble on a good configuration; measuring in the
        order a rough cost model predicts finds a near-best one within a few,
        even though the model&apos;s predictions are off by up to about 17%.
      </figcaption>
    </figure>
  );
}
