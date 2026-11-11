import { fmt, type Mat } from "./la";

/** A matrix drawn with brackets, with optional highlighted rows, columns or cells. */
export function MatrixView({ M, label, rows = [], cols = [], cells = [], bar }: { M: Mat; label?: string; rows?: number[]; cols?: number[]; cells?: [number, number][]; bar?: number }) {
  return (
    <span className="mat-wrap">
      {label && <span className="mat-label">{label}</span>}
      <table className="mat" aria-label={label ? `matrix ${label}` : "matrix"}>
        <tbody>
          {M.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => {
                const on = rows.includes(i) || cols.includes(j) || cells.some(([a, b]) => a === i && b === j);
                return <td key={j} className={(on ? "is-on" : "") + (bar !== undefined && j === bar ? " mat-bar" : "")}>{fmt(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
}
