import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MaskDistortionViz } from "@/components/viz/MaskDistortionViz";
import type { LessonContent } from "@/lib/types";

const DFA = `import numpy as np

def dfa_step(delta, state, s):
    for ch in s:
        state = delta.get(state, {}).get(ch)
        if state is None:
            return None
    return state

def allowed_mask(delta, state, vocab):
    return np.array([dfa_step(delta, state, tok) is not None for tok in vocab])

def constrained_greedy(logits_fn, delta, start, accept, vocab, eos, max_new):
    state, out = start, []
    for _ in range(max_new):
        mask = allowed_mask(delta, state, vocab)
        mask[eos] = state in accept
        t = int(np.argmax(np.where(mask, np.asarray(logits_fn(out), float), -np.inf)))
        if t == eos:
            break
        out.append(t)
        state = dfa_step(delta, state, vocab[t])
    return out`;

const DIST = `def conditioned(p1, p2, allowed):
    w = {s: p1[s[0]] * p2[s[0]][s[1]] for s in allowed}
    Z = sum(w.values())
    return {s: v / Z for s, v in w.items()}

def masked(p1, p2, allowed):
    Z1 = sum(p1[a] for a in {s[0] for s in allowed})
    out = {}
    for a, b in allowed:
        Z2 = sum(p2[a][c] for c in range(len(p2[a])) if (a, c) in allowed)
        out[(a, b)] = p1[a] / Z1 * p2[a][b] / Z2
    return out

def tv(d1, d2):
    return 0.5 * sum(abs(d1.get(k, 0) - d2.get(k, 0)) for k in set(d1) | set(d2))`;

