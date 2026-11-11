import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { FunctionViz } from "@/components/viz/FunctionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.7.1",
  minutes: 60,
  links: {
    revisits: ["m0.3.1", "m1.6.1"],
    foreshadows: ["m2.3.1"],
  },

  puzzle: (
    <>
      <p>
        At school a function was a formula, such as <M>{"f(x) = x^2 + 1"}</M>. But consider the rule that sends each student
        in a class to their roll number, or each Indian state to its capital. No formula is involved, yet each is surely a
        function.
      </p>
      <p>
        And are <M>{"f(x) = (x + 1)^2"}</M> and <M>{"g(x) = x^2 + 2x + 1"}</M> the same function or two different ones, given
        that the formulas differ? What is a function, if not a formula?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What matters about a function is not how its values are computed but which output goes with each input. So, just as
        with relations, mathematics defines a function to be its list of input and output pairs. A function from A to B is a
        relation in which every element of A is paired with <em>exactly one</em> element of B.
      </p>
      <p>
        In the arrow diagrams below, that means every dot on the left sends out exactly one arrow. Try the four examples, then
        click dots on the left to change their arrows.
      </p>
      <FunctionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="function">
        <p>
          A <strong>function</strong> f from A to B, written <M>{"f : A \\to B"}</M>, is a relation{" "}
          <M>{"f \\subseteq A \\times B"}</M> such that for every <M>{"a \\in A"}</M> there is exactly one{" "}
          <M>{"b \\in B"}</M> with <M>{"(a, b) \\in f"}</M>. We write <M>{"f(a) = b"}</M>. The set A is the{" "}
          <strong>domain</strong> and B the <strong>codomain</strong>.
        </p>
      </Definition>

      <Remark title="exactly one, in two parts">
        <p>&ldquo;Exactly one&rdquo; contains two conditions, and both can fail:</p>
        <ul>
          <li><strong>existence</strong>: every <M>{"a \\in A"}</M> has at least one partner;</li>
          <li><strong>uniqueness</strong>: no <M>{"a \\in A"}</M> has two different partners.</li>
        </ul>
        <p>
          Nothing is required of B. An element of B may be the partner of many elements of A, or of none.
        </p>
      </Remark>

      <Definition title="equality of functions">
        <p>
          Two functions <M>{"f, g : A \\to B"}</M> are <strong>equal</strong> if <M>{"f(a) = g(a)"}</M> for every{" "}
          <M>{"a \\in A"}</M>. Since a function is a set of pairs, this is just equality of sets. So{" "}
          <M>{"(x + 1)^2"}</M> and <M>{"x^2 + 2x + 1"}</M> define the same function on the real numbers: two formulas, one
          function.
        </p>
      </Definition>

      <Example title="is it well defined?">
        <p>
          Try to define <M>{"f : \\mathbb{Q} \\to \\mathbb{Z}"}</M> by <M>{"f(p/q) = p"}</M>. Then
        </p>
        <MD>{"f\\left(\\tfrac12\\right) = 1 \\quad\\text{but}\\quad f\\left(\\tfrac24\\right) = 2,"}</MD>
        <p>
          although <M>{"\\tfrac12 = \\tfrac24"}</M>. The rule gives one input two outputs, so it fails uniqueness: it is{" "}
          <strong>not well defined</strong>. Whenever a rule refers to a particular way of writing its input, check that the
          answer does not depend on that choice.
        </p>
      </Example>

      <Example title="the domain matters">
        <p>
          The rule <M>{"x \\mapsto 1/x"}</M> is not a function from <M>{"\\mathbb{R}"}</M> to <M>{"\\mathbb{R}"}</M>, since 0
          has no partner: existence fails. It is a function from <M>{"\\mathbb{R} \\setminus \\{0\\}"}</M> to{" "}
          <M>{"\\mathbb{R}"}</M>. Similarly <M>{"x \\mapsto \\sqrt x"}</M> needs the domain <M>{"[0, \\infty)"}</M>. A
          function is not complete until its domain and codomain are specified.
        </p>
      </Example>

      <Remark title="graphs">
        <p>
          The set of pairs <M>{"\\{(x, f(x))\\}"}</M> is exactly what you draw when you sketch the graph of f. The school test
          &ldquo;every vertical line meets the graph at most once&rdquo; is uniqueness, and for a function on all of{" "}
          <M>{"\\mathbb{R}"}</M>, &ldquo;exactly once&rdquo; is the definition above.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which-fn",
      rung: "check",
      prompt: <p>Which of these relations from <M>{"\\{1, 2, 3\\}"}</M> to <M>{"\\{a, b\\}"}</M> are functions?</p>,
      answer: {
        kind: "choice",
        options: ["{(1, a), (2, a), (3, a)}", "{(1, a), (2, b)}", "{(1, a), (1, b), (2, a), (3, b)}", "{(1, b), (2, a), (3, b)}"],
        correct: [0, 3],
      },
    },
    {
      key: "count-fns",
      rung: "check",
      prompt: <p>How many functions are there from a set with 3 elements to a set with 2 elements?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "count-fns-2",
      rung: "apply",
      prompt: <p>How many functions are there from a set with 2 elements to a set with 3 elements?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "domain",
      rung: "apply",
      prompt: <p>What is the largest subset of <M>{"\\mathbb{R}"}</M> on which <M>{"x \\mapsto 1/(x^2 - 4)"}</M> defines a real-valued function?</p>,
      answer: { kind: "choice", options: ["ℝ", "ℝ ∖ {2}", "ℝ ∖ {−2, 2}", "(2, ∞)"], correct: [2] },
    },
    {
      key: "well-defined",
      rung: "apply",
      prompt: <p>Which of these rules on fractions p/q (in any form, with q ≠ 0) are well defined?</p>,
      answer: {
        kind: "choice",
        options: ["p/q ↦ p + q", "p/q ↦ p/q + 1", "p/q ↦ 2p/q", "p/q ↦ q"],
        correct: [1, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = {(1, 'a'), (2, 'b'), (3, 'a')}
g = {(1, 'a'), (1, 'b'), (2, 'c')}
is_function = lambda R, A: all(sum(1 for (x, y) in R if x == a) == 1 for a in A)
print(is_function(f, {1, 2, 3}), is_function(g, {1, 2}))`}</Code>
          <p>Which of the relations f and g is a function on its domain?</p>
        </>
      ),
      answer: { kind: "choice", options: ["f only", "g only", "Both", "Neither"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`R = {(1, 'a'), (2, 'b'), (2, 'c'), (4, 'a')}
A = {1, 2, 3, 4}
outs = {a: [b for x, b in R if x == a] for a in A}
print(sorted(a for a in A if len(outs[a]) != 1))`}</Code>
          <p>Which elements of A stop this relation from being a function from A?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2, 3]", "[2]", "[3]", "[1, 4]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>as_function(R, A)</C>, which returns a dict mapping each a in A to its single partner if the relation R (a set of pairs) is a function on A, and <C>None</C> otherwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def as_function(R, A):
    return dict(R)
`,
        solution: `def as_function(R, A):
    out = {}
    for a in A:
        ys = [y for (x, y) in R if x == a]
        if len(ys) != 1:
            return None
        out[a] = ys[0]
    return out
`,
        tests: [
          { name: "function", code: `assert as_function({(1, 'a'), (2, 'b'), (3, 'a')}, {1, 2, 3}) == {1: 'a', 2: 'b', 3: 'a'}, 'Each input has exactly one output.'` },
          { name: "two outputs", code: `assert as_function({(1, 'a'), (1, 'b')}, {1}) is None, '1 has two partners: not a function.'` },
          { name: "missing", code: `assert as_function({(1, 'a')}, {1, 2}) is None, '2 has no partner: not a function on {1, 2}.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_relations(m, n)</C>, the number of relations from an m-element set to an n-element set (2^(mn)), and <C>count_functions(m, n)</C> (nᵐ). Then write <C>random_function_check(m, n, trials, seed)</C>, which seeds <C>random</C>, draws <C>trials</C> relations by including each of the mn pairs independently with probability ½, and returns the fraction that are functions. Its expected value is nᵐ/2^(mn), which the tests compare against.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_relations(m, n):
    return m * n

def count_functions(m, n):
    return m ** n

def random_function_check(m, n, trials, seed):
    return 0.0
`,
        solution: `import random

def count_relations(m, n):
    return 2 ** (m * n)

def count_functions(m, n):
    return n ** m

def random_function_check(m, n, trials, seed):
    random.seed(seed)
    hits = 0
    for _ in range(trials):
        ok = True
        for a in range(m):
            k = sum(random.random() < 0.5 for _ in range(n))
            if k != 1:
                ok = False
        hits += ok
    return hits / trials
`,
        tests: [
          { name: "counts", code: `assert count_relations(2, 3) == 64 and count_functions(2, 3) == 9 and count_functions(3, 2) == 8 and count_functions(0, 5) == 1, 'Each input chooses one of n outputs.'` },
          { name: "brute", code: `from itertools import product
m, n = 2, 2
rels = [frozenset(p for p, keep in zip(product(range(m), range(n)), bits) if keep) for bits in product([0, 1], repeat=m * n)]
funcs = [R for R in rels if all(sum(1 for a, b in R if a == x) == 1 for x in range(m))]
assert len(rels) == count_relations(m, n) and len(funcs) == count_functions(m, n), 'Count by listing them all.'` },
          { name: "simulate", code: `f = random_function_check(2, 2, 20000, 1)
assert abs(f - 4 / 16) < 0.015, f'Expected about 0.25, got {f}.'` },
          { name: "seeded", code: `assert random_function_check(3, 2, 2000, 7) == random_function_check(3, 2, 2000, 7), 'Seed the generator.'` },
        ],
      },
    },
    {
      key: "relation-count",
      rung: "prove",
      prompt: (
        <p>
          Explain why there are <M>{"n^m"}</M> functions from a set with m elements to a set with n elements, and use this to
          explain why there is exactly one function from the empty set to any set.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that a function is fixed by choosing one image for each element of the domain.",
          "Uses the multiplication principle to get n · n · … · n = nᵐ.",
          "Sets m = 0 to get n⁰ = 1.",
          "Identifies the one function as the empty set of pairs, which satisfies the definition vacuously.",
        ],
      },
    },
    {
      key: "mod-defined",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"[a]"}</M> be the class of a under congruence modulo 6. Is <M>{"[a] \\mapsto [2a]"}</M> a well-defined
          function on the classes modulo 6? What about <M>{"[a] \\mapsto [a]"}</M> into the classes modulo 4? Prove or
          disprove each.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "For the first, assumes a ≡ b (mod 6) and shows 2a ≡ 2b (mod 6), so it is well defined.",
          "For the second, finds a counterexample such as 0 ≡ 6 (mod 6) but 0 ≢ 6 (mod 4).",
          "Explains that well-definedness means the output does not depend on the chosen representative.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why a function is defined as a set of pairs rather than a formula, and what 'well defined' means, using 1/2 = 2/4.",

  glimpse: (
    <p>
      Some functions never send two inputs to one output; some reach every possible output. Those that do both can be undone, and they are the subject of the next lesson. Continuous functions are the heart of Calculus and Real Analysis, and a neural network is, in the end, a function built by composing many simple ones.
    </p>
  ),
};
