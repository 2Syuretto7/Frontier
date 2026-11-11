"use client";

import { useState } from "react";
import { type Mat } from "./la";
import { MatrixView } from "./MatrixView";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -3, xmax: 3, ymin: -3, ymax: 3, w: 360, h: 360 };
const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
const MAPS: { name: string; M: Mat; note: string }[] = [
  { name: "Rotate 30°", M: [[c, -s], [s, c]], note: "A rotation keeps lengths and angles. e₁ goes to (cos 30°, sin 30°), and that is the first column." },
  { name: "Shear", M: [[1, 1], [0, 1]], note: "A shear keeps e₁ fixed and slides e₂ to (1, 1). Squares become parallelograms of the same area." },
  { name: "Stretch", M: [[2, 0], [0, 0.5]], note: "A diagonal matrix stretches the x-direction by 2 and squashes the y-direction by half." },
  { name: "Reflect", M: [[0, 1], [1, 0]], note: "Reflection in the line y = x swaps e₁ and e₂, so it swaps the columns of the identity." },
  { name: "Project", M: [[1, 0], [0, 0]], note: "Projection onto the x-axis sends e₂ to 0. The whole grid falls flat onto a line: the map loses information." },
];
const SHAPE = [[0, 0], [1, 0], [1, 0.4], [0.4, 0.4], [0.4, 1], [1, 1], [1, 1.4], [0, 1.4]];

/** A linear map is fixed by where it sends e₁ and e₂; those images are the columns of its matrix. */
export function LinearMapViz() {
  const [k, setK] = useState(0);
  const { M, note } = MAPS[k];
  const { X, Y } = scales(V);
  const ap = (x: number, y: number) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
  const grid = [];
  for (let i = -3; i <= 3; i++) {
    const [a1, b1] = ap(i, -3), [a2, b2] = ap(i, 3), [a3, b3] = ap(-3, i), [a4, b4] = ap(3, i);
    grid.push(<line key={"v" + i} x1={X(a1)} y1={Y(b1)} x2={X(a2)} y2={Y(b2)} className="plot-ghost" />);
    grid.push(<line key={"h" + i} x1={X(a3)} y1={Y(b3)} x2={X(a4)} y2={Y(b4)} className="plot-ghost" />);
  }
  const poly = SHAPE.map(([x, y]) => { const [u, v] = ap(x, y); return `${X(u).toFixed(1)},${Y(v).toFixed(1)}`; }).join(" ");
  return (
    <figure className="viz">
      <Axes v={V} label="The grid, a shape and the basis vectors after a linear map">
        {grid}
        <polygon points={poly} style={{ fill: "var(--accent-soft)", stroke: "var(--accent)", strokeWidth: 1.5 }} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(M[0][0])} y2={Y(M[1][0])} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(M[0][1])} y2={Y(M[1][1])} className="plot-arrow is-hot" />
      </Axes>
      <div className="viz-controls" style={{ justifyContent: "center", flexWrap: "wrap" }}>
        {MAPS.map((m, i) => <button key={m.name} type="button" className={"btn" + (i === k ? " btn-primary" : "")} onClick={() => setK(i)}>{m.name}</button>)}
      </div>
      <div className="mat-row"><MatrixView M={M} label="A" cols={[0]} /></div>
      <figcaption className="viz-caption" aria-live="polite">
        Blue arrow: where e₁ lands (column 1, highlighted). Red arrow: where e₂ lands (column 2). {note} Grid lines stay straight, parallel and evenly spaced, which is what makes a map linear.
      </figcaption>
    </figure>
  );
}
