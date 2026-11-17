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
import {
  AimedAt,
  NotebookTemplateHead,
  OutlinePanel,
  OverrideRecord,
  PlanDraftPanel,
  RepoPanel,
  ReviewPanel,
} from "@/components/projects/AssistPanels";
import { getDrafts, githubConnected, suggestionFor, type Draft } from "@/lib/project-assist/store";
import { latestReview, overrides, type Review } from "@/lib/project-assist/review";
import { shortHash, type DraftKind } from "@/lib/project-assist/core";
import { partonConnected } from "@/lib/parton/claude";

export const dynamic = "force-dynamic";
// Parton's drafts and checks can take a minute or two.
export const maxDuration = 300;

/** What Parton and GitHub add to the project page. */
type Assist = {
  drafts: Partial<Record<DraftKind, Draft>>;
  review: Review | null;
  parton: boolean;
  github: boolean;
};

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
  const [drafts, review, overruled, suggestion] = await Promise.all([
    getDrafts(project.id),
    active ? latestReview(project.id, project.stage) : Promise.resolve(null),
    overrides(project.id),
    suggestionFor(project.id),
  ]);
  const assist: Assist = { drafts, review, parton: partonConnected(), github: githubConnected() };

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
          <AimedAt suggestion={suggestion} />
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

        {active && <CurrentStage project={project} assist={assist} />}

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
        {active && at > stageIndex("notebook") && (
          <NotebookPanel project={project} assist={assist} title="04 · Lab notebook" note="Still open: add entries while you write." />
        )}
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

        <OverrideRecord overrides={overruled} />

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

function Gaps({ project, parton }: { project: Project; parton: boolean }) {
  const gaps = stageGaps(project);
  if (gaps.length === 0) {
    const checks = [
      project.stage === "writeup" ? "the write-up link opens" : null,
      project.stage === "repo" ? "GitHub shows the repository has code and a real README" : null,
      parton ? "Parton confirms the work does its job" : null,
    ].filter(Boolean);
    if (checks.length === 0) return <p className="hint good">This stage is complete. Move on when you are ready.</p>;
    return (
      <p className="hint good">
        The word counts are met. {nextStage(project.stage) ? "Moving on" : "Publishing"} first checks that {checks.join(", and that ")}.
      </p>
    );
  }
  return (
    <div className="pp-gaps">
      <p className="hint">Before moving on (as of your last save):</p>
      <ul>{gaps.map((g) => <li key={g}>{g}</li>)}</ul>
    </div>
  );
}

const CHECKING = { advance: "Checking that this stage is really complete… (up to a minute)" };

