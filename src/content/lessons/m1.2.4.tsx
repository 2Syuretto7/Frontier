import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { NestedViz } from "@/components/viz/NestedViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.2.4",
  minutes: 65,
  links: {
    revisits: ["m0.3.1", "m1.2.2"],
    foreshadows: ["m2.3.4", "m8.5.3"],
  },

  puzzle: (
    <>
      <p>Compare two sentences:</p>
      <ol>
        <li>Everybody loves somebody.</li>
        <li>Somebody is loved by everybody.</li>
      </ol>
      <p>
        They use the same words, &ldquo;every&rdquo;, &ldquo;some&rdquo; and &ldquo;loves&rdquo;. Do they say the same
        thing? Could one be true and the other false? If so, which one is the stronger claim?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the first sentence each person may love someone different: Asha loves Bilal, Bilal loves Chen, Chen loves Asha.
        In the second, one single person is loved by all. The second is far stronger. If it is true, the first is true; but
        the first can be true while the second is false.
      </p>
      <p>
        With L(x, y) for &ldquo;x loves y&rdquo;, the first is <M>{"\\forall x\\, \\exists y\\, L(x, y)"}</M> and the second
        is <M>{"\\exists y\\, \\forall x\\, L(x, y)"}</M>. Only the order of the quantifiers differs. A two-place predicate on a
        small domain can be drawn as a grid: rows for x, columns for y, a lit cell where the predicate holds. Then each
        statement becomes a pattern you can see.
      </p>
      <NestedViz />
    </>
  ),

  theory: (
    <>
      <Definition title="nested quantifiers">
        <p>
          A statement such as <M>{"\\forall x\\, \\exists y\\, R(x, y)"}</M> is read from the left: &ldquo;for every x,
          there is a y such that R(x, y)&rdquo;. The inner part <M>{"\\exists y\\, R(x, y)"}</M> is itself a predicate of x,
          and the outer quantifier then acts on it.
        </p>
      </Definition>

      <Proposition title="when order matters">
        <p>Quantifiers of the same kind can be swapped freely:</p>
        <MD>{"\\forall x\\, \\forall y\\, R \\equiv \\forall y\\, \\forall x\\, R, \\qquad \\exists x\\, \\exists y\\, R \\equiv \\exists y\\, \\exists x\\, R."}</MD>
        <p>Mixed quantifiers cannot. Only one direction holds:</p>
        <MD>{"\\exists y\\, \\forall x\\, R(x, y) \\;\\Longrightarrow\\; \\forall x\\, \\exists y\\, R(x, y)."}</MD>
      </Proposition>
      <Proof>
        <p>
          Suppose some <M>{"y_0"}</M> satisfies <M>{"R(x, y_0)"}</M> for every x. Take any x. Then <M>{"y_0"}</M> itself is a
          y with <M>{"R(x, y)"}</M>, so <M>{"\\exists y\\, R(x, y)"}</M>. Since x was arbitrary,{" "}
          <M>{"\\forall x\\, \\exists y\\, R(x, y)"}</M>.
        </p>
        <p>
          For the converse, take the whole numbers and let R(x, y) be <M>{"y > x"}</M>. Every number has a bigger one, so{" "}
          <M>{"\\forall x\\, \\exists y\\, (y > x)"}</M> is true. But no y is bigger than every x, since y is not bigger than
          itself, so <M>{"\\exists y\\, \\forall x\\, (y > x)"}</M> is false.
        </p>
      </Proof>

      <Remark title="the y may depend on the x">
        <p>
          In <M>{"\\forall x\\, \\exists y"}</M>, y is chosen <em>after</em> x, so it may depend on x: for &ldquo;every
          number has a bigger one&rdquo;, the choice <M>{"y = x + 1"}</M> works, and it changes as x changes. In{" "}
          <M>{"\\exists y\\, \\forall x"}</M>, y is chosen first and must work for every x at once. A useful way to read a
          nested statement is as a game: a sceptic picks the values under <M>{"\\forall"}</M>, you pick the values under{" "}
          <M>{"\\exists"}</M>, moving in order from left to right, and the statement is true when you have a way to always
          win. The logician Jaakko Hintikka made this game reading into a full theory of meaning.
        </p>
      </Remark>

      <Example title="continuity and uniform continuity">
        <p>
          The difference between continuity and the stronger property called uniform continuity, which you will meet in
          Calculus, is exactly a swap of two quantifiers. Schematically, continuity says{" "}
          <M>{"\\forall x\\, \\forall \\varepsilon\\, \\exists \\delta\\, \\cdots"}</M>, where <M>{"\\delta"}</M> may depend
          on x; uniform continuity says <M>{"\\forall \\varepsilon\\, \\exists \\delta\\, \\forall x\\, \\cdots"}</M>, where
          one <M>{"\\delta"}</M> must serve every x. Mathematicians took much of the nineteenth century to see this
          difference clearly.
        </p>
      </Example>

      <Remark title="negating nested statements">
        <p>The rule from the last lesson works unchanged: push the <M>{"\\neg"}</M> rightwards, flipping each quantifier.</p>
        <MD>{"\\neg\\, \\forall x\\, \\exists y\\, R(x, y) \\equiv \\exists x\\, \\forall y\\, \\neg R(x, y)."}</MD>
        <p>&ldquo;Not everybody loves somebody&rdquo; means &ldquo;somebody loves nobody&rdquo;.</p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inverse",
      rung: "check",
      prompt: <p>Over the integers, is <M>{"\\forall x\\, \\exists y\\, (x + y = 0)"}</M> true?</p>,
      answer: { kind: "choice", options: ["True: take y = −x.", "False: no single y works for every x."], correct: [0] },
    },
    {
      key: "inverse-swap",
      rung: "check",
      prompt: <p>Over the integers, is <M>{"\\exists y\\, \\forall x\\, (x + y = 0)"}</M> true?</p>,
      answer: { kind: "choice", options: ["True: take y = −x.", "False: no single y works for every x."], correct: [1] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: (
        <p>
          Over the domain {"{1, 2, 3, 4, 5}"}, let R(x, y) be <M>{"x + y = 6"}</M>. How many of these four statements are
          true: <M>{"\\forall x\\, \\exists y\\, R"}</M>, <M>{"\\exists y\\, \\forall x\\, R"}</M>,{" "}
          <M>{"\\forall x\\, \\forall y\\, R"}</M>, <M>{"\\exists x\\, \\exists y\\, R"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "bigger",
      rung: "apply",
      prompt: <p>Symbolise &ldquo;Every number has a larger number&rdquo;.</p>,
      answer: { kind: "choice", options: ["∃y ∀x (y > x)", "∀x ∃y (y > x)", "∀x ∀y (y > x)", "∃x ∃y (y > x)"], correct: [1] },
    },
    {
      key: "smallest",
      rung: "apply",
      prompt: <p>Symbolise &ldquo;There is a smallest natural number&rdquo;, with x and y ranging over the natural numbers.</p>,
      answer: { kind: "choice", options: ["∀y ∃x (x ≤ y)", "∃x ∀y (x ≤ y)", "∀x ∃y (x ≤ y)", "∃x ∃y (x ≤ y)"], correct: [1] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`D = range(0, 5)
a = all(any(y > x for y in D) for x in D)
b = any(all(y >= x for x in D) for y in D)
print(a, b)`}</Code>
          <p>∀x ∃y (y &gt; x) and ∃y ∀x (y ≥ x) over {"{0, …, 4}"}. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False True", "True True", "True False", "False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>forall_exists(R, D)</C>, the truth of ∀x ∃y R(x, y), and <C>exists_forall(R, D)</C>, the truth of ∃y ∀x R(x, y), over the same finite domain.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def forall_exists(R, D):
    return True

def exists_forall(R, D):
    return True
`,
        solution: `def forall_exists(R, D):
    return all(any(R(x, y) for y in D) for x in D)

def exists_forall(R, D):
    return any(all(R(x, y) for x in D) for y in D)
`,
        tests: [
          { name: "order matters", code: `R = lambda x, y: x != y
D = range(3)
assert forall_exists(R, D) and not exists_forall(R, D), 'Each x has some y ≠ x, but no single y differs from every x (including itself).'` },
          { name: "bounded", code: `assert exists_forall(lambda x, y: y >= x, range(5)), 'y = 4 is at least every x.'` },
        ],
      },
    },
    {
      key: "direction",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\exists y\\, \\forall x\\, R(x, y)"}</M> implies <M>{"\\forall x\\, \\exists y\\, R(x, y)"}</M>{" "}
          for any relation R, and give an example of your own showing the converse can fail.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Fixes a y₀ that works for every x, then takes an arbitrary x.",
          "Observes that y₀ itself witnesses ∃y R(x, y), and concludes ∀x ∃y R(x, y).",
          "Gives a relation and domain where every x has some partner but no single y works for all x, and checks both claims.",
        ],
      },
    },
    {
      key: "negate-three",
      rung: "stretch",
      prompt: <p>Which is equivalent to <M>{"\\neg\\, \\forall x\\, \\exists y\\, \\forall z\\, R(x, y, z)"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["∃x ∀y ∃z ¬R(x, y, z)", "∀x ∃y ∀z ¬R(x, y, z)", "∃x ∃y ∃z ¬R(x, y, z)", "∃x ∀y ∀z ¬R(x, y, z)"],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between 'everybody loves somebody' and 'somebody is loved by everybody', and why one implies the other but not the reverse.",

  glimpse: (
    <p>
      You now have the whole language of mathematical statements: connectives and quantifiers. The next chapter uses it to
      write proofs, starting with direct proof. The game reading, where the sceptic moves under &ldquo;for all&rdquo; and you
      move under &ldquo;there exists&rdquo;, is the best guide to the epsilon-delta definitions of Calculus and to uniform
      continuity in Real Analysis.
    </p>
  ),
};
