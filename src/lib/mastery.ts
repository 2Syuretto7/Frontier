/**
 * A lesson is mastered only when every question in its mastery set (all check and apply questions) has been
 * answered correctly. A partial set, however large, never counts.
 */
export type MasteryReport = { score: number; mastered: boolean };

export function masteryOf(requiredIds: readonly string[], isSolved: (id: string) => boolean): MasteryReport {
  if (requiredIds.length === 0) return { score: 1, mastered: true };
  const solved = requiredIds.filter(isSolved).length;
  return { score: solved / requiredIds.length, mastered: solved === requiredIds.length };
}
