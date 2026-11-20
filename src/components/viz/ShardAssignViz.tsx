"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 24;
const WORLDS = [3, 4, 5, 8];
const r0 = rand(25);
const SIZES = Array.from({ length: N }, () => 0.6 + 0.8 * r0()); // shard sizes in units of a nominal shard

/** Shard visited at position i of an epoch: an affine permutation, valid because gcd(5, 24) = 1. */
export function epochOrder(epoch: number) {
  return Array.from({ length: N }, (_, i) => (5 * i + 7 * epoch) % N);
}

export function ShardAssignViz() {
  const [wi, setWi] = useState(1);
  const [ep, setEp] = useState(0);
  const world = WORLDS[wi];
  const order = epochOrder(ep);
  const perRank = Array.from({ length: world }, (_, r) =>
    order.filter((_, i) => i % world === r),
  );
  const loads = perRank.map((ss) => ss.reduce((t, s) => t + SIZES[s], 0));
  const mean = loads.reduce((a, b) => a + b, 0) / world;
  const maxLoad = Math.max(...loads);
  const W = 330,
    X0 = 50,
    PW = 272,
    Y0 = 4;
  const RH = Math.min(26, 200 / world);
  const scale = PW / maxLoad;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="viz-label">ranks</span>
          <div className="segmented" role="group" aria-label="Number of ranks">
            {WORLDS.map((v, j) => (
              <button
                key={v}
                type="button"
                className="seg"
                aria-pressed={wi === j}
                onClick={() => setWi(j)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="segmented" role="group" aria-label="Epoch">
          {[0, 1].map((e) => (
            <button
              key={e}
              type="button"
              className="seg"
              aria-pressed={ep === e}
              onClick={() => setEp(e)}
            >{`epoch ${e + 1}`}</button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + world * RH + 4}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Shards assigned to each rank"
      >
        {perRank.map((ss, r) => {
          let acc = 0;
          const yy = Y0 + r * RH;
          return (
            <g key={r}>
              <text
                x={X0 - 6}
                y={yy + RH / 2 + 4}
                textAnchor="end"
                className="viz-label"
              >{`rank ${r}`}</text>
              {ss.map((s) => {
                const x0 = X0 + acc * scale,
                  w = SIZES[s] * scale;
                acc += SIZES[s];
                return (
                  <g key={s}>
                    <rect
                      x={x0}
                      y={yy + 2}
                      width={w - 1.5}
                      height={RH - 4}
                      rx={2}
                      style={{ fill: "var(--accent)" }}
                      opacity={0.6 + 0.4 * (s / N)}
                    />
                    {w > 16 && (
                      <text
                        x={x0 + w / 2}
                        y={yy + RH / 2 + 4}
                        textAnchor="middle"
                        className="viz-label"
                        style={{ fill: "var(--bg)" }}
                      >
                        {s}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {N % world === 0 ? `${N / world}` : `${Math.floor(N / world)} to ${Math.ceil(N / world)}`} shards per rank; the
        busiest rank reads {(100 * (maxLoad / mean - 1)).toFixed(0)}% more
        tokens than the average
      </div>
      <figcaption className="viz-caption">
        Twenty-four shards of unequal size dealt round robin to the ranks, in an
        order that changes each epoch. Each bar is one shard, labelled by its
        number; bar length is its size. When the shard count is not a multiple
        of the number of ranks, or shard sizes differ, some ranks finish later
        and the others wait, unless each rank stops after a fixed number of
        tokens.
      </figcaption>
    </figure>
  );
}
