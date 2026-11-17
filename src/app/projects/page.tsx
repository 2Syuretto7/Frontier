import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { STAGE_INFO, STAGES, daysBetween } from "@/lib/pipeline";
import { TopBar } from "@/components/TopBar";
import { ArrowRight } from "@/components/ui/Icons";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { LinkOut, Stepper, fmtDate } from "@/components/projects/ProjectParts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function Projects() {
  await requireOwner();
  const projects = await listProjects();
  const now = new Date().toISOString();
  const open = projects.find((p) => p.status === "active");
  const published = projects.filter((p) => p.status === "published");
  const killed = projects.filter((p) => p.status === "killed");

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <header className="page-head">
          <p className="eyebrow">Portfolio</p>
          <h1>Projects</h1>
          <p className="lede">
            One project at a time, through six fixed stages: question, plan, experiments, lab notebook, write-up and
            public repository. A new project starts only once the current one is published, or killed with a short
            post-mortem.
          </p>
        </header>

        {open ? (
          <section className="pp-open" aria-labelledby="open-title">
            <div className="panel-bar">
              <span className="mono-tag">Open project</span>
              <span className="mono-meta">Day {daysBetween(open.startedAt, now) + 1}</span>
            </div>
            <div className="pp-open-body">
              <h2 id="open-title" className="pp-open-title">{open.title}</h2>
              {open.question && <p className="pp-open-q">{open.question}</p>}
              <Stepper project={open} now={now} />
              <p className="pp-open-next">
                Now: <strong>{STAGE_INFO[open.stage].title}</strong>. {STAGE_INFO[open.stage].ask}
              </p>
              <Link href={`/projects/${open.id}`} className="btn btn-primary">
                Continue <ArrowRight size={14} />
              </Link>
            </div>
            <p className="pp-open-foot">
              New projects are locked until this one is published or killed.
            </p>
          </section>
        ) : (
          <section className="pp-open" aria-labelledby="start-title">
            <div className="panel-bar">
              <span className="mono-tag">Start a project</span>
            </div>
            <div className="pp-open-body">
              <h2 id="start-title" className="pp-open-title">
                {projects.length === 0 ? "Your first project" : "Nothing open. Start the next one."}
              </h2>
              <p className="pp-open-next">
                Name it now; the question comes next. It stays open until you publish it or kill it, and nothing else
                can start in the meantime.
              </p>
              <ProjectForm op="start" className="pp-start">
                <label htmlFor="pp-start-title" className="sr-only">Project title</label>
                <input id="pp-start-title" name="title" className="input" placeholder="For example: Does label smoothing help small transformers?" maxLength={200} required />
                <button type="submit" className="btn btn-primary">Start project</button>
              </ProjectForm>
            </div>
          </section>
        )}

        <section className="pp-list-section" aria-labelledby="published-title">
          <h2 id="published-title" className="pp-h2">Published <span className="mono-meta">{published.length}</span></h2>
          {published.length === 0 ? (
            <p className="muted">Nothing published yet. Every published project lands here with its write-up and repository.</p>
          ) : (
            <ul className="pp-list">
              {published.map((p) => (
                <li key={p.id} className="pp-row">
                  <Link href={`/projects/${p.id}`} className="pp-row-title">{p.title}</Link>
                  <p className="pp-row-q">{p.question}</p>
                  <p className="pp-row-meta">
                    <span className="mono-meta">{fmtDate(p.endedAt!)} · {dayCount(daysBetween(p.startedAt, p.endedAt!) + 1)}</span>
                    <LinkOut href={p.writeupUrl}>Write-up</LinkOut>
                    <LinkOut href={p.repoUrl}>Repository</LinkOut>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {killed.length > 0 && (
          <section className="pp-list-section" aria-labelledby="killed-title">
            <h2 id="killed-title" className="pp-h2">Killed <span className="mono-meta">{killed.length}</span></h2>
            <ul className="pp-list">
              {killed.map((p) => (
                <li key={p.id} className="pp-row">
                  <Link href={`/projects/${p.id}`} className="pp-row-title">{p.title}</Link>
                  <p className="pp-row-q">{excerpt(p.postmortem)}</p>
                  <p className="pp-row-meta">
                    <span className="mono-meta">
                      Killed at {STAGE_INFO[p.stage].short.toLowerCase()} (stage {STAGES.indexOf(p.stage) + 1} of {STAGES.length}) · {fmtDate(p.endedAt!)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function excerpt(text: string, words = 40) {
  const all = text.trim().split(/\s+/);
  return all.length <= words ? text.trim() : `${all.slice(0, words).join(" ")}…`;
}

const dayCount = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
