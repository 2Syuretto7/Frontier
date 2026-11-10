"use client";

import { useState } from "react";

type Move = [number, number];

function solve(n: number, from: number, to: number, via: number, out: Move[]) {
  if (n === 0) return;
  solve(n - 1, from, via, to, out);
  out.push([from, to]);
  solve(n - 1, via, to, from, out);
}

const PEG_X = [130, 310, 490];
const BASE = 260;
const NAMES = ["left", "middle", "right"];

/** The tower puzzle: move n discs, one at a time, never a larger on a smaller. The best solution takes 2ⁿ − 1 moves. */
export function HanoiViz() {
  const [n, setN] = useState(3);
  const [step, setStep] = useState(0);
  const moves: Move[] = [];
  solve(n, 0, 2, 1, moves);
  const pegs: number[][] = [Array.from({ length: n }, (_, i) => n - i), [], []];
  for (let k = 0; k < step; k++) {
    const [f, t] = moves[k];
    pegs[t].push(pegs[f].pop()!);
  }
  const total = moves.length;
  const last = step > 0 ? moves[step - 1] : null;
  const change = (m: number) => { setN(m); setStep(0); };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {[3, 4, 5].map((m) => (
          <button key={m} type="button" className={m === n ? "btn btn-primary" : "btn"} aria-pressed={m === n} onClick={() => change(m)}>{m} discs</button>
        ))}
      </div>
      <svg viewBox="0 0 620 290" role="img" aria-label={`Tower puzzle with ${n} discs, after ${step} of ${total} moves`}>
        <line x1={30} y1={BASE} x2={590} y2={BASE} className="viz-axis" />
        {PEG_X.map((x) => <line key={x} x1={x} y1={BASE} x2={x} y2={BASE - 170} className="viz-axis" />)}
        {pegs.map((peg, p) => peg.map((disc, h) => {
          const w = 30 + disc * 26;
          return <rect key={disc} x={PEG_X[p] - w / 2} y={BASE - (h + 1) * 26} width={w} height={22} rx={5} className="viz-cell is-on" style={last && last[1] === p && h === peg.length - 1 ? { stroke: "var(--danger)", strokeWidth: 2.5 } : undefined} />;
        }))}
        {NAMES.map((s, p) => <text key={s} x={PEG_X[p]} y={BASE + 20} textAnchor="middle" className="viz-label">{s}</text>)}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setStep(0)} disabled={step === 0}>Start again</button>
        <button type="button" className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
        <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={step === total}>Next move</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Move <span className="mono">{step}</span> of <span className="mono">{total} = 2<sup>{n}</sup> − 1</span>.{" "}
        {step === 0
          ? <>To move all {n} discs to the right, first move the top {n - 1} out of the way to the middle, then the largest disc, then the {n - 1} back on top of it.</>
          : step === total
            ? <>Done. The tower of {n} took twice the moves for {n - 1}, plus one.</>
            : <>Moved a disc from the {NAMES[last![0]]} peg to the {NAMES[last![1]]}.{step === 2 ** (n - 1) ? " That was the largest disc, exactly halfway through." : ""}</>}
      </figcaption>
    </figure>
  );
}
