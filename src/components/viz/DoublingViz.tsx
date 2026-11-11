"use client";

import { useState } from "react";

type Snippet = { name: string; code: string; ops: (n: number) => number; verdict: string };

const SNIPPETS: Snippet[] = [
  {
    name: "Single loop",
    code: "for i in range(n):\n    work()",
    ops: (n) => n,
    verdict: "The ratio settles at 2: doubling n doubles the work, so the cost is Θ(n).",
  },
  {
    name: "Triangle",
    code: "for i in range(n):\n    for j in range(i):\n        work()",
    ops: (n) => (n * (n - 1)) / 2,
    verdict: "The ratio settles at 4 = 2²: the inner loop runs 0 + 1 + … + (n − 1) = n(n − 1)/2 times, Θ(n²).",
  },
  {
    name: "Halving",
    code: "while n > 1:\n    n //= 2\n    work()",
    ops: (n) => { let c = 0; while (n > 1) { n = Math.floor(n / 2); c++; } return c; },
    verdict: "Doubling n adds one step rather than multiplying: the cost is Θ(log n).",
  },
  {
    name: "Harmonic",
    code: "for i in range(1, n + 1):\n    for j in range(0, n, i):\n        work()",
    ops: (n) => { let c = 0; for (let i = 1; i <= n; i++) c += Math.ceil(n / i); return c; },
    verdict: "The ratio is a little above 2 and drifts down towards it: n/1 + n/2 + … + n/n = n·Hₙ ≈ n ln n, Θ(n log n).",
  },
  {
    name: "Doubling inner",
    code: "i = 1\nwhile i < n:\n    for j in range(i):\n        work()\n    i *= 2",
    ops: (n) => { let c = 0; for (let i = 1; i < n; i *= 2) c += i; return c; },
    verdict: "Nested loops, yet linear: the inner counts 1 + 2 + 4 + … are a geometric series below 2n, so Θ(n).",
  },
];

const NS = [16, 32, 64, 128, 256, 512, 1024, 2048];

/** The doubling experiment: count the operations a loop performs as n doubles, and read the growth rate from the ratio. */
export function DoublingViz() {
  const [k, setK] = useState(0);
  const s = SNIPPETS[k];
  const counts = NS.map(s.ops);
  const top = Math.log2(Math.max(...counts, 2));
  const W = 560, H = 170, bw = W / NS.length;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Loop">
        {SNIPPETS.map((x, i) => (
          <button key={x.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{x.name}</button>
        ))}
      </div>
      <pre className="code-block"><code>{s.code}</code></pre>
      <svg viewBox={`0 0 ${W} ${H + 36}`} role="img" aria-label={`Operation counts for ${s.name} as n doubles from 16 to 2048`}>
        {counts.map((c, i) => {
          const h = (Math.log2(Math.max(c, 1)) / top) * H;
          return (
            <g key={i}>
              <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 1)} className="viz-cell is-on" />
              <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" className="plot-tick">{NS[i]}</text>
              <text x={i * bw + bw / 2} y={H + 32} textAnchor="middle" className="plot-tick">{i ? `×${(c / counts[i - 1]).toFixed(2)}` : ""}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Bar heights are on a logarithmic scale; under each n is the ratio of its count to the previous one. At n = 2048 the loop calls{" "}
        <span className="mono">work()</span> <span className="mono">{counts[counts.length - 1].toLocaleString("en-IN")}</span> times. {s.verdict}
      </figcaption>
    </figure>
  );
}
