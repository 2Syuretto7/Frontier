"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { clusters, type P2 } from "./ml";

type Link = "single" | "complete";
type Node = { id: number; left?: Node; right?: Node; h: number; members: number[] };
const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 260 };
const CLR = ["var(--accent)", "var(--danger)", "var(--success)", "var(--text-muted)"];
const CENTRES = [{ x: 0.2, y: 0.7 }, { x: 0.55, y: 0.72 }, { x: 0.78, y: 0.28 }];
const dist = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.y - b.y);

/** Agglomerative clustering: repeatedly merge the two closest clusters. */
function agglomerate(pts: P2[], link: Link): Node {
  let nodes: Node[] = pts.map((_, i) => ({ id: i, h: 0, members: [i] }));
  let next = pts.length;
  const gap = (a: Node, b: Node) => {
    let v = link === "single" ? Infinity : 0;
    for (const i of a.members) for (const j of b.members) {
      const d = dist(pts[i], pts[j]);
      v = link === "single" ? Math.min(v, d) : Math.max(v, d);
    }
    return v;
  };
  while (nodes.length > 1) {
    let bi = 0, bj = 1, bd = Infinity;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const d = gap(nodes[i], nodes[j]);
      if (d < bd) { bd = d; bi = i; bj = j; }
    }
    const m: Node = { id: next++, left: nodes[bi], right: nodes[bj], h: bd, members: [...nodes[bi].members, ...nodes[bj].members] };
    nodes = nodes.filter((_, k) => k !== bi && k !== bj).concat(m);
  }
  return nodes[0];
}

/** Clusters left when the tree is cut at height t. */
function cut(n: Node, t: number): number[][] {
  return n.left && n.right && n.h > t ? [...cut(n.left, t), ...cut(n.right, t)] : [n.members];
}

/** A dendrogram that records every merge, cut at a chosen height to give clusters. */
export function DendroViz() {
  const [link, setLink] = useState<Link>("single");
  const [t, setT] = useState(0.5);
  const pts = useMemo(() => {
    const base = clusters(8, CENTRES, 5, 0.05);
    return [...base, { x: 0.375, y: 0.71 }];
  }, []);
  const root = useMemo(() => agglomerate(pts, link), [pts, link]);
  const order = root.members;
  const xpos = new Map(order.map((m, i) => [m, (i + 0.5) / order.length]));
  const H = root.h * 1.08;
  const D: View = { xmin: 0, xmax: 1, ymin: 0, ymax: H, w: 440, h: 200 };
  const d = scales(D);
  const { X, Y } = scales(V);
  const groups = cut(root, t * H).sort((a, b) => b.length - a.length);
  const colour = new Map<number, number>();
  groups.forEach((g, c) => g.forEach((m) => colour.set(m, c)));
  const segs: React.ReactElement[] = [];
  const place = (n: Node): number => {
    if (!n.left || !n.right) return xpos.get(n.id)!;
    const a = place(n.left), b = place(n.right);
    const ha = n.left.h, hb = n.right.h;
    const cls = n.h > t * H ? "plot-curve-2" : "plot-curve";
    segs.push(<path key={n.id} d={`M${d.X(a)} ${d.Y(ha)}V${d.Y(n.h)}H${d.X(b)}V${d.Y(hb)}`} className={cls} style={{ strokeDasharray: "none", strokeWidth: 1.75 }} />);
    return (a + b) / 2;
  };
  place(root);
  const style = (c: number) => (c < 4 ? { fill: CLR[c], stroke: "var(--surface)", strokeWidth: 1.5 } : { fill: "var(--surface)", stroke: "var(--text-faint)", strokeWidth: 1.75 });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Linkage">
          <button type="button" className="seg" aria-pressed={link === "single"} onClick={() => setLink("single")}>Single linkage</button>
          <button type="button" className="seg" aria-pressed={link === "complete"} onClick={() => setLink("complete")}>Complete linkage</button>
        </div>
      </div>
      <div style={{ maxWidth: 380, margin: "12px auto 0" }}>
        <Chart v={V} label={`${groups.length} clusters from cutting the tree`} xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5} style={style(colour.get(i)!)} />)}
        </Chart>
      </div>
      <Chart v={D} label="Dendrogram: the height of each join is the distance at which the two clusters merged" xticks={[]} yticks={[0, Number((H / 2).toFixed(2)), Number(H.toFixed(2))]} ylabel="merge distance">
        {segs}
        <line x1={0} x2={D.w} y1={d.Y(t * H)} y2={d.Y(t * H)} className="plot-line" />
        {order.map((m) => <circle key={m} cx={d.X(xpos.get(m)!)} cy={D.h} r={4} style={style(colour.get(m)!)} />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          cut height = {(t * H).toFixed(2)}
          <input type="range" min={0.02} max={0.98} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Cutting at the red line leaves {groups.length} cluster{groups.length === 1 ? "" : "s"}{groups.length > 4 ? "; small ones beyond the fourth are drawn hollow" : ""}.{" "}
        {link === "single"
          ? "Single linkage measures the gap between the closest pair of points, so the lone point between the two upper groups acts as a bridge and chains them together early."
          : "Complete linkage measures the gap between the farthest pair of points, so it resists chaining and prefers compact, round clusters."}
      </figcaption>
    </figure>
  );
}
