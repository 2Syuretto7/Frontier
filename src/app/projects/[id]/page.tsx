import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import {
  MIN_EXPERIMENTS,
  MIN_NOTEBOOK_ENTRIES,
  MIN_WORDS,
  STAGE_INFO,
  nextStage,
  stageGaps,
  stageIndex,
  type Project,
} from "@/lib/pipeline";
import { TopBar } from "@/components/TopBar";
import { ArrowLeft } from "@/components/ui/Icons";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { WordField } from "@/components/projects/WordField";
import { ExperimentList, Field, LinkOut, Notebook, StatusPill, Stepper, fmtDate } from "@/components/projects/ProjectParts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(Number(id));
  return { title: p ? p.title : "Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const project = await getProject(Number(id));
  if (!project) notFound();
  const now = new Date().toISOString();
  const active = project.status === "active";
  const at = stageIndex(project.stage);
  const past = (stage: Parameters<typeof stageIndex>[0]) => !active || at > stageIndex(stage);

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <Link href="/projects" className="back"><ArrowLeft size={14} /> Projects</Link>
        <header className="page-head">
          <p className="eyebrow pp-eyebrow">
            <StatusPill project={project} />
            <span>Started {fmtDate(project.startedAt)}{project.endedAt ? ` · ended ${fmtDate(project.endedAt)}` : ""}</span>
          </p>
          <h1>{project.title}</h1>
        </header>

        <Stepper project={project} now={now} />

        {project.status === "published" && (
          <div className="pp-banner pp-banner-published">
            <p><strong>Published.</strong> This project is part of your portfolio.</p>
            <p className="pp-banner-links">
              <LinkOut href={project.writeupUrl}>Read the write-up</LinkOut>
              <LinkOut href={project.repoUrl}>Open the repository</LinkOut>
            </p>
          </div>
        )}
        {project.status === "killed" && (
          <div className="pp-banner">
            <p><strong>Killed</strong> at the {STAGE_INFO[project.stage].title.toLowerCase()} stage.</p>
            <Field label="Post-mortem" text={project.postmortem} />
          </div>
        )}

        {active && <CurrentStage project={project} />}

        {past("question") && (
          <section className="pp-record" aria-label="Question">
            <h2 className="pp-h2">01 · Question</h2>
            <Field label="Question" text={project.question} />
            <Field label="Why it matters" text={project.why} />
          </section>
        )}
        {past("plan") && (
          <section className="pp-record" aria-label="Plan">
            <h2 className="pp-h2">02 · Plan</h2>
            <Field label="Plan" text={project.plan} />
            <Field label="Kill criterion" text={project.killCriterion} />
          </section>
        )}
        {(!active ? project.experiments.length > 0 : at > stageIndex("notebook")) && (
          <section className="pp-record" aria-label="Experiments">
            <h2 className="pp-h2">03 · Experiments</h2>
            <ExperimentList project={project} />
          </section>
        )}
        {!active && project.notebook.length > 0 && (
          <section className="pp-record" aria-label="Lab notebook">
            <h2 className="pp-h2">04 · Lab notebook</h2>
            <Notebook project={project} />
          </section>
        )}
        {active && at > stageIndex("notebook") && <NotebookPanel project={project} title="04 · Lab notebook" note="Still open: add entries while you write." />}
        {past("writeup") && (project.writeupUrl || project.writeupSummary) && (
          <section className="pp-record" aria-label="Write-up">
            <h2 className="pp-h2">05 · Write-up</h2>
            <p><LinkOut href={project.writeupUrl}>{project.writeupUrl}</LinkOut></p>
            <Field label="Summary of findings" text={project.writeupSummary} />
          </section>
        )}
        {!active && project.repoUrl && (
          <section className="pp-record" aria-label="Repository">
            <h2 className="pp-h2">06 · Public repository</h2>
            <p><LinkOut href={project.repoUrl}>{project.repoUrl}</LinkOut></p>
          </section>
        )}

        {active && <KillPanel project={project} />}
      </main>
    </div>
  );
}

