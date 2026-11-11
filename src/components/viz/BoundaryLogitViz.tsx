"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { blobs, makeNormal, makeRng, sigmoid, type Pt } from "./ml";

type Data = "blobs" | "ring";
type Feats = "linear" | "squares";
const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };
const G = 32;

function ring(seed: number, n: number): Pt[] {
  const r = makeRng(seed), g = makeNormal(r);
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1;
    const a = 2 * Math.PI * r();
    const rad = c ? 0.13 + 0.05 * Math.abs(g()) : 0.33 + 0.06 * g();
    return { x: 0.5 + rad * Math.cos(a), y: 0.5 + rad * Math.sin(a), c };
  });
}

const phi = (f: Feats, x: number, y: number) => {
  const u = x - 0.5, v = y - 0.5;
  return f === "linear" ? [1, u, v] : [1, u, v, u * u * 4, v * v * 4];
};

function fit(pts: Pt[], f: Feats) {
  const P = phi(f, 0, 0).length;
  const w = new Array(P).fill(0);
  for (let t = 0; t < 4000; t++) {
    const gr = new Array(P).fill(0);
    for (const p of pts) {
      const z = phi(f, p.x, p.y);
      const e = sigmoid(z.reduce((s, v, j) => s + v * w[j], 0)) - p.c;
      for (let j = 0; j < P; j++) gr[j] += e * z[j];
    }
    for (let j = 0; j < P; j++) w[j] -= (2 * gr[j]) / pts.length;
  }
  return (x: number, y: number) => sigmoid(phi(f, x, y).reduce((s, v, j) => s + v * w[j], 0));
}

/** A logistic model's decision region, its threshold, and what extra features do to its shape. */
export function BoundaryLogitViz() {
  const [data, setData] = useState<Data>("blobs");
  const [feats, setFeats] = useState<Feats>("linear");
  const [t, setT] = useState(0.5);
  const pts = useMemo(() => (data === "blobs" ? blobs(5, 80, 0.13, 0.3) : ring(9, 120)), [data]);
  const model = useMemo(() => fit(pts, feats), [pts, feats]);
  const { X, Y } = scales(V);
  const acc = pts.filter((p) => (model(p.x, p.y) >= t ? 1 : 0) === p.c).length / pts.length;
  const cells = [];
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = (i + 0.5) / G, y = (j + 0.5) / G;
    if (model(x, y) >= t) cells.push(<rect key={`${i}-${j}`} x={X(i / G)} y={Y((j + 1) / G)} width={V.w / G + 0.5} height={V.h / G + 0.5} className="ml-r1" />);
  }
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Data">
          <button type="button" className="seg" aria-pressed={data === "blobs"} onClick={() => setData("blobs")}>Two clusters</button>
          <button type="button" className="seg" aria-pressed={data === "ring"} onClick={() => setData("ring")}>Ring</button>
        </div>
        <div className="segmented" role="group" aria-label="Features">
          <button type="button" className="seg" aria-pressed={feats === "linear"} onClick={() => setFeats("linear")}>x₁, x₂</button>
          <button type="button" className="seg" aria-pressed={feats === "squares"} onClick={() => setFeats("squares")}>Add x₁², x₂²</button>
        </div>
      </div>
      <div style={{ maxWidth: 380, margin: "12px auto 0" }}>
        <Chart v={V} label="Decision region of a logistic model" xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {cells}
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} className={p.c ? "ml-c1" : "ml-c0"} />)}
        </Chart>
      </div>
      <div className="viz-sliders">
        <label>
          threshold = {t.toFixed(2)}
          <input type="range" min={0.05} max={0.95} step={0.05} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded region is where the model predicts the filled class, because its probability is at least {t.toFixed(2)}. Training accuracy: {(acc * 100).toFixed(0)}%.{" "}
        {data === "ring" && feats === "linear" ? "With only x₁ and x₂, the boundary must be a straight line, and no line separates a ring from its centre." : data === "ring" ? "With squared features, the boundary w·φ(x) = 0 becomes an ellipse, and the ring is separated." : "Moving the threshold slides the straight boundary without turning it."}
      </figcaption>
    </figure>
  );
}
