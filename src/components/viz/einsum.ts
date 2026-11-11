/** A small, general einsum for teaching: operands are nested arrays of numbers. */
export type Nd = number | Nd[];

export function shapeOf(x: Nd): number[] {
  return Array.isArray(x) ? [x.length, ...shapeOf(x[0])] : [];
}

function get(x: Nd, idx: number[]): number {
  let v: Nd = x;
  for (const i of idx) v = (v as Nd[])[i];
  return v as number;
}

export function einsum(spec: string, ...ops: Nd[]): { out: Nd; outShape: number[]; sizes: Record<string, number>; summed: string[] } {
  const [lhs, rhs] = spec.split("->");
  const ins = lhs.split(",");
  const sizes: Record<string, number> = {};
  ins.forEach((s, k) => {
    const sh = shapeOf(ops[k]);
    if (sh.length !== s.length) throw new Error(`operand ${k} has ${sh.length} axes but '${s}' names ${s.length}`);
    [...s].forEach((c, d) => {
      if (sizes[c] !== undefined && sizes[c] !== sh[d]) throw new Error(`index ${c} has sizes ${sizes[c]} and ${sh[d]}`);
      sizes[c] = sh[d];
    });
  });
  const all = Object.keys(sizes);
  const summed = all.filter((c) => !rhs.includes(c));
  const outShape = [...rhs].map((c) => sizes[c]);
  const build = (d: number, fixed: Record<string, number>): Nd => {
    if (d < rhs.length) return Array.from({ length: sizes[rhs[d]] }, (_, i) => build(d + 1, { ...fixed, [rhs[d]]: i }));
    let total = 0;
    const loop = (k: number, env: Record<string, number>) => {
      if (k === summed.length) {
        total += ins.reduce((p, s, o) => p * get(ops[o], [...s].map((c) => env[c])), 1);
        return;
      }
      for (let i = 0; i < sizes[summed[k]]; i++) loop(k + 1, { ...env, [summed[k]]: i });
    };
    loop(0, fixed);
    return total;
  };
  return { out: build(0, {}), outShape, sizes, summed };
}
