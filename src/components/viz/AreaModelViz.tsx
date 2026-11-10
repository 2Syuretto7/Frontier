"use client";

import { useState } from "react";

/**
 * (x + a)(x + b) as the area of a rectangle cut into four pieces: x², ax, bx and ab.
 * Reading the pieces back into a rectangle is factorising.
 */
export function AreaModelViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const X = 150, u = 26; // x drawn as 150 units; 1 drawn as 26
  const x0 = 70, y0 = 20;
  const W = X + a * u, H = X + b * u;

  const step = (v: number, set: (n: number) => void, d: number) => set(Math.max(1, Math.min(6, v + d)));

  return (
    <figure className="viz">
      <svg viewBox={`0 0 620 ${y0 + H + 16}`} role="img" aria-label={`(x + ${a})(x + ${b}) = x² + ${a + b}x + ${a * b}`}>
        <rect x={x0} y={y0} width={X} height={X} className="viz-cell is-on" />
        <text x={x0 + X / 2} y={y0 + X / 2 + 5} textAnchor="middle" className="viz-label is-on">x²</text>
        <rect x={x0 + X} y={y0} width={a * u} height={X} className="viz-region" />
        <text x={x0 + X + (a * u) / 2} y={y0 + X / 2 + 5} textAnchor="middle" className="viz-label is-on">{a}x</text>
        <rect x={x0} y={y0 + X} width={X} height={b * u} className="viz-region" />
        <text x={x0 + X / 2} y={y0 + X + (b * u) / 2 + 5} textAnchor="middle" className="viz-label is-on">{b}x</text>
        {Array.from({ length: a * b }, (_, i) => (
          <rect key={i} x={x0 + X + (i % a) * u} y={y0 + X + Math.floor(i / a) * u} width={u} height={u} className="viz-cell" />
        ))}
        <text x={x0 + X + (a * u) / 2} y={y0 + X + (b * u) / 2 + 5} textAnchor="middle" className="viz-label">{a * b}</text>
        <rect x={x0} y={y0} width={W} height={H} className="viz-frame" />
        <text x={x0 + W / 2} y={y0 - 6} textAnchor="middle" className="viz-label">x + {a}</text>
        <text x={x0 - 10} y={y0 + H / 2} textAnchor="end" className="viz-label">x + {b}</text>
        <text x={x0 + W + 24} y={y0 + H / 2 - 8} className="viz-label is-on" style={{ fontSize: 15 }}>(x + {a})(x + {b})</text>
        <text x={x0 + W + 24} y={y0 + H / 2 + 16} className="viz-label is-on" style={{ fontSize: 15 }}>= x² + {a + b}x + {a * b}</text>
      </svg>
      <div className="viz-controls">
        <span className="viz-stepper"><span className="viz-stepper-label">a</span>
          <button type="button" className="btn" onClick={() => step(a, setA, -1)} disabled={a <= 1} aria-label="Decrease a">−</button>
          <span className="mono viz-stepper-value">{a}</span>
          <button type="button" className="btn" onClick={() => step(a, setA, 1)} disabled={a >= 6} aria-label="Increase a">+</button>
        </span>
        <span className="viz-stepper"><span className="viz-stepper-label">b</span>
          <button type="button" className="btn" onClick={() => step(b, setB, -1)} disabled={b <= 1} aria-label="Decrease b">−</button>
          <span className="mono viz-stepper-value">{b}</span>
          <button type="button" className="btn" onClick={() => step(b, setB, 1)} disabled={b >= 6} aria-label="Increase b">+</button>
        </span>
      </div>
      <figcaption className="viz-caption">
        The middle coefficient is the sum <span className="mono">{a} + {b} = {a + b}</span> and the constant is the product{" "}
        <span className="mono">{a} × {b} = {a * b}</span>. To factorise <span className="mono">x² + {a + b}x + {a * b}</span>, look for two numbers
        with that sum and that product.
      </figcaption>
    </figure>
  );
}
