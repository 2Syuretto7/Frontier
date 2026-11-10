import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { EXERCISES, GRAPH, LESSON_BY_ID, exerciseId } from "@/lib/curriculum";
import { connections, isUnlocked } from "@/lib/graph";
import { exerciseStates, latestTeachBack, masteredSet, masteryReport, recallFor, startLesson } from "@/lib/learning";
import { toView } from "@/lib/views";
import { TopBar } from "@/components/TopBar";
import { ExerciseCard } from "@/components/lesson/ExerciseCard";
import { TeachBack } from "@/components/lesson/TeachBack";
import { MasteryBanner } from "@/components/lesson/MasteryBanner";
import { PartonPanel } from "@/components/parton/PartonPanel";
import { LessonRail } from "@/components/lesson/LessonRail";
import { Pill } from "@/components/ui/Pill";
import { ArrowLeft, Lock } from "@/components/ui/Icons";
import { conversation, latestTeachBackReview, partonConnected, renderReview } from "@/lib/parton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return { title: GRAPH.nodes.get(lessonId)?.title ?? "Lesson" };
}
// Parton marks written work with careful thought; give those requests room.
export const maxDuration = 300;

const SECTIONS = [
  ["recall", "Recall"],
  ["puzzle", "Puzzle"],
  ["intuition", "Intuition"],
  ["theory", "Theory"],
  ["practice", "Practice"],
  ["teach", "Teach it back"],
  ["connections", "Connections"],
] as const;

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  await requireOwner();
  const { lessonId } = await params;
  const lesson = LESSON_BY_ID.get(lessonId);
  const node = GRAPH.nodes.get(lessonId);
  if (!lesson || !node) notFound();

  const mastered = await masteredSet();
  if (!mastered.has(lessonId) && !isUnlocked(GRAPH, lessonId, mastered)) {
    const missing = (GRAPH.requires.get(lessonId) ?? []).filter((r) => !mastered.has(r)).map((r) => GRAPH.nodes.get(r)!);
    return (
      <div className="shell">
        <TopBar />
        <main id="main" className="page">
          <Link href={`/map/${node.course.toLowerCase()}`} className="back"><ArrowLeft size={14} /> {node.courseTitle}</Link>
          <p className="eyebrow">{node.course} · Chapter {node.chapter}, {node.chapterTitle}</p>
          <h1 className="lesson-title">{node.title}</h1>
          <p className="lede">This lesson opens once you have mastered the ideas it rests on.</p>
          <div className="locked-panel">
            <div className="panel-bar"><span className="mono-tag">Requires</span><Pill tone="muted" icon="lock">Locked</Pill></div>
            <ul>
              {missing.map((m) => (
                <li key={m.id}>
                  {LESSON_BY_ID.has(m.id) ? <Link href={`/learn/${m.id}`} className="text-link">{m.title}</Link> : <span>{m.title}</span>}
                  <span className="mono-meta">{m.course}</span>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    );
  }

  await startLesson(lessonId);
  const recall = await recallFor(lessonId, mastered);
  const states = await exerciseStates([lessonId, ...new Set(recall.map((r) => r.lessonId))]);
  const [teach, report, chat, teachReview] = await Promise.all([
    latestTeachBack(lessonId),
    masteryReport(lessonId),
    conversation(lessonId),
    latestTeachBackReview(lessonId),
  ]);
  const connected = partonConnected();
  const links = connections(GRAPH, lessonId);
  const sections = SECTIONS.filter(([id]) => id !== "recall" || recall.length > 0);
  const linkItem = (id: string) => {
    const n = GRAPH.nodes.get(id)!;
    const label = <>{n.title} <span className="muted">· {n.course}</span></>;
    return <li key={id}>{LESSON_BY_ID.has(id) ? <Link href={`/learn/${id}`}>{label}</Link> : label}</li>;
  };
  const required = lesson.practice.filter((e) => e.rung !== "stretch");

  return (
    <div className="shell">
      <TopBar />
      <div className="reading-progress" aria-hidden="true"><span /></div>
      <div className="lesson-layout">
        <LessonRail sections={sections.map(([id, label]) => ({ id, label }))} />
        <main id="main" className="lesson">
          <header className="lesson-head">
            <Link href={`/map/${node.course.toLowerCase()}`} className="back"><ArrowLeft size={14} /> {node.course} {node.courseTitle}</Link>
            <p className="eyebrow">Chapter {node.chapter} · {node.chapterTitle}</p>
            <h1 className="lesson-title">{node.title}</h1>
            <p className="lesson-meta">
              {report.mastered || mastered.has(lessonId)
                ? <Pill tone="success" icon="check">Mastered</Pill>
                : <Pill tone="accent" icon="dot">In progress</Pill>}
              <span>About {lesson.minutes} minutes</span>
              <span>{lesson.practice.length} practice questions</span>
            </p>
          </header>

          {recall.length > 0 && (
            <section id="recall" className="lesson-section">
              <h2><StepChip id="recall" sections={sections} />Recall</h2>
              <p className="section-lede">Before the new idea, bring back the old ones it rests on.</p>
              {recall.map((r) => (
                <ExerciseCard key={r.id} view={toView(r, states.get(r.id))} context="recall">{r.exercise.prompt}</ExerciseCard>
              ))}
            </section>
          )}

          <section id="puzzle" className="lesson-section">
            <h2><StepChip id="puzzle" sections={sections} />Puzzle</h2>
            <div className="prose">{lesson.puzzle}</div>
          </section>

          <section id="intuition" className="lesson-section">
            <h2><StepChip id="intuition" sections={sections} />Intuition</h2>
            <div className="prose">{lesson.intuition}</div>
          </section>

          <section id="theory" className="lesson-section">
            <h2><StepChip id="theory" sections={sections} />Theory</h2>
            <div className="prose">{lesson.theory}</div>
          </section>

          <section id="practice" className="lesson-section">
            <h2><StepChip id="practice" sections={sections} />Practice</h2>
            <p className="section-lede">
              Mastery needs at least 80 percent of the check, apply and prove questions, every written proof or argument accepted by Parton,
              and your teach-back. Stretch questions are optional. So far: {Math.round(report.score * 100)} percent solved
              {required.some((e) => e.answer.kind === "written") && <>, written work {report.writtenDone ? "accepted" : "not yet accepted"}</>}.
            </p>
            {lesson.practice.map((e, i) => {
              const ref = EXERCISES.get(exerciseId(lessonId, e.key))!;
              return (
                <ExerciseCard key={ref.id} index={i + 1} view={toView(ref, states.get(ref.id))} context="lesson">
                  {e.prompt}
                </ExerciseCard>
              );
            })}
          </section>

          <section id="teach" className="lesson-section">
            <h2><StepChip id="teach" sections={sections} />Teach it back</h2>
            <p className="section-lede">If you can explain it simply, you understand it. If you can&rsquo;t, you&rsquo;ve found what to study next.</p>
            <TeachBack lessonId={lessonId} prompt={lesson.teachBack} initial={teach} connected={connected}
              initialReview={teachReview ? renderReview(teachReview) : null} />
          </section>

          <section id="connections" className="lesson-section">
            <h2><StepChip id="connections" sections={sections} />Connections</h2>
            <div className="prose">{lesson.glimpse}</div>
            <div className="connections">
              {links.from.length > 0 && <div><h3>Builds on</h3><ul className="plain-list">{links.from.map(linkItem)}</ul></div>}
              {links.parallels.length > 0 && <div><h3>Runs parallel to</h3><ul className="plain-list">{links.parallels.map(linkItem)}</ul></div>}
              {links.leadsTo.length > 0 && <div><h3>Leads to</h3><ul className="plain-list">{links.leadsTo.map(linkItem)}</ul></div>}
            </div>
          </section>

          <MasteryBanner initiallyMastered={report.mastered || mastered.has(lessonId)} />
        </main>
        <PartonPanel lessonId={lessonId} lessonTitle={node.title} initial={chat} connected={connected} />
      </div>
    </div>
  );
}

function StepChip({ id, sections }: { id: string; sections: readonly (readonly [string, string])[] }) {
  const n = sections.findIndex(([s]) => s === id) + 1;
  return <span className="step-chip" aria-hidden="true">{String(n).padStart(2, "0")}</span>;
}
