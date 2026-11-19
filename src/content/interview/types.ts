/**
 * A mock interview question, in one of five modes. Each question waits for the lessons it rests on: it opens only
 * once every one of them is mastered through Learn, so an interview never asks about an idea before it has been
 * taught. Each rubric criterion names the lessons behind it, so a weak score sends the learner back to them.
 */
export type InterviewMode = "coding" | "fundamentals" | "research" | "design" | "values";

/** What a question needs from the learner's own work, beyond mastered lessons. */
export type Need =
  /** A project with at least one experiment result recorded, so there is something real to walk through. */
  | { kind: "project" }
  /** A Readiness check of real postings, so "why this lab, why this role" has an answer to aim at. */
  | { kind: "readiness" };

export type Criterion = {
  /** Stable within the question: scores are stored against it. */
  id: string;
  /** What a strong answer does, in one sentence. Shown with the score after the interview. */
  text: string;
  /**
   * The lessons a weak score here sends the learner back to. Each must be one the question waits for or one those
   * lessons require, so it never points at a lesson the learner could not yet take. Empty for criteria no lesson
   * teaches, such as how clearly an answer is told.
   */
  lessons: string[];
};

export type InterviewQuestion = {
  /** Never change once answers exist: they are stored against it. */
  id: string;
  mode: InterviewMode;
  /** What the interviewer asks, word for word. */
  prompt: string;
  /** The lessons the question rests on. It opens once all are mastered. */
  lessons: string[];
  needs?: Need[];
  /** Roughly how long a good spoken answer takes, in minutes. */
  minutes: number;
  rubric: Criterion[];
  /** For the interviewer only: what a strong answer covers, so it can probe the gaps. Never shown before scoring. */
  notes: string;
  /** Coding questions: what the editor opens with. */
  starter?: string;
  /** Coding questions: a reference solution, for the tests and for the scorer. */
  solution?: string;
  /** Coding questions: Python checks run in the browser on the learner's code when they hand it in. */
  checks?: { name: string; code: string }[];
};
