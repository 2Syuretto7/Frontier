"use client";

import { useState } from "react";

/*
 * Results of real training runs, recorded offline. Synthetic activations in 16 dimensions are sums of 40 known unit feature
 * directions, each active with probability 0.05 and magnitude uniform on [0, 1], so on average two are active. Sparse autoencoders
 * f = ReLU(We (x - bd) + be), x' = Wd f + bd, with unit-norm decoder columns, were trained with Adam (learning rate 0.001, batch 512,
 * 8,000 steps) on squared error plus lambda times the sum of f. "best" lists, for each true feature, the largest absolute cosine with
 * any live decoder column, sorted.
 */
export const SAE: Record<string, { fvu: number; l0: number; dead: number; best: number[] }> = {"20_0.003":{"fvu":0.0042,"l0":18.29,"dead":0,"best":[0.899,0.894,0.884,0.853,0.843,0.831,0.821,0.813,0.776,0.768,0.751,0.727,0.727,0.719,0.716,0.703,0.698,0.694,0.691,0.688,0.687,0.684,0.679,0.677,0.669,0.668,0.636,0.636,0.623,0.617,0.601,0.575,0.574,0.573,0.56,0.522,0.512,0.511,0.478,0.465]},"20_0.03":{"fvu":0.0319,"l0":10.81,"dead":0,"best":[0.915,0.884,0.846,0.843,0.841,0.824,0.781,0.78,0.779,0.776,0.763,0.756,0.754,0.747,0.744,0.741,0.72,0.696,0.695,0.687,0.657,0.655,0.652,0.65,0.644,0.631,0.629,0.617,0.611,0.588,0.586,0.58,0.559,0.548,0.534,0.532,0.51,0.491,0.473,0.462]},"20_0.3":{"fvu":0.2677,"l0":3.08,"dead":0,"best":[0.968,0.963,0.944,0.941,0.928,0.925,0.912,0.905,0.899,0.896,0.891,0.877,0.875,0.874,0.873,0.838,0.81,0.808,0.779,0.776,0.776,0.765,0.757,0.751,0.745,0.739,0.737,0.734,0.732,0.721,0.715,0.701,0.677,0.662,0.659,0.655,0.651,0.622,0.617,0.603]},"40_0.003":{"fvu":0.0004,"l0":17.9,"dead":0,"best":[0.83,0.788,0.783,0.726,0.726,0.68,0.676,0.662,0.66,0.65,0.649,0.644,0.638,0.628,0.627,0.622,0.619,0.612,0.608,0.601,0.598,0.597,0.592,0.589,0.589,0.568,0.567,0.546,0.544,0.538,0.532,0.528,0.528,0.525,0.519,0.518,0.518,0.516,0.486,0.479]},"40_0.03":{"fvu":0.0064,"l0":13.66,"dead":0,"best":[0.93,0.897,0.889,0.881,0.877,0.863,0.857,0.853,0.848,0.836,0.827,0.824,0.782,0.78,0.775,0.759,0.757,0.757,0.756,0.754,0.748,0.74,0.739,0.735,0.725,0.724,0.719,0.718,0.716,0.713,0.692,0.69,0.676,0.659,0.636,0.635,0.603,0.596,0.579,0.527]},"40_0.3":{"fvu":0.171,"l0":2.72,"dead":0,"best":[0.992,0.991,0.99,0.99,0.988,0.987,0.986,0.984,0.983,0.983,0.982,0.982,0.981,0.981,0.98,0.98,0.978,0.978,0.978,0.977,0.977,0.975,0.972,0.97,0.97,0.968,0.968,0.966,0.966,0.957,0.955,0.954,0.95,0.948,0.939,0.92,0.917,0.904,0.858,0.836]},"80_0.003":{"fvu":0.0001,"l0":19.45,"dead":1,"best":[0.869,0.837,0.8,0.796,0.754,0.751,0.747,0.745,0.738,0.722,0.714,0.709,0.707,0.706,0.691,0.668,0.657,0.655,0.648,0.639,0.636,0.635,0.633,0.631,0.626,0.62,0.616,0.61,0.609,0.608,0.604,0.601,0.597,0.588,0.585,0.573,0.545,0.538,0.538,0.49]},"80_0.03":{"fvu":0.0075,"l0":18.15,"dead":1,"best":[0.925,0.884,0.869,0.855,0.85,0.849,0.846,0.844,0.835,0.833,0.833,0.833,0.828,0.827,0.826,0.822,0.814,0.813,0.806,0.801,0.799,0.797,0.795,0.772,0.771,0.771,0.759,0.759,0.755,0.752,0.75,0.75,0.738,0.731,0.718,0.715,0.708,0.706,0.703,0.688]},"80_0.3":{"fvu":0.1635,"l0":4.19,"dead":3,"best":[0.988,0.988,0.985,0.984,0.984,0.984,0.983,0.981,0.981,0.98,0.979,0.979,0.977,0.977,0.976,0.975,0.975,0.974,0.973,0.97,0.969,0.968,0.966,0.966,0.965,0.959,0.952,0.951,0.945,0.94,0.933,0.925,0.925,0.917,0.91,0.91,0.91,0.907,0.906,0.866]}};

const SIZES = [20, 40, 80];
const LAMS = ["0.003", "0.03", "0.3"];

export function SaeSweepViz() {
  const [s, setS] = useState(1);
  const [l, setL] = useState(2);
  const r = SAE[`${SIZES[s]}_${Number(LAMS[l])}`];
  const W = 330, H = 160, X0 = 26, PW = 296, Y0 = 8, PH = 120;
  const bw = PW / r.best.length;
  const py = (v: number) => Y0 + PH - v * PH;
  const found = r.best.filter((v) => v > 0.9).length;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Dictionary size">
          {SIZES.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{v} latents</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Sparsity penalty">
          {LAMS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={l === i} onClick={() => setL(i)}>λ = {v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="For each true feature, its best match among the learned features">
        {[0, 0.5, 0.9, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v === 1 ? "" : v}</text>
          </g>
        ))}
        {r.best.map((v, i) => (
          <rect key={i} x={X0 + i * bw + 0.5} y={py(v)} width={bw - 1} height={v * PH} style={{ fill: v > 0.9 ? "var(--accent)" : "var(--text-muted)" }} />
        ))}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">true features, sorted; bar: best match (cosine)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        variance unexplained {r.fvu.toFixed(3)}; active latents per input {r.l0.toFixed(1)} (true: 2.0); dead {r.dead}; found {found} of 40
      </div>
      <figcaption className="viz-caption">
        Real sparse autoencoders trained on synthetic activations whose true features are known. With a weak sparsity penalty they
        reconstruct almost perfectly but use many latents per input, and their latents are mixtures that match no true feature well.
        With a strong penalty the number of active latents approaches the true two, and, given at least as many latents as true
        features, they recover nearly all of them, at the price of some reconstruction error from shrinking magnitudes.
      </figcaption>
    </figure>
  );
}