function StageButtons({ project, saveable = true }: { project: Project; saveable?: boolean }) {
  const next = nextStage(project.stage);
  return (
    <div className="pp-actions">
      {saveable && <button type="submit" name="op" value="save" className="btn">Save</button>}
      <button type="submit" name="op" value="advance" className="btn btn-primary">
        {next ? `${saveable ? "Save and move" : "Move"} on to ${STAGE_INFO[next].title.toLowerCase()}` : "Publish"}
      </button>
    </div>
  );
}

function Gaps({ project }: { project: Project }) {
  const gaps = stageGaps(project);
  if (gaps.length === 0) return <p className="hint good">This stage is complete. Move on when you are ready.</p>;
  return (
    <div className="pp-gaps">
      <p className="hint">Before moving on (as of your last save):</p>
      <ul>{gaps.map((g) => <li key={g}>{g}</li>)}</ul>
    </div>
  );
}

function CurrentStage({ project }: { project: Project }) {
  const info = STAGE_INFO[project.stage];
  const n = String(stageIndex(project.stage) + 1).padStart(2, "0");
  return (
    <section className="pp-current" aria-labelledby="stage-title">
      <div className="panel-bar">
        <span className="mono-tag">Stage {n} of 06</span>
        <span className="mono-meta">Earlier stages are frozen once you move on</span>
      </div>
      <div className="pp-current-body">
        <h2 id="stage-title" className="pp-stage-title">{info.title}</h2>
        <p className="pp-ask">{info.ask}</p>

        {project.stage === "question" && (
          <ProjectForm projectId={project.id} op="save">
            <div className="field">
              <label htmlFor="pp-title">Title</label>
              <input id="pp-title" name="title" className="input" defaultValue={project.title} maxLength={200} />
            </div>
            <WordField name="question" label="Research question" min={MIN_WORDS.question} rows={3} defaultValue={project.question}
              hint="Specific enough that an experiment could answer it, and phrased as a question." />
            <WordField name="why" label="Why it matters" min={MIN_WORDS.why} rows={4} defaultValue={project.why}
              hint="Who would care about the answer, and what you would do differently knowing it." />
            <Gaps project={project} />
            <StageButtons project={project} />
          </ProjectForm>
        )}

        {project.stage === "plan" && (
          <>
            <Field label="Question" text={project.question} />
            <ProjectForm projectId={project.id} op="save">
              <WordField name="plan" label="Plan" min={MIN_WORDS.plan} rows={10} defaultValue={project.plan}
                hint="Data, model and setup; the baselines; what you will measure; what result would answer the question; the compute and time budget." />
              <WordField name="killCriterion" label="Kill criterion" min={MIN_WORDS.killCriterion} rows={3} defaultValue={project.killCriterion}
                hint="Decided now, before any results: what would make you stop this project." />
              <Gaps project={project} />
              <StageButtons project={project} />
            </ProjectForm>
          </>
        )}

        {project.stage === "experiments" && (
          <>
            <ExperimentPanel project={project} />
            <ProjectForm projectId={project.id} op="advance">
              <Gaps project={project} />
              <p className="hint">At least {MIN_EXPERIMENTS} experiment with its result, and none left without one.</p>
              <StageButtons project={project} saveable={false} />
            </ProjectForm>
            <NotebookPanel project={project} title="Lab notebook" note="The notebook is already open: write as you go." />
          </>
        )}

        {project.stage === "notebook" && (
          <>
            <NotebookPanel project={project} />
            <ProjectForm projectId={project.id} op="advance">
              <Gaps project={project} />
              <p className="hint">At least {MIN_NOTEBOOK_ENTRIES} entries in all, including any written during experiments.</p>
              <StageButtons project={project} saveable={false} />
            </ProjectForm>
            <ExperimentPanel project={project} title="Experiments" />
          </>
        )}

        {project.stage === "writeup" && (
          <ProjectForm projectId={project.id} op="save">
            <div className="field">
              <label htmlFor="pp-writeupUrl">Public link to the write-up</label>
              <p className="hint">A blog post, a report or a preprint: anywhere someone else can read it.</p>
              <input id="pp-writeupUrl" name="writeupUrl" type="url" className="input" defaultValue={project.writeupUrl} placeholder="https://" />
            </div>
            <WordField name="writeupSummary" label="Summary of findings" min={MIN_WORDS.writeupSummary} rows={6} defaultValue={project.writeupSummary}
              hint="What you found, how sure you are, and how it compares with the plan and the kill criterion." />
            <Gaps project={project} />
            <StageButtons project={project} />
          </ProjectForm>
        )}

        {project.stage === "repo" && (
          <ProjectForm projectId={project.id} op="save">
            <div className="field">
              <label htmlFor="pp-repoUrl">Public repository</label>
              <p className="hint">Publishing checks with GitHub that the repository is public, and that the write-up link opens.</p>
              <input id="pp-repoUrl" name="repoUrl" type="url" className="input" defaultValue={project.repoUrl} placeholder="https://github.com/" />
            </div>
            <Gaps project={project} />
            <StageButtons project={project} />
          </ProjectForm>
        )}
      </div>
    </section>
  );
}