function CurrentStage({ project, assist }: { project: Project; assist: Assist }) {
  // Parton's last check sits just below the stage's buttons, outside their form.
  const check = stageGaps(project).length === 0 ? <ReviewPanel project={project} review={assist.review} /> : null;
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
          <>
          <ProjectForm projectId={project.id} op="save" pendingNote={CHECKING}>
            <div className="field">
              <label htmlFor="pp-title">Title</label>
              <input id="pp-title" name="title" className="input" defaultValue={project.title} maxLength={200} />
            </div>
            <WordField name="question" label="Research question" min={MIN_WORDS.question} rows={3} defaultValue={project.question}
              hint="Specific enough that an experiment could answer it, and phrased as a question." />
            <WordField name="why" label="Why it matters" min={MIN_WORDS.why} rows={4} defaultValue={project.why}
              hint="Who would care about the answer, and what you would do differently knowing it." />
            <Gaps project={project} parton={assist.parton} />
            <StageButtons project={project} />
          </ProjectForm>
          {check}
          </>
        )}

        {project.stage === "plan" && (
          <>
            <Field label="Question" text={project.question} />
            <PlanDraftPanel project={project} draft={assist.drafts.plan} parton={assist.parton} />
            <ProjectForm projectId={project.id} op="save" pendingNote={CHECKING} key={shortHash(`${project.plan}\u0000${project.killCriterion}`)}>
              <WordField name="plan" label="Plan" min={MIN_WORDS.plan} rows={10} defaultValue={project.plan}
                hint="Data, model and setup; the baselines; what you will measure; what result would answer the question; the compute and time budget." />
              <WordField name="killCriterion" label="Kill criterion" min={MIN_WORDS.killCriterion} rows={3} defaultValue={project.killCriterion}
                hint="Decided now, before any results: what would make you stop this project." />
              <Gaps project={project} parton={assist.parton} />
              <StageButtons project={project} />
            </ProjectForm>
            {check}
          </>
        )}

        {project.stage === "experiments" && (
          <>
            <ExperimentPanel project={project} />
            <ProjectForm projectId={project.id} op="advance" pendingNote={CHECKING}>
              <Gaps project={project} parton={assist.parton} />
              <p className="hint">At least {MIN_EXPERIMENTS} experiment with its result, and none left without one.</p>
              <StageButtons project={project} saveable={false} />
            </ProjectForm>
            {check}
            <NotebookPanel project={project} assist={assist} title="Lab notebook" note="The notebook is already open: write as you go." />
            <RepoPanel project={project} github={assist.github} />
          </>
        )}

        {project.stage === "notebook" && (
          <>
            <NotebookPanel project={project} assist={assist} />
            <ProjectForm projectId={project.id} op="advance" pendingNote={CHECKING}>
              <Gaps project={project} parton={assist.parton} />
              <p className="hint">At least {MIN_NOTEBOOK_ENTRIES} entries in all, including any written during experiments.</p>
              <StageButtons project={project} saveable={false} />
            </ProjectForm>
            {check}
            <ExperimentPanel project={project} title="Experiments" />
            <RepoPanel project={project} github={assist.github} />
          </>
        )}

        {project.stage === "writeup" && (
          <>
          <OutlinePanel project={project} draft={assist.drafts.outline} parton={assist.parton} />
          <ProjectForm projectId={project.id} op="save" pendingNote={CHECKING}>
            <div className="field">
              <label htmlFor="pp-writeupUrl">Public link to the write-up</label>
              <p className="hint">A blog post, a report or a preprint: anywhere someone else can read it.</p>
              <input id="pp-writeupUrl" name="writeupUrl" type="url" className="input" defaultValue={project.writeupUrl} placeholder="https://" />
            </div>
            <WordField name="writeupSummary" label="Summary of findings" min={MIN_WORDS.writeupSummary} rows={6} defaultValue={project.writeupSummary}
              hint="What you found, how sure you are, and how it compares with the plan and the kill criterion." />
            <Gaps project={project} parton={assist.parton} />
            <StageButtons project={project} />
          </ProjectForm>
          {check}
          <RepoPanel project={project} github={assist.github} />
          </>
        )}

        {project.stage === "repo" && (
          <>
          {!project.repoUrl && <RepoPanel project={project} github={assist.github} />}
          <ProjectForm projectId={project.id} op="save" pendingNote={CHECKING}>
            <div className="field">
              <label htmlFor="pp-repoUrl">Public repository</label>
              <p className="hint">
                Publishing checks with GitHub that the repository is public, has code and a README that says how to
                reproduce the main result, and that the write-up link opens.
              </p>
              <input id="pp-repoUrl" name="repoUrl" type="url" className="input" defaultValue={project.repoUrl} placeholder="https://github.com/" />
            </div>
            <Gaps project={project} parton={assist.parton} />
            <StageButtons project={project} />
          </ProjectForm>
          {check}
          {project.repoUrl && <RepoPanel project={project} github={assist.github} />}
          </>
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

function NotebookPanel({ project, assist, title, note }: { project: Project; assist: Assist; title?: string; note?: string }) {
  const draft = assist.drafts.notebook;
  const template = draft?.status === "ready" ? draft.body : "";
  return (
    <div className="pp-sub">
      {title && <h3 className="pp-h3">{title}</h3>}
      {note && <p className="hint">{note}</p>}
      <Notebook project={project} />
      <NotebookTemplateHead project={project} draft={draft} parton={assist.parton} />
      <ProjectForm projectId={project.id} op="note" className="pp-add" resetOnDone key={shortHash(template)}>
        <WordField name="body" label="New entry" rows={template ? Math.min(16, template.split("\n").length + 2) : 5} defaultValue={template}
          hint="What you tried, what surprised you, what you will change. Dated automatically." />
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
