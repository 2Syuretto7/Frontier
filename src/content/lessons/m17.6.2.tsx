import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GrokkingViz } from "@/components/viz/GrokkingViz";
import type { LessonContent } from "@/lib/types";

const CIRCUIT = `import math

def fourier_logits(a, b, p, ks):
    return [sum(math.cos(2 * math.pi * k * (a + b - c) / p) for k in ks) for c in range(p)]

def predict(a, b, p, ks):
    z = fourier_logits(a, b, p, ks)
    return z.index(max(z))

def trig_check(x, y, w):
    return math.cos(w * x) * math.cos(w * y) - math.sin(w * x) * math.sin(w * y)`;

const TABLE = `def mod_pairs(p):
    return [(a, b, (a + b) % p) for a in range(p) for b in range(p)]

def memorise(train):
    return {(a, b): c for a, b, c in train}

def test_accuracy(table, pairs):
    return sum(1 for a, b, c in pairs if table.get((a, b), -1) == c) / len(pairs)`;

export const lesson: LessonContent = {
  id: "m17.6.2",
  minutes: 50,
  links: {
    requires: ["m17.6.1", "m17.3.3"],
    revisits: ["m4.4.3", "m16.7.3"],
    foreshadows: ["m17.6.3"],
  },

  puzzle: (
    <>
      <p>
        Train a small network on half the addition table modulo a prime. Within a few hundred steps it gets every training
        example right and every unseen one wrong: it has memorised. Conventional wisdom says to stop, since the test loss is
        only getting worse. Keep training with weight decay, though, and thousands of steps later the test accuracy shoots
        to 100%. What changed inside the network, when nothing changed in its training accuracy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are two ways to fit the training table: a lookup table, which is quick to learn but needs large weights and
        says nothing about unseen pairs, and an algorithm, which needs more coordination to find but uses smaller weights and
        works everywhere. Gradient descent finds the lookup table first. Weight decay then keeps pressing the norm down, and
        slowly the cheaper algorithmic solution takes over. The algorithm the network finds is rotation on a circle: it
        writes numbers as angles and adds the angles.
      </p>
      <GrokkingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="grokking">
        <p>
          A training run <em>groks</em> when test performance rises to near perfect long after training performance has saturated,
          typically by an order of magnitude more steps. Power and colleagues found it on small algorithmic tasks such as{" "}
          <M>{"c = a + b \\bmod p"}</M>, learned from a fraction of the <M>{"p^2"}</M> pairs. A pure memoriser scores zero on unseen pairs
          (<C>mod_pairs</C>, <C>memorise</C>, <C>test_accuracy</C>).
        </p>
        <Code>{TABLE}</Code>
      </Definition>

      <Theorem title="the Fourier algorithm for modular addition">
        <p>
          Let p be prime and K a non-empty set of frequencies in {"{"}1, …, p − 1{"}"}. Then
        </p>
        <MD>{"z_c(a, b) = \\sum_{k\\in K} \\cos\\Big(\\frac{2\\pi k (a + b - c)}{p}\\Big)"}</MD>
        <p>
          is maximised over <M>{"c \\in \\{0, \\dots, p-1\\}"}</M> exactly at <M>{"c = (a + b) \\bmod p"}</M>, where it equals |K| (<C>fourier_logits</C>,{" "}
          <C>predict</C>).
        </p>
        <Code>{CIRCUIT}</Code>
      </Theorem>
      <Proof>
        <p>
          Each term is at most 1, with equality iff <M>{"k(a + b - c) \\equiv 0 \\pmod p"}</M>. Since p is prime and{" "}
          <M>{"k \\not\\equiv 0"}</M>, k is invertible mod p, so this holds iff <M>{"c \\equiv a + b"}</M>. At that c every term is 1; at any other
          c every term is strictly less than 1, so the sum is strictly smaller.
        </p>
      </Proof>

      <Example title="how a network computes it">
        <p>
          Embed a as <M>{"(\\cos \\omega a, \\sin \\omega a)"}</M> with <M>{"\\omega = 2\\pi k/p"}</M>, and likewise b. The angle-addition identity{" "}
          <M>{"\\cos\\omega(a + b) = \\cos\\omega a\\cos\\omega b - \\sin\\omega a \\sin\\omega b"}</M> (<C>trig_check</C>) needs products of the two
          embeddings, which a quadratic unit provides: <M>{"(\\cos\\omega a + \\cos\\omega b)^2"}</M> contains <M>{"2\\cos\\omega a \\cos\\omega b"}</M>. A
          final linear layer then forms <M>{"\\cos\\omega(a + b - c) = \\cos\\omega(a+b)\\cos\\omega c + \\sin\\omega(a+b)\\sin\\omega c"}</M> for every
          c. Nanda and colleagues found exactly this circuit in a grokked transformer, using a handful of frequencies. In the
          viz&apos;s run, after grokking each hidden unit draws on average 77% of its input power from a single frequency,
          against 28% in the run without weight decay.
        </p>
      </Example>

      <Remark title="why it happens late">
        <p>
          Two explanations agree on the essentials. In the norm picture, the memorising solution&apos;s weight norm grows with the
          number of examples it stores, while the Fourier solution&apos;s does not; once the training loss is near zero, weight
          decay is the main force, and it slowly trades one for the other. In the lazy-to-rich picture of m17.3.3, a large
          initialisation starts training in the kernel regime, where interpolating a table that looks random does not
          generalise, and only later do the features move enough to find the circuit. Either way the transition is gradual
          inside the network: measures of how much the Fourier circuit contributes rise steadily during the long plateau in
          test accuracy, and the jump is when that circuit finally outweighs the memorised one. Grokking is thus an extreme
          case of the implicit and explicit biases of m16.7.3 acting on a slow timescale.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "margin",
      rung: "check",
      prompt: <p>With p = 31 and frequencies {"{"}1, 2, 3{"}"}, by how much does the logit at c = a + b exceed the logit at c = a + b + 1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2807, tolerance: 0.0002 },
    },
    {
      key: "freqs",
      rung: "check",
      prompt: <p>For p = 31, how many distinct frequencies k are there, counting k and p − k as the same since they give the same cosines?</p>,
      answer: { kind: "numeric", value: 15, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>In the norm picture, why does weight decay eventually favour the generalising solution?</p>,
      answer: {
        kind: "choice",
        options: [
          "Both fit the training data, but the Fourier circuit needs a smaller weight norm than storing every pair, so decay keeps pushing towards it",
          "Weight decay adds noise that helps escape the memorising solution",
          "Weight decay increases the learning rate over time",
          "The generalising solution has a lower training loss than the memorising one",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def fourier_logits(a, b, p, ks):
    return [sum(math.cos(2 * math.pi * k * (a + b - c) / p) for k in ks) for c in range(p)]

def predict(a, b, p, ks):
    z = fourier_logits(a, b, p, ks)
    return z.index(max(z))

def trig_check(x, y, w):
    return math.cos(w * x) * math.cos(w * y) - math.sin(w * x) * math.sin(w * y)

print(predict(3, 5, 11, [1]), predict(10, 4, 11, [1, 2, 3]), [round(x, 4) for x in fourier_logits(0, 0, 3, [1])])
print(round(trig_check(2, 3, 0.5), 4), round(math.cos(2.5), 4), fourier_logits(1, 1, 5, [1, 2])[2])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8 3 [1.0, -0.5, -0.5]\n-0.8011 -0.8011 2.0",
          "8 14 [1.0, -0.5, -0.5]\n-0.8011 -0.8011 2.0",
          "8 3 [1.0, 0.5, 0.5]\n-0.8011 -0.8011 2.0",
          "8 3 [1.0, -0.5, -0.5]\n0.8011 -0.8011 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mod_pairs(p):
    return [(a, b, (a + b) % p) for a in range(p) for b in range(p)]

def memorise(train):
    return {(a, b): c for a, b, c in train}

def test_accuracy(table, pairs):
    return sum(1 for a, b, c in pairs if table.get((a, b), -1) == c) / len(pairs)

print(len(mod_pairs(5)), mod_pairs(3)[4], mod_pairs(3)[-1])
print(len(memorise(mod_pairs(3)[:5])), test_accuracy(memorise(mod_pairs(3)[:5]), mod_pairs(3)[5:]), test_accuracy(memorise(mod_pairs(3)[:5]), mod_pairs(3)[:5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "25 (1, 1, 2) (2, 2, 1)\n5 0.0 1.0",
          "25 (1, 1, 2) (2, 2, 4)\n5 0.0 1.0",
          "25 (1, 2, 0) (2, 2, 1)\n5 0.0 1.0",
          "25 (1, 1, 2) (2, 2, 1)\n9 0.5 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fourier_logits(a, b, p, ks)</C>, <C>predict(a, b, p, ks)</C> returning the c of the largest logit, and{" "}
          <C>trig_check(x, y, w)</C>, the right side of the angle-addition formula for <M>{"\\cos w(x + y)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fourier_logits(a, b, p, ks):
    return [0.0] * p

def predict(a, b, p, ks):
    return 0

def trig_check(x, y, w):
    return math.cos(w * x) * math.cos(w * y)
`,
        solution: CIRCUIT,
        tests: [
          { name: "logits", code: `z = fourier_logits(2, 4, 7, [1, 3])\nassert abs(z[6] - 2) < 1e-12 and abs(z[0] - (math.cos(12 * math.pi / 7) + math.cos(36 * math.pi / 7))) < 1e-12` },
          { name: "predict", code: `assert all(predict(a, b, 13, [5]) == (a + b) % 13 for a in range(13) for b in range(13)) and abs(trig_check(1.0, 2.0, 0.7) - math.cos(2.1)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mod_pairs(p)</C>, the full table of triples (a, b, (a + b) mod p) with a outer and b inner; <C>memorise(train)</C>, a
          dictionary from (a, b) to c; and <C>test_accuracy(table, pairs)</C>, counting a pair as wrong when it is missing.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mod_pairs(p):
    return []

def memorise(train):
    return {}

def test_accuracy(table, pairs):
    return 1.0
`,
        solution: TABLE,
        tests: [
          { name: "table", code: `t = mod_pairs(4)\nassert len(t) == 16 and t[7] == (1, 3, 0) and memorise(t[:2]) == {(0, 0): 0, (0, 1): 1}` },
          { name: "accuracy", code: `assert test_accuracy({(0, 0): 0, (1, 1): 0}, [(0, 0, 0), (1, 1, 2), (2, 2, 1), (0, 1, 1)]) == 0.25` },
        ],
      },
    },
    {
      key: "gap",
      rung: "stretch",
      prompt: (
        <p>
          With p = 31 and frequencies {"{"}1, 5{"}"}, how far does the correct answer&apos;s logit exceed the largest logit of any
          wrong answer? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4915, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The grokked network learned an algorithm into its weights. Large transformers can also run learning algorithms on
        the fly, inside a single forward pass, on examples given in their prompt: in-context learning.
      </p>
    </>
  ),
};
