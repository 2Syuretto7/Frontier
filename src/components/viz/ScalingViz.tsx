"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng } from "./ml";

type Row = { age: number; pay: number; c: 0 | 1 };
const V: View = { xmin: 20, xmax: 60, ymin: 3, ymax: 30, w: 320, h: 300 };
const G = 30, K = 7;

/** Age decides the label; annual pay, in rupees, is irrelevant but numerically enormous. */
function makeData(seed: number, n: number): Row[] {
  const r = makeRng(seed), g = makeNormal(r);
  return Array.from({ length: n }, () => {
    const age = 20 + 40 * r(), pay = 3 + 27 * r();
    return { age, pay, c: (age + 3 * g() > 40 ? 1 : 0) as 0 | 1 };
  });
}

/** k-nearest neighbours with and without standardising the features first. */
export function ScalingViz() {
  const [std, setStd] = useState(false);
  const train = useMemo(() => makeData(4, 120), []);
  const test = useMemo(() => makeData(5, 600), []);
  const stats = useMemo(() => {
    const m = (f: (r: Row) => number) => train.reduce((s, r) => s + f(r), 0) / train.length;
    const ma = m((r) => r.age), mp = m((r) => r.pay * 1e5);
    const sa = Math.sqrt(m((r) => (r.age - ma) ** 2)), sp = Math.sqrt(m((r) => (r.pay * 1e5 - mp) ** 2));
    return { ma, mp, sa, sp };
  }, [train]);
  const feat = (age: number, pay: number) => (std ? [(age - stats.ma) / stats.sa, (pay * 1e5 - stats.mp) / stats.sp] : [age, pay * 1e5]);
  const tf = useMemo(() => train.map((r) => ({ f: std ? [(r.age - stats.ma) / stats.sa, (r.pay * 1e5 - stats.mp) / stats.sp] : [r.age, r.pay * 1e5], c: r.c })), [train, std, stats]);
  const predict = (age: number, pay: number) => {
    const q = feat(age, pay);
    const ds = tf.map((t) => [(t.f[0] - q[0]) ** 2 + (t.f[1] - q[1]) ** 2, t.c] as const).sort((a, b) => a[0] - b[0]);
    let ones = 0;
    for (let i = 0; i < K; i++) ones += ds[i][1];
    return ones * 2 > K ? 1 : 0;
  };
  const acc = test.filter((r) => predict(r.age, r.pay) === r.c).length / test.length;
  const { X, Y } = scales(V);
  const cells = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const age = 20 + (40 * (i + 0.5)) / G, pay = 3 + (27 * (j + 0.5)) / G;
    if (predict(age, pay)) cells.push(<rect key={`${i}-${j}`} x={X(20 + (40 * i) / G)} y={Y(3 + (27 * (j + 1)) / G)} width={V.w / G + 0.5} height={V.h / G + 0.5} className="ml-r1" />);
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Feature scaling">
          <button type="button" className="seg" aria-pressed={!std} onClick={() => setStd(false)}>Raw units</button>
          <button type="button" className="seg" aria-pressed={std} onClick={() => setStd(true)}>Standardised</button>
        </div>
      </div>
      <div style={{ maxWidth: 380, margin: "12px auto 0" }}>
        <Chart v={V} label={`Regions of 7-nearest neighbours using ${std ? "standardised" : "raw"} features`} xticks={[20, 30, 40, 50, 60]} yticks={[5, 10, 20, 30]} xlabel="age in years" ylabel="pay, lakh rupees">
          {cells}
          {train.map((r, i) => <circle key={i} cx={X(r.age)} cy={Y(r.pay)} r={4} className={r.c ? "ml-c1" : "ml-c0"} />)}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{(acc * 100).toFixed(0)}%</b><span>accuracy on 600 new people</span></div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The label depends on age alone, yet pay is measured in rupees, where a gap of one lakh counts as 100,000 while a gap of ten years counts as 10.{" "}
        {std
          ? "After standardising, both features have mean 0 and standard deviation 1, age gets its fair say, and the boundary stands upright at about 40."
          : "So in raw units distance is almost entirely pay, the neighbours are simply people with similar pay, and the regions are horizontal bands that ignore age."}
      </figcaption>
    </figure>
  );
}