function ExperimentPanel({ project, title }: { project: Project; title?: string }) {
  return (
    <div className="pp-sub">
      {title && <h3 className="pp-h3">{title}</h3>}
      <ExperimentList project={project}>
        {(experimentId) => (
          <ProjectForm projectId={project.id} op="result" extra={{ experimentId }} resetOnDone>
            <WordField name="result" label="What happened" rows={3} hint="Numbers, plots you made, and whether it matched what you expected." />
            <button type="submit" className="btn btn-sm">Record result</button>
          </ProjectForm>
        )}
      </ExperimentList>
      <ProjectForm projectId={project.id} op="experiment" className="pp-add" resetOnDone>
        <h3 className="pp-h3">Log an experiment</h3>
        <div className="field">
          <label htmlFor="pp-exp-title">Experiment</label>
          <input id="pp-exp-title" name="title" className="input" maxLength={300} placeholder="For example: baseline, 4-layer model, no smoothing" />
        </div>
        <WordField name="expected" label="What you expect" rows={3} hint="Written before you run it." />
        <button type="submit" className="btn">Log experiment</button>
      </ProjectForm>
    </div>
  );
}

function NotebookPanel({ project, title, note }: { project: Project; title?: string; note?: string }) {
  return (
    <div className="pp-sub">
      {title && <h3 className="pp-h3">{title}</h3>}
      {note && <p className="hint">{note}</p>}
      <Notebook project={project} />
      <ProjectForm projectId={project.id} op="note" className="pp-add" resetOnDone>
        <WordField name="body" label="New entry" rows={5} hint="What you tried, what surprised you, what you will change. Dated automatically." />
        <button type="submit" className="btn">Add entry</button>
      </ProjectForm>
    </div>
  );
}

function KillPanel({ project }: { project: Project }) {
  return (
    <details className="pp-kill">
      <summary>Kill this project</summary>
      <p className="hint">
        Killing a project deliberately is fine; drifting away from it is not. It ends here, frees you to start the next one,
        and the post-mortem stays on the Projects page.
        {project.killCriterion && <> Your kill criterion was: <em>{project.killCriterion}</em></>}
      </p>
      <ProjectForm projectId={project.id} op="kill">
        <WordField name="postmortem" label="Post-mortem" min={MIN_WORDS.postmortem} rows={6}
          hint="Why you are stopping, what you learnt, and what you would do differently next time." />
        <button type="submit" className="btn btn-danger">Kill project</button>
      </ProjectForm>
    </details>
  );
}
