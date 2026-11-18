"use client";

import { useState } from "react";

const MEANS: [number, number][] = [[-1.6, -0.9], [1.6, -0.9], [0, 1.5]];
const S = 0.35, SIGMAS = [0.25, 0.6, 1.2], R = 3, G = 13;

/** Posterior mean E[x | y] when x is drawn from an equal mixture of N(mu_j, S^2 I) and y = x + N(0, sigma^2 I). */
export function denoise(y: [number, number], sigma: number): [number, number] {
  const v = S * S + sigma * sigma, g = (S * S) / v;
  const logw = MEANS.map(([a, b]) => -((y[0] - a) ** 2 + (y[1] - b) ** 2) / (2 * v));
  const m = Math.max(...logw), w = logw.map((l) => Math.exp(l - m)), z = w.reduce((s, x) => s + x, 0);
  return MEANS.reduce<[number, number]>((acc, [a, b], j) => [acc[0] + (w[j] / z) * (a + g * (y[0] - a)), acc[1] + (w[j] / z) * (b + g * (y[1] - b))], [0, 0]);
}

export function DenoiseFieldViz() {
  const [sigma, setSigma] = useState(0.6);
  const W = 260, c = W / 2, sc = (W / 2 - 8) / R;
  const px = (x: number) => c + x * sc, py = (y: number) => c - y * sc;
  const grid = Array.from({ length: G }, (_, i) => -R + (2 * R * (i + 0.5)) / G);
  const pts = grid.flatMap((x) => grid.map((y) => [x, y] as [number, number]));
  const mid: [number, number] = [0, -0.9];
  const dm = denoise(mid, sigma);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIGMAS.map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={s === sigma} onClick={() => setSigma(s)}>noise σ = {s}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }} role="img" aria-label="Optimal denoiser as arrows from noisy points to their cleaned estimates">
        <defs>
          <marker id="dfv-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="var(--accent)" />
          </marker>
        </defs>
        {MEANS.map(([a, b], j) => (
          <circle key={j} cx={px(a)} cy={py(b)} r={S * sc * 2} fill="var(--text-muted)" opacity={0.25} />
        ))}
        {pts.map(([x, y], i) => {
          const [u, v] = denoise([x, y], sigma);
          const len = Math.hypot(u - x, v - y);
          return len * sc < 2 ? (
            <circle key={i} cx={px(x)} cy={py(y)} r={1.2} fill="var(--accent)" />
          ) : (
            <line key={i} x1={px(x)} y1={py(y)} x2={px(u)} y2={py(v)} stroke="var(--accent)" strokeWidth={1} markerEnd="url(#dfv-arrow)" />
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        point (0, −0.9), between two clusters, is mapped to ({dm[0].toFixed(2)}, {dm[1].toFixed(2)})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Clean data come from three tight clusters (grey discs). Each arrow runs from a noisy observation to the best
        least-squares guess of the clean point, which is what a denoising autoencoder learns. The arrows point up the gradient
        of the log density of the noisy data, scaled by σ², so the denoiser has learned the shape of the distribution. A point midway between two clusters is sent to their
        average, which is not a likely clean point at all: the reason squared-error denoisers blur. With heavy noise every
        guess retreats towards the overall mean.
      </figcaption>
    </figure>
  );
}
