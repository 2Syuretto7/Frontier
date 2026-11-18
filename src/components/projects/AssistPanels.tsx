import { DRAFT_TITLES, OVERRIDE_MIN_WORDS, readPlanDraft, repoName, type DraftKind } from "@/lib/project-assist/core";
import type { Draft, StoredSuggestion } from "@/lib/project-assist/store";
import type { Review } from "@/lib/project-assist/review";
import { STAGE_INFO, githubRepo, type Project } from "@/lib/pipeline";
import { ProjectForm } from "./ProjectForm";
import { WordField } from "./WordField";
import { Field, LinkOut, fmtDate } from "./ProjectParts";
import { CopyButton, RefreshWhilePending } from "./AssistClient";

const DRAFT_PENDING = "Parton is drafting… (up to two minutes)";

const DRAFT_WHAT: Record<DraftKind, string> = {
  plan: "Parton drafts a plan and kill criterion from your question and why it matters. You edit it before saving.",
  notebook: "Parton drafts an entry template for this project's notebook from your plan and experiments. Each new entry starts from it.",
  outline: "Parton drafts an outline of the write-up from your question, plan, experiments and notebook, without inventing results.",
};

/** The state of one draft, with the button to draft it (again). */
function DraftHead({ project, kind, draft, parton }: { project: Project; kind: DraftKind; draft: Draft | undefined; parton: boolean }) {
  if (!parton) return <p className="hint">Parton is not connected, so it can't draft this. Add ANTHROPIC_API_KEY in Vercel.</p>;
  if (draft?.status === "pending") {
    return (
      <p className="hint pp-pending" role="status">
        Parton is drafting this from your notes. It appears here when it is ready.
        <RefreshWhilePending />
      </p>
    );
  }
  return (
    <ProjectForm projectId={project.id} op="draft" extra={{ kind }} pendingNote={DRAFT_PENDING} className="pp-draft-head">
      {draft?.status === "failed" && <p className="error">{draft.error || "Parton's draft didn't finish."}</p>}
      {!draft && <p className="hint">{DRAFT_WHAT[kind]}</p>}
      <button type="submit" className="btn btn-sm">{draft?.status === "ready" ? "Draft again" : "Draft with Parton"}</button>
    </ProjectForm>
  );
}

export function PlanDraftPanel({ project, draft, parton }: { project: Project; draft: Draft | undefined; parton: boolean }) {
  const plan = draft?.status === "ready" ? readPlanDraft(draft.body) : null;
  return (
    <div className="pp-assist">
      <div className="pp-assist-bar">
        <h3 className="pp-h3">{DRAFT_TITLES.plan}</h3>
        <DraftHead project={project} kind="plan" draft={draft} parton={parton} />
      </div>
      {plan && (
        <>
          <Field label="Plan" text={plan.plan} />
          <Field label="Kill criterion" text={plan.killCriterion} />
          <ProjectForm projectId={project.id} op="usePlanDraft">
            <p className="hint">Using it replaces what is in the plan form below. You can still edit everything before moving on.</p>
            <button type="submit" className="btn">Use this draft</button>
          </ProjectForm>
        </>
      )}
    </div>
  );
}

export function NotebookTemplateHead({ project, draft, parton }: { project: Project; draft: Draft | undefined; parton: boolean }) {
  return (
    <div className="pp-assist pp-assist-quiet">
      <div className="pp-assist-bar">
        <p className="hint pp-assist-note">
          {draft?.status === "ready"
            ? "New entries start from the template Parton drafted for this project. Replace each prompt with your notes."
            : "A template for this project's entries."}
        </p>
        <DraftHead project={project} kind="notebook" draft={draft} parton={parton} />
      </div>
    </div>
  );
}

export function OutlinePanel({ project, draft, parton }: { project: Project; draft: Draft | undefined; parton: boolean }) {
  const ready = draft?.status === "ready" ? draft.body : null;
  return (
    <div className="pp-assist">
      <div className="pp-assist-bar">
        <h3 className="pp-h3">{DRAFT_TITLES.outline}</h3>
        <DraftHead project={project} kind="outline" draft={draft} parton={parton} />
      </div>
      {ready && (
        <>
          <pre className="pp-pre">{ready}</pre>
          <div className="pp-actions"><CopyButton text={ready} label="Copy the outline" /></div>
        </>
      )}
    </div>
  );
}

/** Creating the public repository on GitHub, or the link to it with a README refresh. */
export function RepoPanel({ project, github }: { project: Project; github: boolean }) {
  if (project.repoUrl) {
    const onGitHub = Boolean(githubRepo(project.repoUrl));
    return (
      <div className="pp-assist">
        <div className="pp-assist-bar">
          <h3 className="pp-h3">Public repository</h3>
        </div>
        <p><LinkOut href={project.repoUrl}>{project.repoUrl}</LinkOut></p>
        {onGitHub && github && (
          <ProjectForm projectId={project.id} op="refreshReadme" pendingNote="Updating the README on GitHub…">
            <p className="hint">
              Rewrites the README from the project as it stands (question, plan, experiments, findings), keeping your
              own &ldquo;Reproducing the main result&rdquo; section and everything after it.
            </p>
            <button type="submit" className="btn btn-sm">Refresh README from the project</button>
          </ProjectForm>
        )}
      </div>
    );
  }
  return (
    <div className="pp-assist">
      <div className="pp-assist-bar">
        <h3 className="pp-h3">Create the public repository</h3>
      </div>
      {github ? (
        <ProjectForm projectId={project.id} op="createRepo" pendingNote="Creating the repository on GitHub…">
          <p className="hint">
            Creates a public GitHub repository now, so your code goes there as you write it. It starts with a README
            built from this project and a Python .gitignore, and is linked here for the repository stage.
          </p>
          <div className="pp-start-row">
            <label htmlFor="pp-repoName" className="sr-only">Repository name</label>
            <input id="pp-repoName" name="repoName" className="input" defaultValue={repoName(project.title)} maxLength={100} autoComplete="off" />
            <button type="submit" className="btn">Create on GitHub</button>
          </div>
        </ProjectForm>
      ) : (
        <p className="hint">
          Frontier can create and fill the repository for you once GitHub is connected: add a GITHUB_TOKEN in Vercel
          (a fine-grained token with read and write access to Administration and Contents).
        </p>
      )}
    </div>
  );
}

