"use client";

import { useState } from "react";

const N = 14, GAP = 38, X0 = 40, BASE = 150, H = 70, W = 12;

/** Induction as falling dominoes: the first must fall, and each must knock over the next. */
export function DominoViz() {
  const [base, setBase] = useState(true);
  const [broken, setBroken] = useState<number | null>(null); // the gap after domino k is too wide
  const [t, setT] = useState(0);
  // domino i (1-based) falls at time i if base holds and no break before it
  const falls = (i: number) => base && i <= t && (broken === null || i <= broken);
  const lastFallen = Array.from({ length: N }, (_, i) => i + 1).filter(falls).pop() ?? 0;
  const reset = () => setT(0);

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 200" role="img" aria-label={`${lastFallen} of ${N} dominoes have fallen`}>
        <line x1={20} x2={600} y1={BASE} y2={BASE} className="viz-axis" />
        {Array.from({ length: N }, (_, k) => {
          const i = k + 1, x = X0 + k * GAP;
          const down = falls(i);
          return (
            <g key={i}>
              <rect
                x={x}
                y={BASE - H}
                width={W}
                height={H}
                rx={2}
                className={down ? "viz-cell is-on" : "viz-cell"}
                style={{ transformBox: "fill-box", transformOrigin: "100% 100%", transform: down ? "rotate(32deg)" : "none", transition: "transform 250ms ease" }}
              />
              <text x={x + W / 2} y={BASE + 18} textAnchor="middle" className="plot-tick">{i}</text>
              {i < N && (
                <rect
                  x={x + W + 2}
                  y={BASE - H}
                  width={GAP - W - 4}
                  height={H}
                  fill={broken === i ? "color-mix(in srgb, var(--danger) 18%, transparent)" : "transparent"}
                  style={{ cursor: "pointer" }}
                  onClick={() => { setBroken(broken === i ? null : i); reset(); }}
                >
                  <title>{`Click to ${broken === i ? "close" : "widen"} the gap after domino ${i}`}</title>
                </rect>
              )}
            </g>
          );
        })}
        {broken !== null && <text x={X0 + broken * GAP - 2} y={BASE - H - 10} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>gap too wide</text>}
      </svg>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={() => setT(Math.min(N, t + 1))} disabled={t >= N}>Next moment</button>
        <button type="button" className="btn" onClick={() => setT(N)} disabled={t >= N}>Let them all go</button>
        <button type="button" className="btn" onClick={reset} disabled={t === 0}>Stand them up</button>
        <button type="button" className={base ? "btn btn-primary" : "btn"} aria-pressed={base} onClick={() => { setBase(!base); reset(); }}>{base ? "First domino pushed" : "First domino not pushed"}</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {!base
          ? <>Nobody pushes the first domino, so nothing happens, however well the others are spaced. Without the <strong>base case</strong>, induction proves nothing.</>
          : broken !== null && t > broken
            ? <>The gap after domino {broken} is too wide, so domino {broken + 1} never falls. The <strong>inductive step</strong> must work for <em>every</em> k, not just most.</>
            : t >= N
              ? <>All {N} fell. Push the first, and make sure each one knocks over the next, and every domino falls, however long the row. Click between two dominoes to widen a gap.</>
              : <>{lastFallen} of {N} down. Each falling domino knocks over the next one.</>}
      </figcaption>
    </figure>
  );
}
