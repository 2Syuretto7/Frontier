"use client";

import { useState } from "react";

// Winning top-5 error rates in the ImageNet Large Scale Visual Recognition Challenge (classification task).
const YEARS = [
  { year: 2010, err: 28.2, team: "NEC-UIUC", deep: false, note: "Hand-designed image features fed to a linear classifier." },
  { year: 2011, err: 25.8, team: "XRCE", deep: false, note: "Hand-designed features again, refined. A small step." },
  { year: 2012, err: 15.3, team: "SuperVision (AlexNet)", deep: true, note: "An eight-layer neural network trained on two gaming GPUs. The runner-up scored 26.2%." },
  { year: 2013, err: 11.2, team: "Clarifai", deep: true, note: "Almost every serious entry is now a deep network." },
  { year: 2014, err: 6.7, team: "GoogLeNet", deep: true, note: "Twenty-two layers." },
  { year: 2015, err: 3.6, team: "ResNet", deep: true, note: "152 layers, made trainable by skip connections." },
];
const HUMAN = 5.1;

const W = 480, H = 250, L = 36, B = 30, T = 16;

/** The ImageNet results that convinced computer vision to switch to deep learning. */
export function ImageNetViz() {
  const [pick, setPick] = useState(2);
  const bw = (W - L - 10) / YEARS.length;
  const Y = (v: number) => T + (1 - v / 30) * (H - T - B);
  const sel = YEARS[pick];

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Winning top-5 error by year, 2010 to 2015">
        {[0, 10, 20, 30].map((v) => (
          <g key={v}>
            <line x1={L} y1={Y(v)} x2={W - 10} y2={Y(v)} className="plot-grid" />
            <text x={L - 6} y={Y(v) + 4} textAnchor="end" className="plot-tick">{v}%</text>
          </g>
        ))}
        {YEARS.map((y, i) => (
          <g key={y.year} onClick={() => setPick(i)} style={{ cursor: "pointer" }}>
            <rect x={L + i * bw + 8} y={Y(y.err)} width={bw - 16} height={Y(0) - Y(y.err)} className={y.deep ? "viz-cell is-on" : "viz-cell"} style={i === pick ? { strokeWidth: 2.5 } : undefined} />
            <text x={L + i * bw + bw / 2} y={Y(y.err) - 6} textAnchor="middle" className="viz-label">{y.err}</text>
            <text x={L + i * bw + bw / 2} y={H - 10} textAnchor="middle" className="plot-tick">{y.year}</text>
          </g>
        ))}
        <line x1={L} y1={Y(HUMAN)} x2={W - 10} y2={Y(HUMAN)} className="plot-line" strokeDasharray="5 4" />
        <text x={W - 12} y={Y(HUMAN) - 5} textAnchor="end" className="viz-label">one trained human, about {HUMAN}%</text>
      </svg>
      <div className="viz-controls">
        {YEARS.map((y, i) => <button key={y.year} type="button" className={pick === i ? "btn btn-primary" : "btn"} aria-pressed={pick === i} onClick={() => setPick(i)}>{y.year}</button>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Top-5 error: the share of test images whose true label was not among the model&rsquo;s five guesses, out of 1,000 categories.
        Shaded bars are deep neural networks. <strong>{sel.year}, {sel.team}: {sel.err}%.</strong> {sel.note}
      </figcaption>
    </figure>
  );
}