/** Parton's last check of the current stage, and the way to move on if the learner disagrees with it. */
export function ReviewPanel({ project, review }: { project: Project; review: Review | null }) {
  if (!review) return null;
  if (review.complete) {
    if (review.override) return null;
    return <p className="hint good">Parton checked this stage on {fmtDate(review.at)} and found it complete.</p>;
  }
  return (
    <div className="pp-review" role="region" aria-label="Last check">
      <p className="pp-review-title">
        {review.byParton ? "Parton's check" : "The repository check"} <span className="mono-meta">{fmtDate(review.at)}</span>
      </p>
      <p className="hint">Before {STAGE_INFO[project.stage].title.toLowerCase()} is complete:</p>
      <ul>{review.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
      <p className="hint">Fix these and move on again; the check reruns on what you changed.</p>
      {review.byParton && (
        <details className="pp-override">
          <summary>I disagree with the check</summary>
          <ProjectForm projectId={project.id} op="override">
            <WordField name="reason" label="Why the check is wrong" min={OVERRIDE_MIN_WORDS} rows={4}
              hint="Your reason is kept on the project's record, next to the gaps Parton named." />
            <button type="submit" className="btn">Move on anyway</button>
          </ProjectForm>
        </details>
      )}
    </div>
  );
}

/** Times the learner moved on despite Parton's check, kept on the project's record. */
export function OverrideRecord({ overrides }: { overrides: Review[] }) {
  if (overrides.length === 0) return null;
  return (
    <section className="pp-record" aria-label="Checks overruled">
      <h2 className="pp-h2">Checks overruled</h2>
      <ol className="pp-log">
        {overrides.map((o) => (
          <li key={o.id} className="pp-entry">
            <span className="mono-meta">{STAGE_INFO[o.stage]?.title ?? o.stage} · {fmtDate(o.at)}</span>
            <p className="pp-label">Parton said</p>
            <ul className="pp-review-list">{o.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
            <p className="pp-label">Why you moved on</p>
            <div className="pp-text"><p>{o.override}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The Readiness skills a project is aimed at, when it started from one of Parton's suggestions. */
export function AimedAt({ suggestion }: { suggestion: StoredSuggestion | null }) {
  if (!suggestion || suggestion.skills.length === 0) return null;
  return (
    <p className="pp-aim">
      <span className="eyebrow">Aimed at</span> {suggestion.skills.join(" · ")}
    </p>
  );
}

/** Parton's suggested projects, on the Projects page when nothing is open. */
export function Suggestions({ suggestions, gaps, parton }: { suggestions: StoredSuggestion[]; gaps: string[]; parton: boolean }) {
  return (
    <section className="pp-suggest" aria-labelledby="suggest-title">
      <div className="pp-assist-bar">
        <h2 id="suggest-title" className="pp-h2">Suggested by Parton</h2>
      </div>
      <p className="hint">
        {gaps.length
          ? <>Project questions aimed at your biggest Readiness gaps: {gaps.slice(0, 5).join(", ")}.</>
          : <>Project questions aimed at your Readiness gaps. Without a scorecard yet, Parton aims at what frontier labs commonly ask for.</>}
      </p>
      {suggestions.length > 0 && (
        <ul className="pp-list">
          {suggestions.map((s) => (
            <li key={s.id} className="pp-row">
              <p className="pp-row-title">{s.title}</p>
              <p className="pp-row-q">{s.question}</p>
              <p className="pp-row-why">{s.why}</p>
              {s.skills.length > 0 && <p className="pp-aim"><span className="eyebrow">Fills</span> {s.skills.join(" · ")}</p>}
              {s.firstStep && <p className="pp-row-why"><strong>First step:</strong> {s.firstStep}</p>}
              <ProjectForm op="startSuggestion" extra={{ suggestionId: s.id }}>
                <button type="submit" className="btn btn-sm">Start this project</button>
              </ProjectForm>
            </li>
          ))}
        </ul>
      )}
      {parton ? (
        <ProjectForm op="suggest" pendingNote="Parton is reading your Readiness gaps and what you have studied… (up to two minutes)" className="pp-suggest-go">
          <button type="submit" className={suggestions.length ? "btn" : "btn btn-primary"}>
            {suggestions.length ? "Suggest three more" : "Suggest projects from my gaps"}
          </button>
        </ProjectForm>
      ) : (
        <p className="hint">Parton is not connected, so it can't suggest projects yet. Add ANTHROPIC_API_KEY in Vercel.</p>
      )}
    </section>
  );
}
