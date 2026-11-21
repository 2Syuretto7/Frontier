"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NS = [50, 100, 200, 400, 800];
const CK = 40;

export function ContinuousMetricViz() {
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const { acc, lp } = useMemo(() => {
    const r = rand(23);
    const gauss = () => {
      const u = Math.max(1e-9, r()),
        v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const items = Array.from({ length: n }, () => ({
      b: 3 + 0.3 * gauss(),
      s: 0.6 + 0.2 * r(),
    }));
    const acc: number[] = [],
      lp: number[] = [];
    for (let c = 0; c < CK; c++) {
      const t = (c + 1) / CK;
      let right = 0,
        sum = 0;
      for (const it of items) {
        const m = 4.5 * t * (0.8 + it.s * 0.4) - it.b + 0.35 * gauss();
        if (m > 0) right++;
        sum += -Math.log(1 + Math.exp(-m));
      }
      acc.push(right / n);
      lp.push(sum / n);
    }
    return { acc, lp };
  }, [n]);
  const W = 330,
    x0 = 36,
    pw = 284,
    ph = 70,
    gap = 26,
    y1 = 8,
    y2 = y1 + ph + gap;
  const H = y2 + ph + 22;
  const sx = (c: number) => x0 + (c / (CK - 1)) * pw;
  const syA = (v: number) => y1 + ph - v * ph;
  const lpLo = -3.2,
    lpHi = 0;
  const syL = (v: number) =>
    y2 + ph - ((Math.max(lpLo, v) - lpLo) / (lpHi - lpLo)) * ph;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          items in the task: {n}{" "}
          <input
            type="range"
            min={0}
            max={NS.length - 1}
            step={1}
            value={ni}
            onChange={(e) => setNi(+e.target.value)}
          />
        </label>
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
        aria-label="Accuracy and mean log-probability of the correct answer across checkpoints"
      >
        {[
          [y1, "accuracy"],
          [y2, "log-prob of correct answer"],
        ].map(([y, l]) => (
          <g key={l as string}>
            <rect
              x={x0}
              y={y as number}
              width={pw}
              height={ph}
              fill="none"
              stroke="var(--border)"
            />
            <text x={x0 + 4} y={(y as number) + 12} className="viz-label">
              {l}
            </text>
          </g>
        ))}
        {[0, 1].map((v) => (
          <text
            key={v}
            x={x0 - 4}
            y={syA(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[-3, 0].map((v) => (
          <text
            key={v}
            x={x0 - 4}
            y={syL(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <polyline
          points={acc.map((v, c) => `${sx(c)},${syA(v)}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.4}
        />
        <polyline
          points={lp.map((v, c) => `${sx(c)},${syL(v)}`).join(" ")}
          fill="none"
          stroke="var(--success)"
          strokeWidth={1.4}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          checkpoint
        </text>
      </svg>
      <figcaption className="viz-caption">
        The same simulated checkpoints scored two ways. Accuracy counts an item
        only once the correct answer wins, so it sits near zero, then climbs
        steeply as many items cross over together; with few items it moves in
        visible jumps. The mean log-probability of the correct answer improves
        steadily from the first checkpoint, and shows progress long before
        accuracy does.
      </figcaption>
    </figure>
  );
}
