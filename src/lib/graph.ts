import outline from "../content/outline.json";
import type { Course, LinkKind, Track } from "./types";

export type LessonNode = {
  id: string;
  title: string;
  course: string;
  courseTitle: string;
  chapter: number;
  chapterTitle: string;
  index: number;
  track: Track;
  tier: number;
  authored: boolean;
};

export type Edge = { from: string; to: string; kind: LinkKind };

export const COURSES: readonly Course[] = (outline as { courses: Course[] }).courses;
export const COURSE_BY_CODE = new Map(COURSES.map((c) => [c.code, c]));

export type Graph = {
  nodes: Map<string, LessonNode>;
  order: string[];
  /** Lessons each lesson requires (vertical, past to future). */
  requires: Map<string, string[]>;
  /** All links, both implicit and authored. */
  edges: Edge[];
};

/**
 * Builds the lesson graph from the curriculum outline plus the links that
 * authored lessons declare. Implicit "requires" links:
 * - each lesson requires the one before it in its chapter;
 * - a chapter's first lesson requires the previous chapter's last lesson;
 * - a course's first lesson requires the last lesson of every required course.
 */
export function buildGraph(
  authoredLinks: ReadonlyMap<string, Partial<Record<LinkKind, string[]>>>,
): Graph {
  const nodes = new Map<string, LessonNode>();
  const order: string[] = [];
  const requires = new Map<string, string[]>();
  const edges: Edge[] = [];
  const lastLesson = new Map<string, string>();

  for (const course of COURSES) {
    let index = 0;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (nodes.has(lesson.id)) throw new Error(`Duplicate lesson id ${lesson.id}`);
        nodes.set(lesson.id, {
          id: lesson.id,
          title: lesson.title,
          course: course.code,
          courseTitle: course.title,
          chapter: chapter.n,
          chapterTitle: chapter.title,
          index: index++,
          track: course.track,
          tier: course.tier,
          authored: authoredLinks.has(lesson.id),
        });
        order.push(lesson.id);
      }
    }
    const last = course.chapters.at(-1)?.lessons.at(-1);
    if (last) lastLesson.set(course.code, last.id);
  }

  const add = (from: string, to: string, kind: LinkKind) => {
    edges.push({ from, to, kind });
    if (kind === "requires") {
      const list = requires.get(to) ?? [];
      if (!list.includes(from)) list.push(from);
      requires.set(to, list);
    }
  };

  for (const course of COURSES) {
    const ids = course.chapters.flatMap((c) => c.lessons.map((l) => l.id));
    ids.forEach((id, i) => {
      if (i > 0) add(ids[i - 1], id, "requires");
      else for (const code of course.requires) {
        const prior = lastLesson.get(code);
        if (prior) add(prior, id, "requires");
      }
    });
  }

  const errors: string[] = [];
  for (const [id, links] of authoredLinks) {
    if (!nodes.has(id)) errors.push(`Authored lesson ${id} is not in the curriculum outline.`);
    for (const [kind, targets] of Object.entries(links) as [LinkKind, string[]][]) {
      for (const target of targets ?? []) {
        if (!nodes.has(target)) errors.push(`${id} links (${kind}) to unknown lesson ${target}.`);
        else if (target === id) errors.push(`${id} links to itself.`);
        // Links are stored as "from earlier idea to this lesson" for requires/revisits/applies,
        // and "from this lesson to a later one" for foreshadows; parallels are symmetric.
        else if (kind === "foreshadows") add(id, target, kind);
        else add(target, id, kind);
      }
    }
  }

  const cycle = findCycle(order, requires);
  if (cycle) errors.push(`Prerequisite cycle: ${cycle.join(" -> ")}`);
  if (errors.length) throw new Error(`Lesson graph is invalid:\n${errors.join("\n")}`);

  return { nodes, order, requires, edges };
}

function findCycle(order: string[], requires: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    if (state.get(id) === 2) return null;
    if (state.get(id) === 1) return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 1);
    stack.push(id);
    for (const dep of requires.get(id) ?? []) {
      const found = visit(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };
  for (const id of order) {
    const found = visit(id);
    if (found) return found;
  }
  return null;
}

/** A lesson is unlocked when every lesson it requires is mastered. */
export function isUnlocked(graph: Graph, id: string, mastered: ReadonlySet<string>): boolean {
  return (graph.requires.get(id) ?? []).every((r) => mastered.has(r));
}

/** Authored, unlocked, not yet mastered: the lessons you could start now, in curriculum order. */
export function frontier(graph: Graph, mastered: ReadonlySet<string>): LessonNode[] {
  return graph.order
    .map((id) => graph.nodes.get(id)!)
    .filter((n) => n.authored && !mastered.has(n.id) && isUnlocked(graph, n.id, mastered));
}

/** Links touching a lesson, grouped for the Connections section. */
export function connections(graph: Graph, id: string) {
  const back = graph.edges.filter((e) => e.to === id && e.kind !== "foreshadows");
  const ahead = graph.edges.filter((e) => e.from === id);
  const parallels = graph.edges
    .filter((e) => e.kind === "parallels" && (e.from === id || e.to === id))
    .map((e) => (e.from === id ? e.to : e.from));
  return {
    from: [...new Set(back.filter((e) => e.kind !== "parallels").map((e) => e.from))],
    parallels: [...new Set(parallels)],
    leadsTo: [...new Set(ahead.filter((e) => e.kind !== "parallels").map((e) => e.to))],
  };
}
