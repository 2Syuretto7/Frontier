"use client";

import { useState } from "react";
import { MapDiagram } from "./MapDiagram";

const A = [-2, -1, 0, 1, 2], B = [0, 1, 2, 3, 4, 5];
const f = (x: number) => x * x;
const fmt = (xs: number[]) => (xs.length ? `{${xs.map((x) => (x < 0 ? `−${-x}` : String(x))).join(", ")}}` : "∅");

/** Images and preimages under f(x) = x², and why they are not inverse to each other. */
export function PreimageViz() {
  const [mode, setMode] = useState<0 | 1>(0);
  const [S, setS] = useState<number[]>([1]);
  const [T, setT] = useState<number[]>([2, 4]);
  const img = (xs: number[]) => B.filter((y) => xs.some((x) => f(x) === y));
  const pre = (ys: number[]) => A.filter((x) => ys.includes(f(x)));
  const fS = img(S), fT = pre(T);
  const flip = (xs: number[], v: number) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v].sort((a, b) => a - b));

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className={mode === 0 ? "btn btn-primary" : "btn"} aria-pressed={mode === 0} onClick={() => setMode(0)}>Image of a set S</button>
        <button type="button" className={mode === 1 ? "btn btn-primary" : "btn"} aria-pressed={mode === 1} onClick={() => setMode(1)}>Preimage of a set T</button>
      </div>
      <MapDiagram
        label="f(x) = x squared, from A to B"
        columns={[
          { title: "A", items: A.map((x) => (x < 0 ? `−${-x}` : String(x))), on: A.map((x) => (mode === 0 ? S.includes(x) : fT.includes(x))) },
          { title: "B", items: B.map(String), on: B.map((y) => (mode === 0 ? fS.includes(y) : T.includes(y))) },
        ]}
        maps={[A.map((x) => (B.includes(f(x)) ? [B.indexOf(f(x))] : []))]}
        arrowClass={(_, i) => ((mode === 0 ? S.includes(A[i]) : T.includes(f(A[i]))) ? "plot-arrow" : "plot-arrow is-muted")}
        onItem={(col, i) => {
          if (mode === 0 && col === 0) setS(flip(S, A[i]));
          if (mode === 1 && col === 1) setT(flip(T, B[i]));
        }}
      />
      <figcaption className="viz-caption" aria-live="polite">
        {mode === 0
          ? <>Click elements of A to choose S. Here S = <span className="mono">{fmt(S)}</span>, its image is f(S) = <span className="mono">{fmt(fS)}</span>, and going back,
              f⁻¹(f(S)) = <span className="mono">{fmt(pre(fS))}</span>{pre(fS).length > S.length ? <>, which is bigger than S: f is not injective</> : <>, which is S itself</>}.</>
          : <>Click elements of B to choose T. Here T = <span className="mono">{fmt(T)}</span>, its preimage is f⁻¹(T) = <span className="mono">{fmt(fT)}</span>, and going
              forward, f(f⁻¹(T)) = <span className="mono">{fmt(img(fT))}</span>{img(fT).length < T.length ? <>, which is smaller than T: f is not surjective</> : <>, which is T itself</>}.
              The preimage makes sense even though f has no inverse.</>}
      </figcaption>
    </figure>
  );
}
