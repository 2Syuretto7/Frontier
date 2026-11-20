"use client";

import { useState } from "react";

/*
 * Recorded offline: a one-hidden-layer network with 128 quadratic units, f(a, b) = V (e_a + e'_b)², trained by AdamW
 * (learning rate 0.003) with cross-entropy on 40% of the 961 pairs of addition mod 31, for 8000 full-batch steps.
 * Columns: step, train accuracy, test accuracy, train loss, test loss, parameter norm.
 */
const RUN_WD = [[0, 0.0208, 0.0277, 3.4779, 3.4798, 89.49], [1, 0.026, 0.0277, 3.452, 3.4839, 89.34], [2, 0.0365, 0.0277, 3.4274, 3.489, 89.19], [3, 0.0521, 0.026, 3.404, 3.495, 89.05], [4, 0.0599, 0.0243, 3.3815, 3.5015, 88.91], [5, 0.0625, 0.0243, 3.3598, 3.5084, 88.78], [6, 0.0729, 0.0173, 3.3388, 3.5156, 88.66], [7, 0.0833, 0.0156, 3.3184, 3.5229, 88.53], [8, 0.0911, 0.0156, 3.2985, 3.5302, 88.41], [10, 0.1068, 0.0139, 3.2597, 3.5444, 88.19], [11, 0.1198, 0.0139, 3.2406, 3.5511, 88.09], [13, 0.1406, 0.0139, 3.2031, 3.5638, 87.89], [16, 0.1797, 0.0139, 3.1478, 3.581, 87.63], [18, 0.2109, 0.0087, 3.1114, 3.5914, 87.47], [21, 0.2474, 0.0087, 3.0574, 3.6064, 87.27], [25, 0.2995, 0.0087, 2.9863, 3.6264, 87.06], [29, 0.3516, 0.0087, 2.9159, 3.6478, 86.91], [33, 0.4062, 0.0069, 2.8456, 3.6711, 86.81], [39, 0.4922, 0.0069, 2.7394, 3.7094, 86.75], [45, 0.5573, 0.0069, 2.6317, 3.7503, 86.79], [52, 0.6276, 0.0069, 2.5037, 3.8003, 86.94], [61, 0.7188, 0.0069, 2.335, 3.8678, 87.27], [71, 0.7943, 0.0052, 2.1427, 3.9476, 87.76], [83, 0.8698, 0.0035, 1.9081, 4.0497, 88.51], [97, 0.9167, 0.0035, 1.6352, 4.1756, 89.53], [112, 0.9635, 0.0069, 1.3539, 4.3147, 90.72], [131, 0.987, 0.0052, 1.0318, 4.4899, 92.27], [152, 0.9948, 0.0052, 0.7391, 4.6709, 93.89], [178, 0.9974, 0.0052, 0.4791, 4.8614, 95.59], [207, 1.0, 0.0069, 0.3024, 5.0179, 96.99], [241, 1.0, 0.0069, 0.1906, 5.1307, 98.03], [280, 1.0, 0.0069, 0.1235, 5.1981, 98.71], [326, 1.0, 0.0052, 0.0798, 5.2344, 99.24], [380, 1.0, 0.0087, 0.0499, 5.2473, 99.8], [443, 1.0, 0.0104, 0.0297, 5.2354, 100.52], [516, 1.0, 0.0104, 0.0166, 5.1912, 101.47], [600, 1.0, 0.0156, 0.0087, 5.1082, 102.68], [699, 1.0, 0.0208, 0.0041, 4.9767, 104.24], [814, 1.0, 0.0329, 0.0017, 4.7856, 106.14], [948, 1.0, 0.0589, 0.0007, 4.5149, 108.36], [1104, 1.0, 0.0919, 0.0002, 4.1496, 110.86], [1286, 1.0, 0.156, 0.0001, 3.6997, 113.47], [1498, 1.0, 0.2149, 0.0, 3.2115, 115.64], [1744, 1.0, 0.2998, 0.0, 2.7116, 116.26], [2031, 1.0, 0.4021, 0.0, 2.1623, 114.85], [2365, 1.0, 0.5442, 0.0, 1.6173, 112.9], [2754, 1.0, 0.6707, 0.0, 1.1258, 111.24], [3207, 1.0, 0.8111, 0.0, 0.7236, 109.83], [3735, 1.0, 0.9012, 0.0, 0.4327, 108.61], [4350, 1.0, 0.9532, 0.0, 0.2446, 107.53], [5066, 1.0, 0.9809, 0.0, 0.1349, 106.57], [5899, 1.0, 0.9913, 0.0, 0.0756, 105.7], [6870, 1.0, 0.9965, 0.0, 0.0435, 104.93], [8000, 1.0, 0.9983, 0.0, 0.0263, 104.27]];
const RUN_NOWD = [[0, 0.0208, 0.0277, 3.4779, 3.4798, 89.49], [1, 0.026, 0.0277, 3.4523, 3.4843, 89.47], [2, 0.0365, 0.0277, 3.4278, 3.4898, 89.46], [3, 0.0521, 0.026, 3.4042, 3.4962, 89.45], [4, 0.0599, 0.0243, 3.3815, 3.5032, 89.45], [5, 0.0625, 0.026, 3.3594, 3.5107, 89.45], [6, 0.0729, 0.0173, 3.3379, 3.5185, 89.46], [7, 0.0833, 0.0156, 3.3168, 3.5264, 89.47], [8, 0.0911, 0.0156, 3.2961, 3.5344, 89.48], [10, 0.1068, 0.0139, 3.2552, 3.5501, 89.52], [11, 0.1198, 0.0139, 3.235, 3.5577, 89.55], [13, 0.1458, 0.0156, 3.1946, 3.5722, 89.61], [16, 0.1771, 0.0121, 3.1339, 3.5922, 89.74], [18, 0.2083, 0.0087, 3.0933, 3.6046, 89.85], [21, 0.2526, 0.0104, 3.032, 3.6229, 90.03], [25, 0.3047, 0.0087, 2.9494, 3.648, 90.34], [29, 0.3646, 0.0087, 2.8655, 3.6757, 90.7], [33, 0.4297, 0.0087, 2.7798, 3.7069, 91.12], [39, 0.5078, 0.0052, 2.6474, 3.7599, 91.84], [45, 0.5781, 0.0069, 2.5097, 3.819, 92.64], [52, 0.6615, 0.0052, 2.3425, 3.8943, 93.68], [61, 0.7552, 0.0035, 2.1178, 4.002, 95.14], [71, 0.8307, 0.0052, 1.8588, 4.1379, 96.89], [83, 0.9089, 0.0052, 1.5435, 4.3231, 99.1], [97, 0.9505, 0.0069, 1.1875, 4.5656, 101.76], [112, 0.9844, 0.0069, 0.8464, 4.8495, 104.6], [131, 0.9974, 0.0069, 0.5098, 5.226, 108.02], [152, 1.0, 0.0069, 0.2754, 5.6294, 111.38], [178, 1.0, 0.0069, 0.133, 6.0612, 114.79], [207, 1.0, 0.0087, 0.067, 6.4454, 117.69], [241, 1.0, 0.0087, 0.0346, 6.8072, 120.31], [280, 1.0, 0.0087, 0.0181, 7.1562, 122.72], [326, 1.0, 0.0104, 0.0092, 7.5194, 125.13], [380, 1.0, 0.0104, 0.0044, 7.9092, 127.61], [443, 1.0, 0.0104, 0.002, 8.3359, 130.2], [516, 1.0, 0.0104, 0.0008, 8.8086, 132.95], [600, 1.0, 0.0104, 0.0003, 9.3349, 135.88], [699, 1.0, 0.0104, 0.0001, 9.939, 139.07], [814, 1.0, 0.0104, 0.0, 10.6241, 142.5], [948, 1.0, 0.0104, 0.0, 11.4012, 146.13], [1104, 1.0, 0.0121, 0.0, 12.2611, 149.75], [1286, 1.0, 0.0121, 0.0, 13.127, 152.84], [1498, 1.0, 0.0104, 0.0, 13.8164, 154.85], [1744, 1.0, 0.0104, 0.0, 14.2552, 156.0], [2031, 1.0, 0.0104, 0.0, 14.5462, 156.74], [2365, 1.0, 0.0104, 0.0, 14.7669, 157.3], [2754, 1.0, 0.0087, 0.0, 14.9498, 157.75], [3207, 1.0, 0.0087, 0.0, 15.1093, 158.15], [3735, 1.0, 0.0087, 0.0, 15.2532, 158.51], [4350, 1.0, 0.0087, 0.0, 15.3858, 158.84], [5066, 1.0, 0.0087, 0.0, 15.51, 159.15], [5899, 1.0, 0.0087, 0.0, 15.6278, 159.44], [6870, 1.0, 0.0087, 0.0, 15.7407, 159.72], [8000, 1.0, 0.0087, 0.0, 15.8497, 159.99]];
const CONC = { wd: 0.7705, nowd: 0.2761 };
const P = 31;

