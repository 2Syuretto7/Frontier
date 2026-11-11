"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { accuracy, knn, moons } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };
const G = 32;
const KS = [1, 3, 5, 9, 15, 25, 41, 61, 99];

/** The regions a k-nearest-neighbour classifier draws, and how k trades wiggle for smoothness. */
export function KnnRegionViz() {
  const [ki, setKi] = useState(0);
  const k = KS[ki];
  const train = useMemo(() => moons(3, 100, 0.25), []);
  const test = useMemo(() => moons(11, 400, 0.25), []);
  const { X, Y } = scales(V);
  const f = (x: number, y: number) => knn(train, x, y, k);
  const tr = accuracy(train, f), te = useMemo(() => accuracy(test, (x, y) => knn(train, x, y, k)), [test, train, k]);
  const cells = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    if (f((i + 0.5) / G, (j + 0.5) / G)) cells.push(<rect key={`${i}-${j}`} x={X(i / G)} y={Y((j + 1) / G)} width={V.w / G + 0.5} height={V.h / G + 0.5} className="ml-r1" />);
  }
  return (
    <figure className="viz">
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <Chart v={V} label={`Regions of a ${k}-nearest-neighbour classifier`} xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {cells}
          {train.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} className={p.c ? "ml-c1" : "ml-c0"} />)}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(tr * 100).toFixed(0)}%</b><span>training accuracy</span></div>
        <div className="ml-stat"><b>{(te * 100).toFixed(0)}%</b><span>accuracy on 400 new points</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          k = {k}
          <input type="range" min={0} max={KS.length - 1} value={ki} onChange={(e) => setKi(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded region is where the majority of the {k} nearest training points are filled.{" "}
        {k === 1
          ? "With k = 1 every training point is its own nearest neighbour, so training accuracy is perfect, and the boundary wraps around each noisy point."
          : k >= 61
            ? "With k this large, each vote reaches across most of the data, and the boundary loses the shape of the moons."
            : "Larger k averages over more neighbours, so the boundary smooths out and stray points stop carving islands."}
      </figcaption>
    </figure>
  );
}
