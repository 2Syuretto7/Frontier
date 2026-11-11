"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeRng } from "./ml";

const DIMS = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000];
const N = 500;
const BINS = 20;
const V: View = { xmin: 0, xmax: DIMS.length - 1, ymin: 0, ymax: 1, w: 440, h: 200 };
const H: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 440, h: 140 };

/** Distances from one query point to 500 uniform random points, as the dimension grows. */
function distances(d: number, seed: number) {
  const r = makeRng(seed);
  const q = Array.from({ length: d }, () => r());
  return Array.from({ length: N }, () => {
    let s = 0;
    for (let j = 0; j < d; j++) s += (r() - q[j]) ** 2;
    return Math.sqrt(s);
  });
}

/** How the nearest and farthest neighbours become almost equally far as the dimension grows. */
export function CurseViz() {
  const [di, setDi] = useState(1);
  const data = useMemo(() => DIMS.map((d, i) => {
    const ds = distances(d, 100 + i);
    return { d, ds, min: Math.min(...ds), max: Math.max(...ds) };
  }), []);
  const cur = data[di];
  const { X, Y } = scales(V);
  const h = scales(H);
  const counts = new Array(BINS).fill(0);
  for (const x of cur.ds) counts[Math.min(BINS - 1, Math.floor((x / cur.max) * BINS))]++;
  const top = Math.max(...counts);
  const path = data.map((c, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(c.min / c.max).toFixed(1)}`).join(" ");
  const ratio = cur.min / cur.max;
  return (
    <figure className="viz">
      <Chart v={V} label="Ratio of nearest to farthest distance against dimension" xticks={DIMS.map((_, i) => i).filter((i) => i % 2 === 0)} xfmt={(i) => String(DIMS[i])} yticks={[0, 0.5, 1]} xlabel="dimension" ylabel="nearest ÷ farthest">
        <path d={path} className="plot-curve" />
        <line x1={X(di)} x2={X(di)} y1={0} y2={V.h} className="plot-mirror" />
        <circle cx={X(di)} cy={Y(ratio)} r={5} className="plot-hot" />
      </Chart>
      <Chart v={H} label={`Histogram of the 500 distances in dimension ${cur.d}, as a fraction of the farthest`} xticks={[0, 0.25, 0.5, 0.75, 1]} yticks={[]} xlabel="distance ÷ farthest distance">
        {counts.map((c, b) => <rect key={b} x={h.X(b / BINS) + 1} y={h.Y(c / top)} width={H.w / BINS - 2} height={H.h - h.Y(c / top)} className="ml-r1" style={{ stroke: "var(--accent)" }} />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          dimension = {cur.d}
          <input type="range" min={0} max={DIMS.length - 1} value={di} onChange={(e) => setDi(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        In {cur.d} dimension{cur.d > 1 ? "s" : ""}, the nearest of 500 random points is {(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}% as far away as the farthest.{" "}
        {cur.d <= 3 ? "In low dimension, near and far mean very different things." : cur.d >= 100 ? "Almost every point sits at nearly the same distance, so the nearest neighbour is hardly nearer than any other." : "The histogram is squeezing towards the right: distances are bunching together."}
      </figcaption>
    </figure>
  );
}