export function circuitLogits(a: number, b: number, ks: number[]) {
  return Array.from({ length: P }, (_, c) => ks.reduce((s, k) => s + Math.cos((2 * Math.PI * k * (a + b - c)) / P), 0));
}

export function GrokkingViz() {
  const [tab, setTab] = useState<"run" | "circuit">("run");
  const [wd, setWd] = useState(true);
  const [a, setA] = useState(17);
  const [b, setB] = useState(20);
  const [K, setK] = useState(3);
  const run = wd ? RUN_WD : RUN_NOWD;
  const W = 330, H = 178, X0 = 40, PW = 280, Y0 = 146, PH = 118;
  const lmax = Math.log10(8000);
  const px = (s: number) => X0 + (Math.log10(Math.max(1, s)) / lmax) * PW;
  const py = (v: number) => Y0 - v * PH;
  const normMax = 170;
  const ks = [1, 4, 9, 13, 6].slice(0, K);
  const logits = circuitLogits(a, b, ks);
  const best = logits.indexOf(Math.max(...logits));
  const runner = Math.max(...logits.filter((_, c) => c !== best));
  const bx = (c: number) => X0 + (c / P) * PW, bw = PW / P;
  const ly = (v: number) => 74 - (v / Math.max(1, K)) * 60;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="View">
          <button className="seg" aria-pressed={tab === "run"} onClick={() => setTab("run")}>training run</button>
          <button className="seg" aria-pressed={tab === "circuit"} onClick={() => setTab("circuit")}>Fourier circuit</button>
        </div>
        {tab === "run" ? (
          <div className="segmented" role="group" aria-label="Weight decay">
            <button className="seg" aria-pressed={wd} onClick={() => setWd(true)}>weight decay 0.5</button>
            <button className="seg" aria-pressed={!wd} onClick={() => setWd(false)}>no weight decay</button>
          </div>
        ) : (
          <>
            <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              a = {a}
              <input type="range" min={0} max={P - 1} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="First summand" />
            </label>
            <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              b = {b}
              <input type="range" min={0} max={P - 1} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="Second summand" />
            </label>
            <div className="segmented" role="group" aria-label="Number of frequencies">
              {[1, 2, 3, 5].map((k) => (
                <button key={k} className="seg" aria-pressed={K === k} onClick={() => setK(k)}>{k} freq.</button>
              ))}
            </div>
          </>
        )}
      </div>
      {tab === "run" ? (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Train and test accuracy and parameter norm against training step on a log scale">
          <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
          <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
          {[0, 0.5, 1].map((v) => <text key={v} x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v * 100}%</text>)}
          {[1, 10, 100, 1000].map((s, i) => <text key={s} x={px(s)} y={Y0 + 13} textAnchor="middle" className="viz-label">10{"⁰¹²³"[i]}</text>)}
          <path d={run.map((r, i) => `${i ? "L" : "M"}${px(r[0]).toFixed(1)},${py(r[5] / normMax).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 3" />
          <path d={run.map((r, i) => `${i ? "L" : "M"}${px(r[0]).toFixed(1)},${py(r[1]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--code-function)" strokeWidth={2} />
          <path d={run.map((r, i) => `${i ? "L" : "M"}${px(r[0]).toFixed(1)},${py(r[2]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <text x={X0 + 4} y={14} className="viz-label" style={{ fill: "var(--code-function)" }}>train</text>
          <text x={X0 + 44} y={14} className="viz-label" style={{ fill: "var(--accent)" }}>test</text>
          <text x={X0 + 78} y={14} className="viz-label">dashed: parameter norm</text>
          <text x={X0 + PW} y={H - 2} textAnchor="end" className="viz-label">training step (log scale)</text>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} 110`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Logits over all answers c from the Fourier circuit">
          <line x1={X0} x2={X0 + PW} y1={ly(0)} y2={ly(0)} stroke="var(--border)" />
          {logits.map((v, c) => (
            <rect key={c} x={bx(c)} y={Math.min(ly(v), ly(0))} width={bw - 1} height={Math.abs(ly(v) - ly(0))} fill={c === best ? "var(--accent)" : "var(--code-function)"} opacity={c === best ? 1 : 0.6} />
          ))}
          {[0, 10, 20, 30].map((c) => <text key={c} x={bx(c) + bw / 2} y={104} textAnchor="middle" className="viz-label">{c}</text>)}
        </svg>
      )}
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {tab === "run"
          ? `after 8000 steps: test accuracy ${(100 * run[run.length - 1][2]).toFixed(1)}%, parameter norm ${run[run.length - 1][5]}; mean share of each unit's input power in its top frequency ${(wd ? CONC.wd : CONC.nowd).toFixed(2)}`
          : `logits peak at c = ${best}; (a + b) mod ${P} = ${(a + b) % P}; margin over the runner-up ${(logits[best] - runner).toFixed(3)}`}
      </div>
      <figcaption className="viz-caption">
        Training run: a small network learning a + b mod 31 from 40% of the table, recorded offline. Train accuracy hits
        100% within a few hundred steps, by memorising; test accuracy stays near chance and then, with weight decay, climbs
        to almost 100% thousands of steps later, as the parameter norm turns down. Without weight decay it never generalises.
        Fourier circuit: the algorithm the generalising network implements, scoring each answer c by Σ cos(2πk(a + b − c)/31)
        over a few frequencies k; every term peaks at c = a + b mod 31.
      </figcaption>
    </figure>
  );
}
