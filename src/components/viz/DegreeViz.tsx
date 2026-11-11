"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { curvePath, scales, type View } from "./Plot";
import { makeNormal, makeRng, mse, polyFit } from "./ml";

const truth = (x: number) => Math.sin(2 * Math.PI * x);
const MAXD = 12;
const VD: View = { xmin: 0, xmax: 1, ymin: -1.8, ymax: 1.8, w: 440, h: 220 };
const VE: View = { xmin: 0, xmax: MAXD, ymin: 0, ymax: 0.6, w: 440, h: 160 };

/** Fit polynomials of increasing degree to 15 noisy points, and compare training and test error. */
export function DegreeViz() {
  const [d, setD] = useState(3);
  const { xs, ys, tx, ty, fits, errs } = useMemo(() => {
    const r = makeRng(7), g = makeNormal(r);
    const xs = Array.from({ length: 15 }, (_, i) => (i + 0.5) / 15 + (r() - 0.5) * 0.04);
    const ys = xs.map((x) => truth(x) + 0.25 * g());
    const tx = Array.from({ length: 300 }, () => r());
    const ty = tx.map((x) => truth(x) + 0.25 * g());
    const fits = Array.from({ length: MAXD + 1 }, (_, k) => polyFit(xs, ys, k, 0, 1));
    const errs = fits.map((f) => ({ train: mse(f, xs, ys), test: mse(f, tx, ty) }));
    return { xs, ys, tx, ty, fits, errs };
  }, []);
  void tx; void ty;
  const { X, Y } = scales(VD);
  const E = scales(VE);
  const best = errs.reduce((b, e, k) => (e.test < errs[b].test ? k : b), 0);
  const line = (key: "train" | "test") => errs.map((e, k) => `${k ? "L" : "M"}${E.X(k).toFixed(1)} ${E.Y(Math.min(e[key], 0.7)).toFixed(1)}`).join(" ");
  const e = errs[d];
  return (
    <figure className="viz">
      <Chart v={VD} label={`A degree ${d} polynomial fitted to 15 points`} xticks={[0, 0.5, 1]} yticks={[-1, 0, 1]}>
        <path d={curvePath(VD, truth)} className="plot-ghost" />
        <path d={curvePath(VD, fits[d])} className="plot-curve" />
        {xs.map((x, i) => <circle key={i} cx={X(x)} cy={Y(ys[i])} r={4.5} className="ml-train" />)}
      </Chart>
      <Chart v={VE} label="Training and test error against degree" xticks={[0, 2, 4, 6, 8, 10, 12]} yticks={[0, 0.2, 0.4, 0.6]} xlabel="degree" ylabel="error">
        <path d={line("test")} className="ml-curve-test" />
        <path d={line("train")} className="plot-curve" />
        <line x1={E.X(d)} x2={E.X(d)} y1={0} y2={VE.h} className="plot-mirror" />
      </Chart>
      <div className="ml-legend"><span>fitted curve, training error</span><span className="is-test">test error</span><span className="is-muted">true curve (dashed)</span></div>
      <div className="viz-sliders">
        <label>
          degree = {d}
          <input type="range" min={0} max={MAXD} value={d} onChange={(ev) => setD(Number(ev.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Degree {d}: training error {e.train.toFixed(3)}, test error {e.test > 9.99 ? "over 10" : e.test.toFixed(3)}.{" "}
        {e.test <= errs[best].test * 1.15 ? "Near the sweet spot, where test error is lowest." : d < best ? "Too simple: the curve cannot bend enough, and both errors are high." : "Too flexible: the curve chases the noise in the 15 points. Training error keeps falling while test error climbs."}
      </figcaption>
    </figure>
  );
}
