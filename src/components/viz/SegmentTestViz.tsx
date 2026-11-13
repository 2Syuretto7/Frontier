"use client";

import { useMemo, useState } from "react";

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

const SHAPES: { key: string; label: string; convex: boolean; inside: (x: number, y: number) => boolean }[] = [
  { key: "l2", label: "disc", convex: true, inside: (x, y) => x * x + y * y <= 1 },
  { key: "l1", label: "ℓ₁ ball", convex: true, inside: (x, y) => Math.abs(x) + Math.abs(y) <= 1 },
  { key: "half", label: "ℓ½ ball", convex: false, inside: (x, y) => Math.sqrt(Math.abs(x)) + Math.sqrt(Math.abs(y)) <= 1 },
  { key: "moon", label: "crescent", convex: false, inside: (x, y) => x * x + y * y <= 1 && (x - 0.55) ** 2 + y * y > 0.64 },
];

/** Draw pairs of points from a set and test the segment between them: a set is convex when no segment ever leaves it. */
export function SegmentTestViz() {
  const [k, setK] = useState(0);
  const [seed, setSeed] = useState(1);
  const sh = SHAPES[k];
  const { cells, pairs, bad } = useMemo(() => {
    const cells: [number, number][] = [];
    for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) {
      const x = -1.1 + (2.2 * (i + 0.5)) / 60, y = -1.1 + (2.2 * (j + 0.5)) / 60;
      if (sh.inside(x, y)) cells.push([x, y]);
    }
    const r = makeRng(seed * 31 + k);
    const pick = () => {
      for (;;) {
        const x = 2.2 * r() - 1.1, y = 2.2 * r() - 1.1;
        if (sh.inside(x, y)) return [x, y];
      }
    };
    const pairs = Array.from({ length: 6 }, () => {
      const a = pick(), b = pick();
      const samples = Array.from({ length: 41 }, (_, t) => {
        const th = t / 40;
        const p = [th * a[0] + (1 - th) * b[0], th * a[1] + (1 - th) * b[1]];
        return { p, ok: sh.inside(p[0], p[1]) };
      });
      return { a, b, samples, ok: samples.every((s) => s.ok) };
    });
    return { cells, pairs, bad: pairs.filter((p) => !p.ok).length };
  }, [k, seed, sh]);
  const W = 240, H = 240;
  const P = (v: number) => 120 + v * 100;
  const Q = (v: number) => 120 - v * 100;
  const cw = (2.2 / 60) * 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SHAPES.map((s, i) => (
          <button key={s.key} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{s.label}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new pairs</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="A set in the plane with segments between sampled points">
        {cells.map(([x, y], i) => (
          <rect key={i} x={P(x) - cw / 2} y={Q(y) - cw / 2} width={cw + 0.3} height={cw + 0.3} fill="var(--accent)" opacity={0.18} />
        ))}
        {pairs.map((pr, i) => (
          <g key={i}>
            <line x1={P(pr.a[0])} y1={Q(pr.a[1])} x2={P(pr.b[0])} y2={Q(pr.b[1])} stroke={pr.ok ? "var(--text-muted)" : "var(--danger)"} strokeWidth={pr.ok ? 1 : 1.8} />
            {pr.samples.filter((s) => !s.ok).map((s, j) => (
              <circle key={j} cx={P(s.p[0])} cy={Q(s.p[1])} r={1.6} fill="var(--danger)" />
            ))}
            <circle cx={P(pr.a[0])} cy={Q(pr.a[1])} r={2.6} fill="var(--text)" />
            <circle cx={P(pr.b[0])} cy={Q(pr.b[1])} r={2.6} fill="var(--text)" />
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {bad} of 6 segments leave the set; the {sh.label} is {sh.convex ? "convex" : "not convex"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Six pairs of points are drawn from the shaded set and joined by segments; red marks show where a segment leaves the
        set. For a convex set no segment ever leaves, whichever points you draw. The ℓ₁ ball, a diamond, is convex because
        |x| + |y| is a norm. The ℓ½ &quot;ball&quot; is not, because √|x| + √|y| breaks the triangle inequality. A random test
        can only find counterexamples; proving convexity needs an argument.
      </figcaption>
    </figure>
  );
}
