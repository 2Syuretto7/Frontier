import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LESSONS } from "../src/content/lessons/index.ts";
import { buildGraph } from "../src/lib/graph.ts";
import { checkAnswer } from "../src/lib/check.ts";

const render = (node: unknown) => renderToStaticMarkup(createElement(Fragment, null, node as never));

test("the lesson graph accepts every authored lesson's links", () => {
  assert.doesNotThrow(() => buildGraph(new Map(LESSONS.map((l) => [l.id, l.links ?? {}]))));
});

for (const lesson of LESSONS) {
  test(`${lesson.id} renders, including all its mathematics and visualisations`, () => {
    for (const part of ["puzzle", "intuition", "theory", "glimpse"] as const) {
      const html = render(lesson[part]);
      assert.ok(html.length > 100, `${part} is substantial`);
    }
    for (const e of lesson.practice) render(e.prompt);
  });

  test(`${lesson.id} has a sound practice ladder`, () => {
    const keys = lesson.practice.map((e) => e.key);
    assert.equal(new Set(keys).size, keys.length, "exercise keys are unique");
    for (const rung of ["check", "apply", "prove"] as const) {
      assert.ok(lesson.practice.some((e) => e.rung === rung), `has a ${rung} exercise`);
    }
    assert.ok(lesson.teachBack.length > 40, "has a teach-back prompt");
    for (const e of lesson.practice) {
      const a = e.answer;
      if (a.kind === "choice") {
        assert.ok(a.correct.length > 0 && a.correct.every((i) => i >= 0 && i < a.options.length), `${e.key}: correct options exist`);
        assert.ok(checkAnswer(a, a.correct.join(",")).correct, `${e.key}: its own answer checks`);
      }
      if (a.kind === "numeric") assert.ok(checkAnswer(a, String(a.value)).correct, `${e.key}: its own answer checks`);
      if (a.kind === "expression") assert.ok(checkAnswer(a, a.value).correct, `${e.key}: its own answer checks`);
      if (a.kind === "written") assert.ok(a.rubric.length >= 2, `${e.key}: has a real rubric`);
    }
  });
}
