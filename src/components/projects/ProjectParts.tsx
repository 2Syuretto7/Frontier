import { STAGES, STAGE_INFO, stageDurations, stageIndex, type Project } from "@/lib/pipeline";
import { Pill } from "@/components/ui/Pill";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function StatusPill({ project }: { project: Project }) {
  if (project.status === "published") return <Pill tone="success" icon="check">Published</Pill>;
  if (project.status === "killed") return <Pill tone="muted">Killed</Pill>;
  return <Pill tone="accent" icon="dot">{STAGE_INFO[project.stage].title}</Pill>;
}

/** The six fixed stages, with how far the project got and how long each stage took. */
export function Stepper({ project, now }: { project: Project; now: string }) {
  const reached = stageIndex(project.stage);
  const days = stageDurations(project, now);
  return (
    <ol className="pp-steps" aria-label="Stages">
      {STAGES.map((stage, i) => {
        const done = i < reached || project.status === "published";
        const current = i === reached && project.status === "active";
        const stopped = i === reached && project.status === "killed";
        const state = done ? "done" : current ? "current" : stopped ? "stopped" : "todo";
        return (
          <li key={stage} className={`pp-step pp-step-${state}`} aria-current={current ? "step" : undefined}>
            <span className="pp-step-n mono-meta">{String(i + 1).padStart(2, "0")}</span>
            <span className="pp-step-name">{STAGE_INFO[stage].short}</span>
            <span className="pp-step-meta mono-meta">
              {done || current || stopped ? (days[stage] !== undefined ? plural(days[stage]!, "day") : "") : ""}
              {stopped ? " · killed here" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Para({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export function Field({ label, text, empty = "Not written." }: { label: string; text: string; empty?: string }) {
  return (
    <div className="pp-field">
      <p className="eyebrow">{label}</p>
      <div className="pp-text">{text.trim() ? <Para text={text} /> : <p className="muted">{empty}</p>}</div>
    </div>
  );
}

export function ExperimentList({ project, children }: { project: Project; children?: (id: number) => React.ReactNode }) {
  if (project.experiments.length === 0) return <p className="muted pp-none">No experiments logged yet.</p>;
  return (
    <ol className="pp-log">
      {project.experiments.map((e, i) => (
        <li key={e.id} className="pp-entry">
          <div className="pp-entry-head">
            <span className="mono-meta">E{i + 1} · {fmtDate(e.at)}</span>
            {e.result ? <Pill tone="neutral">Result in</Pill> : <Pill tone="accent" icon="clock">Running</Pill>}
          </div>
          <p className="pp-entry-title">{e.title}</p>
          <p className="pp-label">Expected</p>
          <div className="pp-text"><Para text={e.expected} /></div>
          {e.result ? (
            <>
              <p className="pp-label">What happened</p>
              <div className="pp-text"><Para text={e.result} /></div>
            </>
          ) : (
            children?.(e.id)
          )}
        </li>
      ))}
    </ol>
  );
}

export function Notebook({ project }: { project: Project }) {
  if (project.notebook.length === 0) return <p className="muted pp-none">No notebook entries yet.</p>;
  return (
    <ol className="pp-log">
      {project.notebook.map((n) => (
        <li key={n.id} className="pp-entry">
          <span className="mono-meta">
            {new Date(n.at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
          </span>
          <div className="pp-text"><Para text={n.body} /></div>
        </li>
      ))}
    </ol>
  );
}

export function LinkOut({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href) return <span className="muted">Not added.</span>;
  return (
    <a href={href} className="text-link pp-link" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
