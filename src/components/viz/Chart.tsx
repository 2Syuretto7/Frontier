import { useId, type ReactNode } from "react";
import { scales, type View } from "./Plot";
import { fmtNum } from "./format";

type Props = {
  v: View;
  label: string;
  xticks: number[];
  yticks: number[];
  xfmt?: (x: number) => string;
  yfmt?: (y: number) => string;
  xlabel?: string;
  ylabel?: string;
  children?: ReactNode;
};

/** A chart frame with chosen ticks and optional axis titles. Children are clipped to the plotting area. */
export function Chart({ v, label, xticks, yticks, xfmt = fmtNum, yfmt = fmtNum, xlabel, ylabel, children }: Props) {
  const { X, Y } = scales(v);
  const clip = `chart-clip-${useId().replace(/:/g, "")}`;
  const left = ylabel ? 50 : 38;
  const bottom = xlabel ? 38 : 24;
  return (
    <svg viewBox={`${-left} -10 ${v.w + left + 12} ${v.h + bottom + 10}`} role="img" aria-label={label} className="plot">
      <defs>
        <clipPath id={clip}><rect x={-4} y={-4} width={v.w + 8} height={v.h + 8} /></clipPath>
      </defs>
      {xticks.map((x) => <line key={`gx${x}`} x1={X(x)} y1={0} x2={X(x)} y2={v.h} className="plot-grid" />)}
      {yticks.map((y) => <line key={`gy${y}`} x1={0} y1={Y(y)} x2={v.w} y2={Y(y)} className="plot-grid" />)}
      <line x1={0} y1={v.h} x2={v.w} y2={v.h} className="viz-axis" />
      <line x1={0} y1={0} x2={0} y2={v.h} className="viz-axis" />
      {xticks.map((x) => <text key={`tx${x}`} x={X(x)} y={v.h + 14} textAnchor="middle" className="plot-tick">{xfmt(x)}</text>)}
      {yticks.map((y) => <text key={`ty${y}`} x={-6} y={Y(y) + 4} textAnchor="end" className="plot-tick">{yfmt(y)}</text>)}
      {xlabel && <text x={v.w / 2} y={v.h + 32} textAnchor="middle" className="plot-tick">{xlabel}</text>}
      {ylabel && <text x={-v.h / 2} y={-38} transform="rotate(-90)" textAnchor="middle" className="plot-tick">{ylabel}</text>}
      <g clipPath={`url(#${clip})`}>{children}</g>
    </svg>
  );
}
