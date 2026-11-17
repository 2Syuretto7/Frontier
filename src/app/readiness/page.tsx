import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { loadScorecard, type Skill } from "@/lib/readiness/store";
import { LEVELS, POSTINGS_MAX, POSTINGS_MIN, daysUntilRecheck, evidenceLabel, quarterLabel, supportedLevel } from "@/lib/readiness/core";
import { removeEvidenceAction, removePostingAction, removeSkillAction, setLevelAction, startNewCheckAction } from "./actions";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ArrowLeft, Close } from "@/components/ui/Icons";
import { EvidenceForm, ExtractButton, PostingForm } from "@/components/readiness/Forms";
import "@/components/readiness/readiness.css";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Readiness" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Readiness() {
  await requireOwner();
  const card = await loadScorecard();
  const live = card.skills.filter((s) => s.frequency > 0);
  const gone = card.skills.filter((s) => s.frequency === 0);
  const days = daysUntilRecheck(card.lastCheck);
  const due = days !== null && days <= 0;
  const hasSkills = card.skills.length > 0;

  const postings = (
    <section className="rd-block" aria-labelledby="rd-postings">
      <div className="rd-block-head">
        <div>
          <h2 id="rd-postings">Job postings</h2>
          <p className="desc">
            Paste {POSTINGS_MIN} to {POSTINGS_MAX} current postings for your target role at Anthropic, OpenAI, Google DeepMind and
            similar labs. Parton pulls out the skills they keep asking for.
          </p>
        </div>
        <span className="mono-meta">{card.postings.length} of {POSTINGS_MIN}–{POSTINGS_MAX}</span>
      </div>
      {card.postings.length > 0 && (
        <ol className="rd-postings">
          {card.postings.map((p, i) => (
            <li key={p.id}>
              <details>
                <summary>
                  <span className="mono-meta">{String(i + 1).padStart(2, "0")}</span>
                  <span className="rd-posting-title">{p.role || "Untitled role"}{p.company ? <span className="muted"> · {p.company}</span> : null}</span>
                </summary>
                <div className="rd-posting-body">
                  {p.url && <p><a href={p.url} target="_blank" rel="noreferrer noopener" className="text-link">Original posting</a></p>}
                  <pre>{p.body}</pre>
                </div>
              </details>
              <form action={removePostingAction}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="btn btn-ghost btn-icon" aria-label={`Remove posting ${i + 1}`}><Close size={14} /></button>
              </form>
            </li>
          ))}
        </ol>
      )}
      {card.postings.length < POSTINGS_MAX && (
        <details className="rd-add" open={card.postings.length === 0 || (!hasSkills && card.postings.length < POSTINGS_MIN)}>
          <summary className="btn btn-sm">Paste a posting</summary>
          <PostingForm count={card.postings.length} />
        </details>
      )}
      {(card.postings.length > 0 || hasSkills) && (
        <ExtractButton count={card.postings.length} hasSkills={hasSkills} stale={card.stale || !card.lastCheck} parton={card.parton} />
      )}
    </section>
  );

  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page rd-page">
        <Link href="/" className="back"><ArrowLeft size={14} /> Home</Link>
        <header className="page-head">
          <p className="eyebrow">Readiness · {quarterLabel(new Date())}</p>
          <h1>Readiness scorecard</h1>
          <p className="lede">
            What frontier labs keep asking for, taken from real postings, and how ready you are for each, judged only on
            evidence: a repository, a passed drill, a project, a write-up.
          </p>
        </header>

        {hasSkills && (
          <section className="rd-summary" aria-label="Summary">
            <div className="rd-stat">
              <p className="eyebrow">Readiness</p>
              <p className="stat-value">{card.readiness ?? 0}<span className="rd-unit">%</span></p>
              <p className="stat-note">Weighted by how often postings ask</p>
            </div>
            <div className="rd-stat">
              <p className="eyebrow">Backed by evidence</p>
              <p className="stat-value">{live.filter((s) => s.level >= 2).length}<span className="rd-unit"> / {live.length}</span></p>
              <p className="stat-note">Skills at Practised or above</p>
            </div>
            <div className="rd-stat">
              <p className="eyebrow">Next re-check</p>
              <p className="stat-value">{days === null ? "—" : due ? "Due" : days}<span className="rd-unit">{days !== null && !due ? (days === 1 ? " day" : " days") : ""}</span></p>
              <p className="stat-note">{card.lastCheck ? `Last read ${dateFmt.format(card.lastCheck)}` : "After Parton first reads postings"}</p>
            </div>
          </section>
        )}

        {due && (
          <section className="rd-due" aria-label="Quarterly re-check">
            <div>
              <p><Pill tone="accent" icon="clock">Quarterly re-check due</Pill></p>
              <p>
                It has been over three months since Parton last read your postings, and postings change. Set this quarter&apos;s
                postings aside, paste {POSTINGS_MIN} to {POSTINGS_MAX} fresh ones, and Parton will re-read them. Your scores and
                evidence stay.
              </p>
            </div>
            <form action={startNewCheckAction}>
              <button type="submit" className="btn btn-primary">Start the {quarterLabel(new Date())} check</button>
            </form>
          </section>
        )}

        {!hasSkills && postings}

        {hasSkills && (
          <section className="rd-block" aria-labelledby="rd-skills">
            <div className="rd-block-head">
              <div>
                <h2 id="rd-skills">Skills</h2>
                <p className="desc">
                  Most asked for first. A level above Studied counts only when evidence backs it:{" "}
                  {LEVELS.slice(2).map((l, i) => <span key={l.value}>{i ? "; " : ""}<strong>{l.label}</strong> needs {l.needs.charAt(0).toLowerCase() + l.needs.slice(1, -1)}</span>)}.
                </p>
              </div>
            </div>
            <ol className="rd-skills">
              {live.map((s) => <SkillRow key={s.id} skill={s} />)}
            </ol>
            {gone.length > 0 && (
              <details className="rd-gone">
                <summary>{gone.length} skill{gone.length === 1 ? "" : "s"} the current postings no longer ask for</summary>
                <p className="hint">They keep their levels and evidence but don&apos;t count towards readiness. They come back if fresh postings ask for them again.</p>
                <ol className="rd-skills">
                  {gone.map((s) => <SkillRow key={s.id} skill={s} />)}
                </ol>
              </details>
            )}
          </section>
        )}

        {hasSkills && postings}

        {card.checks.length > 0 && (
          <section className="rd-block" aria-labelledby="rd-history">
            <div className="rd-block-head">
              <div>
                <h2 id="rd-history">History</h2>
                <p className="desc">Each time Parton read your postings. Re-check every quarter, because postings change.</p>
              </div>
            </div>
            <div className="rd-table-wrap"><table className="table rd-history">
              <thead><tr><th>Date</th><th>Quarter</th><th>Postings</th><th>Skills</th><th>Readiness</th></tr></thead>
              <tbody>
                {card.checks.slice(0, 12).map((c) => (
                  <tr key={c.id}>
                    <td>{dateFmt.format(c.at)}</td>
                    <td>{quarterLabel(c.at)}</td>
                    <td>{c.postings}</td>
                    <td>{c.skills}</td>
                    <td>{c.readiness === null ? "—" : `${c.readiness}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {!due && card.postings.length > 0 && (
              <form action={startNewCheckAction} className="rd-early">
                <p className="hint">Want to re-check early with a fresh set of postings? This sets the current postings aside; scores and evidence stay.</p>
                <button type="submit" className="btn btn-sm">Start a fresh check now</button>
              </form>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function SkillRow({ skill: s }: { skill: Skill }) {
  const backed = supportedLevel(s.kinds);
  const short = s.claimed > s.level;
  return (
    <li className="rd-skill" id={`skill-${s.id}`}>
      <div className="rd-skill-head">
        <div className="rd-skill-name">
          <h3>{s.name}</h3>
          <span className="mono-meta">{s.area}</span>
        </div>
        <div className="rd-freq" title={`${s.frequency} of ${s.postingCount} postings ask for this`}>
          <span className="rd-freq-bar" aria-hidden="true"><span style={{ width: `${s.postingCount ? (s.frequency / s.postingCount) * 100 : 0}%` }} /></span>
          <span className="mono-meta">{s.frequency ? `${s.frequency} of ${s.postingCount} postings` : "Not in current postings"}</span>
        </div>
      </div>
      {s.description && <p className="rd-desc">{s.description}</p>}
      {s.quotes.length > 0 && (
        <ul className="rd-quotes">{s.quotes.map((q) => <li key={q}>&ldquo;{q}&rdquo;</li>)}</ul>
      )}

      <form action={setLevelAction} className="rd-levels">
        <input type="hidden" name="skill" value={s.id} />
        <div className="segmented" role="group" aria-label={`Your level in ${s.name}`}>
          {LEVELS.map((l) => (
            <button key={l.value} type="submit" name="level" value={l.value} title={l.needs}
              className={`seg${l.value === s.claimed ? " is-on" : ""}${l.value > backed ? " rd-unbacked" : ""}`} aria-pressed={l.value === s.claimed}>
              {l.label}
            </button>
          ))}
        </div>
        {short && (
          <Pill tone="danger">Counts as {LEVELS[s.level].label} until evidence backs {LEVELS[s.claimed].label}</Pill>
        )}
      </form>

      <div className="rd-evidence">
        {s.evidence.length > 0 ? (
          <ul>
            {s.evidence.map((e) => (
              <li key={e.id}>
                <span className="rd-kind">{evidenceLabel(e.kind)}</span>
                {e.url ? (
                  e.url.startsWith("/") ? <Link href={e.url}>{e.title}</Link> : <a href={e.url} target="_blank" rel="noreferrer noopener">{e.title}</a>
                ) : <span>{e.title}</span>}
                <form action={removeEvidenceAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="btn btn-ghost btn-icon rd-x" aria-label={`Remove evidence ${e.title}`}><Close size={12} /></button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No evidence yet.</p>
        )}
        <details className="rd-add">
          <summary className="btn btn-sm btn-ghost">Add evidence</summary>
          <EvidenceForm skillId={s.id} />
        </details>
      </div>

      {s.frequency === 0 && (
        <form action={removeSkillAction} className="rd-remove">
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="btn btn-sm btn-danger">Remove this skill and its evidence</button>
        </form>
      )}
    </li>
  );
}
