"use client";

import { useMemo, useState } from "react";

/**
 * Counting as pairing. Pair each stone with a sheep; whichever row runs out
 * first is the smaller collection. No numbers needed.
 */
export function PairingViz() {
  const [stones, setStones] = useState(5);
  const [sheep, setSheep] = useState(7);
  const [pairs, setPairs] = useState(0);

  const max = Math.min(stones, sheep);
  const done = pairs === max;
  const W = 640, gap = 52, x0 = 96, rowA = 52, rowB = 156;
  const xs = (n: number) => Array.from({ length: n }, (_, i) => x0 + i * gap);
  const verdict = useMemo(() => {
    if (!done) return "Pair one stone with one sheep at a time.";
    if (stones === sheep) return "Nothing is left over: the two collections are the same size.";
    return stones > sheep
      ? `${stones - sheep} stone${stones - sheep > 1 ? "s" : ""} left over: there are more stones than sheep.`
      : `${sheep - stones} sheep left over: there are more sheep than stones.`;
  }, [done, stones, sheep]);

  const reset = (s: number, h: number) => { setStones(s); setSheep(h); setPairs(0); };

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 200`} role="img" aria-label="Stones paired with sheep">
        <text x={x0 - 24} y={rowA + 5} className="viz-label" textAnchor="end">Stones</text>
        <text x={x0 - 24} y={rowB + 5} className="viz-label" textAnchor="end">Sheep</text>
        {xs(pairs).map((x) => (
          <line key={`l${x}`} x1={x} y1={rowA + 14} x2={x} y2={rowB - 16} className="viz-link" />
        ))}
        {xs(stones).map((x, i) => (
          <circle key={`s${x}`} cx={x} cy={rowA} r={12} className={i < pairs ? "viz-node is-paired" : "viz-node"} />
        ))}
        {xs(sheep).map((x, i) => (
          <rect key={`h${x}`} x={x - 13} y={rowB - 13} width={26} height={26} rx={7}
            className={i < pairs ? "viz-node alt is-paired" : "viz-node alt"} />
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setPairs((p) => Math.min(max, p + 1))} disabled={done}>
          Pair one more
        </button>
        <button type="button" className="btn" onClick={() => reset(3 + Math.floor(Math.random() * 7), 3 + Math.floor(Math.random() * 7))}>
          New flock
        </button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">{verdict}</figcaption>
    </figure>
  );
}
