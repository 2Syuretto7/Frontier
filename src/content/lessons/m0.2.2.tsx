import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { BalanceViz } from "@/components/viz/BalanceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.2",
  minutes: 60,
  links: {
    foreshadows: ["m0.3.3", "m3.2.1", "m3.2.3"],
  },

  puzzle: (
    <>
      <p>A bat and a ball cost &#8377;110 together. The bat costs &#8377;100 more than the ball. How much does the ball cost?</p>
      <p>
        Most people answer &#8377;10 at once. Check that answer before you read on. If it is wrong, what went wrong in the
        thinking?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the ball cost &#8377;10, the bat would cost &#8377;110, and together they would cost &#8377;120. The quick answer
        felt certain and was wrong. Writing the problem down slowly fixes it: let the ball cost <M>b</M> rupees. Then the
        bat costs <M>{"b + 100"}</M>, and <M>{"b + (b + 100) = 110"}</M>, so <M>{"2b = 10"}</M> and <M>{"b = 5"}</M>.
      </p>
      <p>
        An equation is a balance. The two sides weigh the same; that is what &ldquo;=&rdquo; says. Anything you do to both
        sides keeps them balanced, and the aim is to do things that leave the unknown alone on one side.
      </p>
      <BalanceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="equations and solutions">
        <p>
          An <strong>equation</strong> in a variable <M>x</M> is a statement that two expressions are equal, such as{" "}
          <M>{"3x + 2 = x + 8"}</M>. Unlike an identity, it is usually true for some values of <M>x</M> and false for
          others. A <strong>solution</strong> is a value that makes it true, and to <strong>solve</strong> an equation is to
          find <em>all</em> its solutions, its <strong>solution set</strong>. Two equations are <strong>equivalent</strong>{" "}
          if they have the same solution set.
        </p>
      </Definition>

      <Theorem title="the balance rules">
        <p>For any number <M>c</M>, the equation <M>{"A = B"}</M> is equivalent to:</p>
        <ol>
          <li><M>{"A + c = B + c"}</M>;</li>
          <li><M>{"cA = cB"}</M>, provided <M>{"c \\neq 0"}</M>.</li>
        </ol>
        <p>Here <M>A</M> and <M>B</M> are expressions in <M>x</M>, and <M>c</M> may also be an expression, as long as it is never 0 in rule 2.</p>
      </Theorem>
      <Proof>
        <p>
          We must show that a value of <M>x</M> solves one equation exactly when it solves the other. (1) If{" "}
          <M>{"A = B"}</M> for some <M>x</M>, then adding <M>c</M> to equal numbers gives equal numbers. Conversely, if{" "}
          <M>{"A + c = B + c"}</M>, add <M>{"-c"}</M> to both sides to get back <M>{"A = B"}</M>. (2) If <M>{"A = B"}</M>,
          then <M>{"cA = cB"}</M>. Conversely, if <M>{"cA = cB"}</M> and <M>{"c \\neq 0"}</M>, multiply both sides by{" "}
          <M>{"\\tfrac{1}{c}"}</M> to get back <M>{"A = B"}</M>.
        </p>
      </Proof>

      <p>
        The point of the proof is the word <em>conversely</em>. Each step can be undone, so no solutions are gained or lost.
        That is why the condition <M>{"c \\neq 0"}</M> matters: multiplying by 0 turns every equation into{" "}
        <M>{"0 = 0"}</M>, and that step cannot be undone.
      </p>

      <Example>
        <MD>{"\\begin{aligned} 3(x - 2) &= 2x + 5 \\\\ 3x - 6 &= 2x + 5 &&\\text{(distributivity)} \\\\ x - 6 &= 5 &&\\text{(add } -2x\\text{)} \\\\ x &= 11 &&\\text{(add } 6\\text{)} \\end{aligned}"}</MD>
        <p>Check: <M>{"3(11 - 2) = 27"}</M> and <M>{"2 \\cdot 11 + 5 = 27"}</M>. The solution set is <M>{"\\{11\\}"}</M>.</p>
      </Example>

      <Theorem title="linear equations">
        <p>
          The equation <M>{"ax + b = 0"}</M>, with <M>a</M> and <M>b</M> fixed numbers:
        </p>
        <ul>
          <li>has exactly one solution, <M>{"x = -\\tfrac{b}{a}"}</M>, if <M>{"a \\neq 0"}</M>;</li>
          <li>has no solutions if <M>{"a = 0"}</M> and <M>{"b \\neq 0"}</M>;</li>
          <li>is solved by every number if <M>{"a = 0"}</M> and <M>{"b = 0"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          If <M>{"a \\neq 0"}</M>, add <M>{"-b"}</M> and multiply by <M>{"\\tfrac{1}{a}"}</M>: by the balance rules,{" "}
          <M>{"ax + b = 0"}</M> is equivalent to <M>{"x = -\\tfrac{b}{a}"}</M>, whose only solution is{" "}
          <M>{"-\\tfrac{b}{a}"}</M>. If <M>{"a = 0"}</M>, the equation says <M>{"b = 0"}</M>, whatever <M>x</M> is; this is
          false for every <M>x</M> if <M>{"b \\neq 0"}</M> and true for every <M>x</M> if <M>{"b = 0"}</M>.
        </p>
      </Proof>

      <Remark title="steps that change the solution set">
        <p>
          Dividing both sides by an expression that can be 0 can lose solutions. From <M>{"x^2 = x"}</M>, dividing by{" "}
          <M>x</M> gives <M>{"x = 1"}</M>, but <M>{"x = 0"}</M> was also a solution. Squaring both sides can gain
          solutions: <M>{"x = 2"}</M> becomes <M>{"x^2 = 4"}</M>, which <M>{"-2"}</M> also solves. When a step cannot be
          undone, check every answer in the original equation.
        </p>
      </Remark>

      <Definition title="simultaneous equations">
        <p>
          Two equations in two unknowns, such as <M>{"x + y = 10"}</M> and <M>{"x - y = 4"}</M>, are solved together: we
          want every pair <M>{"(x, y)"}</M> that makes both true. Two methods:
        </p>
        <ul>
          <li><strong>Elimination.</strong> Add or subtract multiples of the equations to remove one unknown. Adding the two above gives <M>{"2x = 14"}</M>, so <M>{"x = 7"}</M>, and then <M>{"y = 3"}</M>.</li>
          <li><strong>Substitution.</strong> Solve one equation for one unknown and put the result into the other. From the first, <M>{"y = 10 - x"}</M>; then <M>{"x - (10 - x) = 4"}</M> gives <M>{"x = 7"}</M>.</li>
        </ul>
        <p>
          Like a single equation, a pair can have exactly one solution, none, or infinitely many. When you meet lines,
          you will see why: two lines in a plane cross once, are parallel, or are the same line.
        </p>
      </Definition>

      <Example title="from words to an equation">
        <p>
          A father is four times as old as his daughter. In 20 years he will be twice as old as her. Let her age now be{" "}
          <M>d</M>. Then his is <M>{"4d"}</M>, and <M>{"4d + 20 = 2(d + 20)"}</M>. Solving,{" "}
          <M>{"4d + 20 = 2d + 40"}</M>, so <M>{"2d = 20"}</M> and <M>{"d = 10"}</M>. Check: 40 and 10 now; 60 and 30 in
          twenty years. The method is always the same: name the unknown, translate each sentence, solve, check against the
          words.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "solve",
      rung: "check",
      prompt: <p>Solve <M>{"5x - 7 = 18"}</M>.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "brackets",
      rung: "check",
      prompt: <p>Solve <M>{"4(x + 1) = 2x - 6"}</M>.</p>,
      answer: { kind: "numeric", value: -5 },
    },
    {
      key: "system",
      rung: "apply",
      prompt: <p>Solve <M>{"2x + 3y = 12"}</M> and <M>{"x - y = 1"}</M> together. What is <M>y</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "how-many",
      rung: "apply",
      prompt: <p>How many solutions does <M>{"2(x + 3) = 2x + 6"}</M> have?</p>,
      answer: { kind: "choice", options: ["None", "Exactly one", "Exactly two", "Infinitely many"], correct: [3] },
    },
    {
      key: "lost",
      rung: "apply",
      prompt: (
        <p>
          A student solves <M>{"x(x - 3) = 2x"}</M> by dividing both sides by <M>x</M>, getting <M>{"x - 3 = 2"}</M> and{" "}
          <M>{"x = 5"}</M>. Select every solution of the original equation.
        </p>
      ),
      answer: { kind: "choice", options: ["x = 0", "x = 3", "x = 5", "x = -5"], correct: [0, 2] },
    },
    {
      key: "unique",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"a \\neq 0"}</M>, the equation <M>{"ax + b = c"}</M> has exactly one solution. Your proof should
          show both that a solution exists and that there is no other.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Exhibits the solution x = (c - b)/a and checks that it works (existence).",
          "Shows that any solution must equal (c - b)/a, for example by applying the balance rules (uniqueness).",
          "Uses a ≠ 0 explicitly where dividing or multiplying by 1/a.",
        ],
      },
    },
    {
      key: "coins",
      rung: "stretch",
      prompt: (
        <p>
          A jar holds only &#8377;2 and &#8377;5 coins: 40 coins in all, worth &#8377;140. How many &#8377;5 coins are in the
          jar?
        </p>
      ),
      answer: { kind: "numeric", value: 20 },
    },
  ],

  teachBack:
    "Explain why 'do the same to both sides' works, and why it fails if you multiply both sides by zero. A balance, or any picture you like, will help.",

  glimpse: (
    <p>
      Next, systems of two equations, solved by elimination and pictured as two lines. Linear equations return as
      straight-line graphs in the chapter on functions and as lines in the coordinate plane. Large systems of them, with
      many unknowns, are the starting point of Linear Algebra, where Gaussian elimination is the elimination method you
      just used, made systematic.
    </p>
  ),
};
