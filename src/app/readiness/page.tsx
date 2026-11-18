import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { loadScorecard, needsScoring, type Skill } from "@/lib/readiness/store";
import { LEVELS, POSTINGS_MAX, TREND_LABELS, daysUntilRecheck, evidenceLabel, nextHref, quarterLabel, supportedLevel, type NextStep, type Trend } from "@/lib/readiness/core";
import { acceptSuggestionAction, confirmLevelAction, removeEvidenceAction, removePostingAction, removeSkillAction, setLevelAction } from "./actions";
import { TopBar } from "@/components/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ArrowLeft, Close } from "@/components/ui/Icons";
import { EvidenceForm, ExtractButton, PostingForm, RefreshPanel, ScorePanel } from "@/components/readiness/Forms";
import "@/components/readiness/readiness.css";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Readiness" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Readiness() {
  await requireOwner();
  const [card, dirty] = await Promise.all([loadScorecard(), needsScoring()]);
  const live = card.skills.filter((s) => s.frequency > 0);
  const gaps = live.filter((s) => s.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const moved = card.skills.filter((s) => s.trend !== null);
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
            The current postings the scorecard is built from, found by Parton on the labs&apos; own job boards for your target role.
          </p>
        </div>
        <span className="mono-meta">{card.postings.length} posting{card.postings.length === 1 ? "" : "s"}</span>
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
      {hasSkills && !due && (
        <details className="rd-add">
          <summary className="btn btn-sm">Refresh postings now</summary>
          <RefreshPanel role={card.role} label="Find fresh postings and re-score" primary={false} parton={card.parton} />
        </details>
      )}
      <details className="rd-add rd-manual">
        <summary className="hint">Or add a posting yourself</summary>
        {card.postings.length < POSTINGS_MAX
          ? <PostingForm count={card.postings.length} />
          : <p className="hint">There are already {POSTINGS_MAX} postings. Remove one first.</p>}
        {card.stale && hasSkills && (
          <ExtractButton count={card.postings.length} hasSkills={hasSkills} stale={card.stale} parton={card.parton} />
        )}
      </details>
      {card.stale && !hasSkills && card.postings.length > 0 && (
        <ExtractButton count={card.postings.length} hasSkills={hasSkills} stale parton={card.parton} />
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
              <p className="stat-note">{card.lastCheck ? `Last read ${dateFmt.format(card.lastCheck)}. Runs by itself` : "After Parton first reads postings"}</p>
            </div>
          </section>
        )}

        {due && (
          <section className="rd-due" aria-label="Quarterly re-check">
            <p><Pill tone="accent" icon="clock">Quarterly re-check due</Pill></p>
            <p>
              It has been over three months since the postings were last read, and postings change. Frontier runs this
              re-check by itself overnight; run it now if you don&apos;t want to wait. Your levels and evidence stay.
            </p>
            <RefreshPanel role={card.role} label={`Run the ${quarterLabel(new Date())} re-check`} parton={card.parton} />
          </section>
        )}

        {!hasSkills && (
          <section className="rd-start" aria-label="Get started">
            <h2>Build your scorecard</h2>
            <p className="desc">
              Nothing to paste. Say which role you are aiming for, and Parton finds current postings for it, picks out the
              skills they keep asking for, and lays them out for you to score.
            </p>
            <RefreshPanel role={card.role} label="Find postings and build the scorecard" parton={card.parton} />
          </section>
        )}

        {!hasSkills && postings}

        {hasSkills && (dirty || card.unconfirmed > 0) && (
          <section className="rd-confirm" aria-label="Parton's scores">
            <ScorePanel auto={dirty && !card.stale} parton={card.parton} />
            {card.unconfirmed > 0 && (
              <form action={confirmLevelAction} className="rd-confirm-all">
                <p>
                  Parton scored {card.unconfirmed} skill{card.unconfirmed === 1 ? "" : "s"} from the evidence it found in Frontier.
                  Check each below and correct any that are wrong, or confirm them all.
                </p>
                <button type="submit" className="btn btn-sm">Confirm all of Parton&apos;s scores</button>
              </form>
            )}
          </section>
        )}

        {gaps.length > 0 && (
          <section className="rd-block" aria-labelledby="rd-gaps">
            <div className="rd-block-head">
              <div>
                <h2 id="rd-gaps">Close the gaps</h2>
                <p className="desc">The skills holding you back most: asked for often, and short of Built. Each has the step Parton thinks will raise it fastest.</p>
              </div>
            </div>
            <ol className="rd-gaps">
              {gaps.map((s) => (
                <li key={s.id}>
                  <div className="rd-gap-head">
                    <a href={`#skill-${s.id}`} className="rd-gap-name">{s.name}</a>
                    <span className="mono-meta">{LEVELS[s.level].label} · {s.frequency} of {s.postingCount} postings</span>
                  </div>
                  {s.next ? <NextLine next={s.next} /> : <p className="hint">Parton hasn&apos;t picked a next step for this yet.</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {card.compared && moved.length > 0 && (
          <section className="rd-block" aria-labelledby="rd-moved">
            <div className="rd-block-head">
              <div>
                <h2 id="rd-moved">What changed this quarter</h2>
                <p className="desc">Skills that are new in the latest postings, asked for noticeably more or less, or no longer asked for, compared with the check before.</p>
              </div>
            </div>
            <ul className="rd-moved">
              {(["new", "rising", "fading", "gone"] as Trend[]).flatMap((t) => moved.filter((s) => s.trend === t)).map((s) => (
                <li key={s.id}>
                  <TrendPill trend={s.trend!} />
                  <a href={`#skill-${s.id}`}>{s.name}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasSkills && (
          <section className="rd-block" aria-labelledby="rd-skills">
            <div className="rd-block-head">
              <div>
                <h2 id="rd-skills">Skills</h2>
                <p className="desc">
                  Most asked for first. Parton attaches evidence from your passed drills, published projects and mastered
                  lessons, and scores each skill from it; you confirm or correct the score. A level above Studied counts only when evidence backs it:{" "}
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
                <p className="desc">Each time Parton read the postings. Frontier finds fresh postings and re-reads them by itself every quarter, because postings change.</p>
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
          </section>
        )}
      </main>
    </div>
  );
}

const TREND_TONE: Record<Trend, "accent" | "success" | "danger" | "muted"> = { new: "accent", rising: "success", fading: "danger", gone: "muted" };

function TrendPill({ trend }: { trend: Trend }) {
  return <Pill tone={TREND_TONE[trend]}>{TREND_LABELS[trend]}</Pill>;
}

const NEXT_LABEL: Record<NextStep["kind"], string> = { lesson: "Lesson", drill: "Drill", project: "Project idea" };

function NextLine({ next }: { next: NextStep }) {
  return (
    <p className="rd-next">
      <span className="rd-kind">{NEXT_LABEL[next.kind]}</span>
      <Link href={nextHref(next)}>{next.title}</Link>
      {next.why && <span className="rd-next-why">{next.why}</span>}
    </p>
  );
}

function PartonScore({ skill: s }: { skill: Skill }) {
  if (s.suggested === null) return null;
  const label = LEVELS[s.suggested]?.label ?? "None";
  if (s.levelSource === "parton") {
    return (
      <form action={confirmLevelAction} className="rd-parton">
        <input type="hidden" name="skill" value={s.id} />
        <p><strong>Parton&apos;s score: {label}.</strong> {s.reason}</p>
        <div className="rd-parton-actions">
          <button type="submit" className="btn btn-sm">Confirm</button>
          <span className="hint">or pick the right level above to correct it</span>
        </div>
      </form>
    );
  }
  if (s.suggested !== s.claimed) {
    return (
      <form action={acceptSuggestionAction} className="rd-parton">
        <input type="hidden" name="skill" value={s.id} />
        <p><strong>Parton now scores this {label}.</strong> {s.reason}</p>
        <div className="rd-parton-actions">
          <button type="submit" className="btn btn-sm">Use {label}</button>
          <span className="hint">or keep your level</span>
        </div>
      </form>
    );
  }
  return s.reason ? <p className="rd-parton rd-parton-quiet"><span className="hint">Parton agrees: {s.reason}</span></p> : null;
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
          {s.trend && <TrendPill trend={s.trend} />}
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
      <PartonScore skill={s} />

      <div className="rd-evidence">
        {s.evidence.length > 0 ? (
          <ul>
            {s.evidence.map((e) => (
              <li key={e.id}>
                <span className="rd-kind">{evidenceLabel(e.kind)}</span>
                {e.url ? (
                  e.url.startsWith("/") ? <Link href={e.url}>{e.title}</Link> : <a href={e.url} target="_blank" rel="noreferrer noopener">{e.title}</a>
                ) : <span>{e.title}</span>}
                {e.auto && <span className="mono-meta" title="Found by Parton in Frontier">auto</span>}
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
        {s.next && <NextLine next={s.next} />}
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
