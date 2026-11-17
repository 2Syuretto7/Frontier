import { test } from "node:test";
import assert from "node:assert/strict";
import { DRILLS } from "../src/content/drills/index.ts";
import { drillTests } from "../src/content/drills/tests.ts";
import { python, runPython } from "./python.ts";

/**
 * Plausible wrong answers each drill's hidden tests must catch: [text in the reference solution, what a learner
 * might write instead, why it is wrong]. A drill whose tests pass one of these is not testing what it claims.
 */
const MUTANTS: Record<string, [string, string, string][]> = {
  attention: [
    ["/ np.sqrt(q.shape[-1])", "", "a solution that forgets to scale the scores"],
    ["x = x - x.max(axis=axis, keepdims=True)\n", "", "a solution with an unstable softmax"],
    ["scores = np.where(mask, scores, -np.inf)", "scores = np.where(mask, scores, 0.0)", "a solution that masks scores to zero instead of minus infinity"],
    ["t.reshape(B, T, n_heads, hd).transpose(0, 2, 1, 3)", "t.reshape(B, n_heads, T, hd)", "a solution that splits heads with a reshape alone"],
    ["causal_mask(T))", "None)", "a solution that forgets the causal mask"],
  ],
  bpe: [
    ["pair = max(counts, key=counts.get)", "pair = max(counts, key=lambda p: (counts[p], p))", "a solution that breaks ties by the larger pair"],
    ["        if counts[pair] < 2:\n            break\n", "", "a solution that never stops early"],
    ["pair = min(present, key=rank.get)", "pair = present[0]", "a solution that merges the first pair present instead of the earliest learned"],
    ['errors="replace"', 'errors="ignore"', "a solution that drops broken bytes"],
  ],
  adamw: [
    ["p -= self.lr * (m / c1) / (np.sqrt(v / c2) + self.eps)", "p = p - self.lr * (m / c1) / (np.sqrt(v / c2) + self.eps)", "a solution that rebinds instead of updating in place"],
    ["(m / c1) / (np.sqrt(v / c2)", "m / (np.sqrt(v)", "a solution without bias correction"],
    ["            p *= 1 - self.lr * self.weight_decay\n", "", "a solution that forgets weight decay"],
    ["m += (1 - self.beta1) * g", "m += (1 - self.beta1) * (g + self.weight_decay * p)", "a solution that uses L2 regularisation instead of decoupled decay"],
    ["        self.t += 1\n", "        self.t = 1\n", "a solution that never advances the step count"],
  ],
  "training-loop": [
    ["d_pre = d_h * (pre > 0)", "d_pre = d_h", "a solution that forgets the ReLU's derivative"],
    ["    d_logits /= n\n", "", "a solution that sums the loss's gradient instead of averaging"],
    ["shifted = logits - logits.max(axis=1, keepdims=True)", "shifted = logits", "a solution with an unstable log-softmax"],
    ["params[k] -= lr * grads[k]", "params[k] += lr * grads[k]", "a solution that steps uphill"],
    ["            losses.append(loss)\n", "        losses.append(loss)\n", "a solution that logs one loss an epoch"],
  ],
  "kv-cache": [
    ["x = model.embed([token], position)", "x = model.embed([token], 0)", "a solution that embeds every new token at position 0"],
    ["attend(q, k, v, causal=True)", "attend(q, k, v, causal=False)", "a solution whose prefill is not causal"],
    ["        new_cache.append((K, V))\n", "        new_cache.append(cache[layer])\n", "a solution that never grows the cache"],
  ],
  lora: [
    ["self.scale = alpha / r", "self.scale = alpha", "a solution that scales by alpha instead of alpha / r"],
    ["self.grad_B = self.scale * g2.T @ h2", "self.grad_B = g2.T @ h2", "a solution that forgets the scale in grad_B"],
    ["grad_x = g2 @ self.W + grad_h @ self.A", "grad_x = g2 @ self.W", "a solution whose input gradient skips the low-rank path"],
    ["return self.W + self.scale * self.B @ self.A", "self.W += self.scale * self.B @ self.A\n        return self.W", "a solution whose merge overwrites the frozen weight"],
    ["self.B = np.zeros((out_features, r))", "self.B = np.ones((out_features, r))", "a solution that starts B away from zero"],
  ],
  ppo: [
    ["running = delta + gamma * lam * live * running", "running = delta + gamma * lam * running", "a solution whose advantages run across episode boundaries"],
    ["next_value = last_value", "next_value = 0.0", "a solution that ignores last_value"],
    ["loss = -np.minimum(unclipped, clipped).mean()", "loss = -np.maximum(unclipped, clipped).mean()", "a solution that takes the maximum instead of the minimum"],
    ["d_new = np.where(unclipped <= clipped, -ratio * advantages / n, 0.0)", "d_new = -ratio * advantages / n", "a solution that never zeroes the clipped gradient"],
    ["return W - lr * obs.T @ d_logits", "W -= lr * obs.T @ d_logits\n    return W", "a solution that changes W in place"],
  ],
};

test("every drill has a unique id, sound metadata and uniquely named tests", () => {
  const ids = DRILLS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, "drill ids are unique");
  for (const d of DRILLS) {
    assert.match(d.id, /^[a-z0-9-]+$/, `${d.id} is URL-safe`);
    assert.ok(d.minutes > 0 && d.minutes <= 90, `${d.id} has a sensible time limit`);
    assert.ok(d.skills.length > 0, `${d.id} names its skills`);
    const names = d.tests.map((t) => t.name);
    assert.ok(names.length >= 3, `${d.id} has at least three hidden tests`);
    assert.equal(new Set(names).size, names.length, `${d.id} test names are unique`);
    assert.ok(!d.starter.includes(d.solution.trim()), `${d.id} starter does not contain the solution`);
  }
});

for (const drill of DRILLS) {
  const tests = drillTests(drill);
  const run = (code: string) => runPython({ code, setup: drill.setup, tests });

  test(`drill ${drill.id}: the reference solution passes every hidden test`, { skip: !python && "python3 is not installed" }, () => {
    const solved = run(drill.solution);
    assert.equal(solved.program.error, null, `the solution runs: ${solved.program.error}`);
    for (const r of solved.tests) assert.ok(r.passed, `the solution passes "${r.name}": ${r.message}`);
  });

  test(`drill ${drill.id}: the starter fails`, { skip: !python && "python3 is not installed" }, () => {
    assert.ok(run(drill.starter).tests.some((r) => !r.passed), "the starter does not already pass every test");
  });

  for (const [from, to, why] of MUTANTS[drill.id] ?? []) {
    test(`drill ${drill.id}: the tests catch ${why}`, { skip: !python && "python3 is not installed" }, () => {
      assert.ok(drill.solution.includes(from), `the mutant's text is in the solution: ${JSON.stringify(from)}`);
      const out = run(drill.solution.replace(from, to));
      assert.ok(out.program.error !== null || out.tests.some((r) => !r.passed), `${why} passes every test`);
    });
  }
}

test("every drill has mutants that its tests catch", () => {
  for (const d of DRILLS) assert.ok((MUTANTS[d.id] ?? []).length >= 2, `${d.id} lists at least two plausible wrong answers`);
});