export const lesson: LessonContent = {
  id: "l5.5.3",
  minutes: 45,
  links: {
    requires: ["l5.5.2"],
    revisits: ["l5.1.1"],
    foreshadows: ["l5.6.4"],
  },

  puzzle: (
    <>
      <p>
        A program asks a model for JSON and gets JSON almost every time, but &quot;almost&quot; breaks the program. We can
        make an invalid output impossible: at every step, forbid the tokens that would break the format. But tokens are
        chunks of several characters, which do not line up with the grammar&apos;s pieces, and forbidding tokens changes the
        distribution we sample from. How is the mask computed, and what does it do to the text the model would have
        written?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Describe the allowed outputs by an automaton that reads characters. At each step, a token is allowed if the
        automaton can read all of its characters from the current state without getting stuck, and the end token is
        allowed only in accepting states. Set the logits of everything else to −∞ and sample as usual. The output is then
        valid by construction. The catch is that the mask acts one step at a time: it cannot tell that an innocent first
        token leads into a corner where the model is forced to write something it considers unlikely.
      </p>
      <MaskDistortionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="automaton-constrained decoding">
        <p>
          A deterministic finite automaton (DFA) has states, a start state, accepting states, and a partial transition map{" "}
          <M>{"\\delta(s, c)"}</M> on characters c. Extend it to strings by reading their characters in turn, undefined if
          any step is. At state s, token t is <em>allowed</em> if <M>{"\\delta(s, t)"}</M> is defined, and ⟨eos⟩ is allowed if s
          is accepting. Regular expressions and, with a stack, grammars such as JSON compile to such machines.
        </p>
        <Code>{DFA}</Code>
      </Definition>

      <Theorem title="masking guarantees validity">
        <p>
          Suppose every state of the DFA can reach an accepting state, and every single character the DFA uses is a token.
          Then masked decoding is never stuck, and every output it ends with ⟨eos⟩ is in the language.
        </p>
      </Theorem>
      <Proof>
        <p>
          The state after each step is defined, because only tokens with a defined transition are allowed. From a
          non-accepting state some character leads towards an accepting state, and it is a token, so some token is allowed;
          from an accepting state ⟨eos⟩ is. ⟨eos⟩ is chosen only in accepting states, and the string read so far is exactly
          the concatenation of the chosen tokens, so it is accepted. Without the first condition the mask could walk into a
          dead state from which nothing is allowed, which is why automata are trimmed first.
        </p>
      </Proof>

      <Theorem title="masking is not conditioning">
        <p>
          Let <M>{"Z_t(y_{<t})"}</M> be the probability the model gives to the allowed tokens at step t. Masked sampling
          produces y with probability <M>{"q(y) = p(y)/\\prod_tZ_t(y_{<t})"}</M>, whereas the model conditioned on the language
          L gives <M>{"p(y)/p(L)"}</M>. The two agree for all valid y exactly when <M>{"\\prod_tZ_t"}</M> is the same for every
          valid y.
        </p>
      </Theorem>
      <Proof>
        <p>
          Masking renormalises each step: the token <M>{"y_t"}</M> is drawn with probability{" "}
          <M>{"p(y_t \\mid y_{<t})/Z_t(y_{<t})"}</M>, and the chain rule multiplies these. Both q and the conditional are
          distributions on the valid outputs, proportional to p(y) with factors <M>{"1/\\prod_tZ_t"}</M> and 1/p(L), so they
          coincide exactly when the first factor is constant, in which case it equals 1/p(L). Prefixes that lead to cramped
          continuations have small <M>{"Z_t"}</M> and get boosted, as the picture shows.
        </p>
        <Code>{DIST}</Code>
      </Proof>

      <Remark title="tokens against characters">
        <p>
          Since tokens span several characters, the allowed set depends on the whole token, and different tokenisations of
          the same text can be allowed or not; checking every token at every step costs time proportional to the
          vocabulary, so libraries precompute, for every automaton state, the set of allowed tokens. A constraint that
          splits a word the model usually writes as one token, such as forcing a space before it, can also push the model
          into tokenisations it rarely saw. Writing the format into the prompt as well as the mask keeps the two
          distributions close, because the model then puts little probability on invalid continuations to begin with.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mass",
      rung: "check",
      prompt: <p>At three successive steps the allowed tokens carry probabilities 0.5, 0.8 and 0.25. By what factor does masked sampling multiply the model&apos;s probability of the resulting output?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 1e-9 },
    },
    {
      key: "tvpic",
      rung: "check",
      prompt: <p>In the picture&apos;s model with p(A first) = 0.5 and p(B after A) = 0.9, what is the probability of AA under the conditioned distribution? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0909, tolerance: 0.00006 },
    },
    {
      key: "dead",
      rung: "apply",
      prompt: <p>Why must the automaton be trimmed so that every state can still reach an accepting state?</p>,
      answer: {
        kind: "choice",
        options: [
          "Otherwise the mask may allow a token that leads to a state from which no completion is possible, leaving nothing allowed later",
          "Otherwise the automaton would accept strings outside the language",
          "Trimming makes the logits smaller",
          "Untrimmed automata cannot be stored as tables",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dfa_step(delta, state, s):
    for ch in s:
        state = delta.get(state, {}).get(ch)
        if state is None:
            return None
    return state

def allowed_mask(delta, state, vocab):
    return np.array([dfa_step(delta, state, tok) is not None for tok in vocab])

def constrained_greedy(logits_fn, delta, start, accept, vocab, eos, max_new):
    state, out = start, []
    for _ in range(max_new):
        mask = allowed_mask(delta, state, vocab)
        mask[eos] = state in accept
        t = int(np.argmax(np.where(mask, np.asarray(logits_fn(out), float), -np.inf)))
        if t == eos:
            break
        out.append(t)
        state = dfa_step(delta, state, vocab[t])
    return out

delta = {0: {"y": 1, "n": 4}, 1: {"e": 2}, 2: {"s": 3}, 4: {"o": 5}}; vocab = ["ye", "s", "no", "y", "yes!", "", "n", "es"]
print(allowed_mask(delta, 0, vocab).astype(int).tolist(), dfa_step(delta, 0, "yes"), dfa_step(delta, 0, "yes!"))
z = lambda out: [0.0, 0.0, 1.0, 2.0, 5.0, 3.0, 0.0, 1.0]; print(constrained_greedy(z, delta, 0, {3, 5}, vocab, 5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 1, 1, 0, 1, 1, 0] 3 None\n[3, 7]",
          "[1, 0, 1, 1, 1, 1, 1, 0] 3 3\n[4]",
          "[1, 0, 1, 1, 0, 1, 1, 0] 3 None\n[0, 1]",
          "[1, 0, 1, 1, 0, 0, 1, 0] 3 None\n[2]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def conditioned(p1, p2, allowed):
    w = {s: p1[s[0]] * p2[s[0]][s[1]] for s in allowed}
    Z = sum(w.values())
    return {s: v / Z for s, v in w.items()}

def masked(p1, p2, allowed):
    Z1 = sum(p1[a] for a in {s[0] for s in allowed})
    out = {}
    for a, b in allowed:
        Z2 = sum(p2[a][c] for c in range(len(p2[a])) if (a, c) in allowed)
        out[(a, b)] = p1[a] / Z1 * p2[a][b] / Z2
    return out

def tv(d1, d2):
    return 0.5 * sum(abs(d1.get(k, 0) - d2.get(k, 0)) for k in set(d1) | set(d2))

p1, p2 = [0.9, 0.1], [[0.01, 0.99], [0.5, 0.5]]; allowed = {(0, 0), (1, 0), (1, 1)}
c, m = conditioned(p1, p2, allowed), masked(p1, p2, allowed); print(round(c[(0, 0)], 4), round(m[(0, 0)], 4), round(tv(c, m), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0826 0.9 0.8174", "0.0826 0.009 0.0736", "0.9 0.9 0.0", "0.0826 0.9 1.6348"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With the DFA given as nested dicts <C>delta[state][char]</C>, write <C>dfa_step(delta, state, s)</C>, returning the
          state after reading the string s or None; <C>allowed_mask(delta, state, vocab)</C>, a boolean array over the
          vocabulary; and <C>constrained_greedy(logits_fn, delta, start, accept, vocab, eos, max_new)</C>, returning the list
          of token ids chosen before ⟨eos⟩, with ⟨eos⟩ allowed only in accepting states.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dfa_step(delta, state, s):
    return state

def allowed_mask(delta, state, vocab):
    return np.ones(len(vocab), bool)

def constrained_greedy(logits_fn, delta, start, accept, vocab, eos, max_new):
    return []
`,
        solution: DFA,
        tests: [
          { name: "dfa", code: `delta = {0: {"y": 1, "n": 4}, 1: {"e": 2}, 2: {"s": 3}, 4: {"o": 5}}; vocab = ["ye", "s", "no", "y", "yes!", "", "n", "es"]
assert dfa_step(delta, 0, "yes") == 3 and dfa_step(delta, 0, "yes!") is None and dfa_step(delta, 2, "") == 2 and dfa_step(delta, 9, "a") is None
assert allowed_mask(delta, 0, vocab).tolist() == [True, False, True, True, False, True, True, False] and allowed_mask(delta, 1, vocab).tolist() == [False] * 5 + [True, False, True]` },
          { name: "greedy", code: `delta = {0: {"y": 1, "n": 4}, 1: {"e": 2}, 2: {"s": 3}, 4: {"o": 5}}; vocab = ["ye", "s", "no", "y", "yes!", "", "n", "es"]
assert constrained_greedy(lambda o: [0.0, 0, 1, 2, 5, 3, 0, 1], delta, 0, {3, 5}, vocab, 5, 5) == [3, 7]
assert constrained_greedy(lambda o: [0.0, 0, 3, 2, 5, 9, 0, 1], delta, 0, {3, 5}, vocab, 5, 5) == [2]
D = {0: {"a": 0, "b": 1}, 1: {"a": 0}}; V = ["a", "b", "ab", "<e>"]
out = constrained_greedy(lambda o: [2.0, 0.0 if o else 5.0, 1.0, 3.0], D, 0, {0}, V, 3, 4); assert out == [1, 0]
assert constrained_greedy(lambda o: [2.0, 5.0, 1.0, -1.0], D, 0, {0}, V, 3, 4) == [1, 0, 1, 0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a two-step model with first-token probabilities <C>p1</C> and second-token tables <C>p2[a]</C>, and a set of
          allowed pairs, write <C>conditioned(p1, p2, allowed)</C>, <C>masked(p1, p2, allowed)</C>, each a dict from pair to
          probability (the first step allows the first tokens of allowed pairs), and <C>tv(d1, d2)</C>, their total
          variation distance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def conditioned(p1, p2, allowed):
    return {s: 1 / len(allowed) for s in allowed}

def masked(p1, p2, allowed):
    return {s: 1 / len(allowed) for s in allowed}

def tv(d1, d2):
    return 0.0
`,
        solution: DIST,
        tests: [
          { name: "toy", code: `p1, p2 = [0.9, 0.1], [[0.01, 0.99], [0.5, 0.5]]; allowed = {(0, 0), (1, 0), (1, 1)}
c, m = conditioned(p1, p2, allowed), masked(p1, p2, allowed)
assert abs(c[(0, 0)] - 0.009 / 0.109) < 1e-12 and abs(m[(0, 0)] - 0.9) < 1e-12 and abs(m[(1, 1)] - 0.05) < 1e-12
assert abs(tv(c, m) - (0.9 - 0.009 / 0.109)) < 1e-12 and tv({"a": 1.0}, {"b": 1.0}) == 1.0` },
          { name: "agree", code: `p1, p2 = [0.3, 0.7], [[0.2, 0.8], [0.6, 0.4]]; full = {(a, b) for a in range(2) for b in range(2)}
assert tv(conditioned(p1, p2, full), masked(p1, p2, full)) < 1e-12 and abs(sum(masked(p1, p2, {(0, 1), (1, 1)}).values()) - 1) < 1e-12
assert abs(tv(conditioned(p1, p2, {(0, 1), (1, 0)}), masked(p1, p2, {(0, 1), (1, 0)})) - abs(0.24 / 0.66 - 0.3)) < 1e-12` },
        ],
      },
    },
    {
      key: "pl",
      rung: "stretch",
      prompt: <p>In the picture&apos;s model with p(A first) = 0.9 and p(B after A) = 0.99, what is the total probability p(L) the model puts on the allowed outputs? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.109, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        That finishes decoding. The last part asks what trained language models actually do with their context, starting
        with the most surprising behaviour of all: learning a new task from a few examples in the prompt.
      </p>
    </>
  ),
};
