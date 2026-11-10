"use client";

import { useState } from "react";

const P = [0.35, 0.5, 0.65]; // hidden chances of a coin from machines A, B, C
const NAMES = ["A", "B", "C"];

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Stats = { pulls: number[]; wins: number[] };
const empty = (): Stats => ({ pulls: [0, 0, 0], wins: [0, 0, 0] });

/** Simulate a strategy: with probability eps try a random machine, otherwise the best so far. Average over many runs. */
function simulate(eps: number, plays: number, runs: number) {
  let total = 0;
  const rnd = makeRng(99);
  for (let r = 0; r < runs; r++) {
    const s = empty();
    for (let t = 0; t < plays; t++) {
      let arm: number;
      if (t < 3) arm = t;
      else if (rnd() < eps) arm = Math.floor(rnd() * 3);
      else arm = [0, 1, 2].reduce((b, j) => (s.wins[j] / s.pulls[j] > s.wins[b] / s.pulls[b] ? j : b), 0);
      const win = rnd() < P[arm] ? 1 : 0;
      s.pulls[arm]++; s.wins[arm] += win; total += win;
    }
  }
  return total / runs;
}

/** Three machines, each paying a coin with an unknown chance. Every play is a choice between using what you know and finding out more. */
export function BanditViz() {
  const [s, setS] = useState<Stats>(empty);
  const [seed, setSeed] = useState(5);
  const [eps, setEps] = useState(0.1);
  const [sim, setSim] = useState<number | null>(null);
  const plays = s.pulls.reduce((a, b) => a + b, 0);
  const coins = s.wins.reduce((a, b) => a + b, 0);

  const pull = (j: number) => {
    const rnd = makeRng(seed);
    const win = rnd() < P[j] ? 1 : 0;
    setSeed(seed + 1);
    setS({ pulls: s.pulls.map((v, i) => (i === j ? v + 1 : v)), wins: s.wins.map((v, i) => (i === j ? v + win : v)) });
  };

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        {NAMES.map((n, j) => (
          <button key={n} type="button" className="btn" onClick={() => pull(j)}>
            Play {n} · {s.pulls[j] ? `${s.wins[j]}/${s.pulls[j]} paid` : "untried"}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => setS(empty())}>Start again</button>
      </div>
      <p className="viz-caption">
        {plays === 0 ? "Each machine pays a coin with its own hidden chance. Play twenty times and try to collect as many coins as you can." : <>You have played {plays} times and won <span className="mono">{coins}</span> coins.{plays >= 20 ? <> The hidden chances were A {P[0]}, B {P[1]}, C {P[2]}. Always playing C would expect about <span className="mono">{(P[2] * plays).toFixed(1)}</span> coins in {plays} plays.</> : ""}</>}
      </p>
      <div className="viz-sliders">
        <label>
          <span>Strategy: explore at random <span className="mono">{Math.round(eps * 100)}%</span> of the time, otherwise play the best so far</span>
          <input type="range" min={0} max={1} step={0.05} value={eps} onChange={(e) => { setEps(Number(e.target.value)); setSim(null); }} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setSim(simulate(eps, 200, 400))}>Simulate 200 plays</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {sim === null
          ? "Then try a strategy. Never exploring can get stuck on a machine that started out lucky; always exploring never uses what it has learnt."
          : <>Averaged over 400 simulated players, exploring {Math.round(eps * 100)}% of the time collects about <span className="mono">{sim.toFixed(1)}</span> coins in 200 plays. A player who knew the
              answer would expect <span className="mono">{(P[2] * 200).toFixed(0)}</span>; one who chose at random, <span className="mono">{(((P[0] + P[1] + P[2]) / 3) * 200).toFixed(0)}</span>. Try 0% and 100%.</>}
      </figcaption>
    </figure>
  );
}
