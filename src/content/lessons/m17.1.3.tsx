import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DyckAttentionViz } from "@/components/viz/DyckAttentionViz";
import type { LessonContent } from "@/lib/types";

const RASP = `def prefix_attention(values):
    out, total = [], 0.0
    for i, v in enumerate(values, start=1):
        total += v
        out.append(total / i)
    return out

def dyck1(s):
    means = prefix_attention([1 if c == '(' else -1 for c in s])
    balances = [round(m * i) for i, m in enumerate(means, start=1)]
    return all(b >= 0 for b in balances) and balances[-1] == 0

def histogram(s):
    return [round(sum(1 for d in s if d == c) / len(s) * len(s)) for c in s]`;

const SENS = `from itertools import product

def parity(bits):
    return sum(bits) % 2

def sensitivity(f, bits):
    flips = 0
    for i in range(len(bits)):
        other = list(bits)
        other[i] = 1 - other[i]
        flips += f(bits) != f(other)
    return flips

def avg_sensitivity(f, n):
    inputs = list(product((0, 1), repeat=n))
    return sum(sensitivity(f, list(x)) for x in inputs) / len(inputs)`;

export const lesson: LessonContent = {
  id: "m17.1.3",
  minutes: 50,
  links: {
    requires: ["m17.1.2", "l5.2.2"],
    revisits: ["l4.4.3", "l5.6.4"],
    foreshadows: ["m17.6.3"],
  },

  puzzle: (
    <>
      <p>
        A transformer with a dozen layers writes code and proves small theorems, yet the same model may fail to say
        whether a long bit string has an even number of ones, or whether a long string of brackets is balanced. Universal
        approximation promises any function of a fixed-length input. What changes when the input length grows while the
        number of layers stays fixed, and why does writing out intermediate steps help?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A fixed-depth transformer performs a fixed number of rounds of communication, and in each round every position
        reads a weighted average of all the others. Averages are excellent at counting proportions and poor at tracking a
        quantity that one token can flip: changing one token among n moves an average by about 1/n. Problems whose answer
        hinges on every single token, or on many steps in order, strain a constant number of rounds.
      </p>
      <DyckAttentionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the computational model">
        <p>
          Fix a transformer with L layers, H heads and width d, applied to inputs of any length n. Each layer maps positions{" "}
          <M>{"x_1, \\dots, x_n"}</M> to <M>{"x_i + \\mathrm{MLP}(x_i + \\sum_h \\sum_j \\alpha^h_{ij} V^h x_j)"}</M>, with attention weights{" "}
          <M>{"\\alpha^h_{ij}"}</M> from a softmax of scores. The questions are which languages, sets of strings, it can recognise for all n
          with the same weights, and with how many bits of numerical precision. Two primitives in the style of RASP are the
          building blocks: select which positions to attend to, and aggregate their values by averaging (<C>prefix_attention</C>).
        </p>
      </Definition>

      <Example title="counting programs">
        <p>
          Uniform causal attention over values ±1 returns balance/i at position i; an MLP that also sees i recovers the balance,
          and the Dyck-1 language of balanced brackets is recognised in two layers (<C>dyck1</C>). Attending to positions
          holding the same token computes each token&apos;s frequency (<C>histogram</C>). Sorting, reversal and majority have similar
          constant-depth programs.
        </p>
        <Code>{RASP}</Code>
      </Example>

      <Theorem title="sensitivity and hard attention">
        <p>
          The sensitivity of a Boolean function at an input is the number of positions whose flip changes the output. Parity
          has sensitivity n at every input (<C>sensitivity</C>, <C>avg_sensitivity</C>). Hahn showed that a fixed transformer with hard
          (one-position) attention cannot recognise parity or Dyck-2 for all n, and that with soft attention and bounded
          Lipschitz layers, flipping one input changes the output by O(1/n), so the decision margin on parity must shrink like
          1/n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The soft-attention half is the computation in the figure. Each attention output is an average, so changing one value
          by at most 2c changes every average that gives it weight O(1/n) by O(c/n); Lipschitz MLPs and residual sums
          propagate this through L layers with a constant factor. A function of sensitivity n at every input must change its
          output for every single flip, so its margin, the gap between outputs on the two classes, is at most O(1/n). The hard
          attention result uses random restrictions: fixing a few inputs so that each head attends to a fixed position,
          after which the output depends on boundedly many inputs, which parity forbids.
        </p>
        <Code>{SENS}</Code>
      </Proof>

      <Theorem title="a circuit upper bound">
        <p>
          Transformers of fixed depth whose numbers have O(log n) bits recognise only languages in uniform{" "}
          <M>{"\\mathsf{TC}^0"}</M>: constant-depth, polynomial-size circuits with threshold gates (Merrill and Sabharwal).
        </p>
      </Theorem>
      <Proof>
        <p>
          Every operation in a layer, a dot product, an exponential, a sum over n positions and a division, can be done on
          O(log n)-bit numbers by constant-depth threshold circuits, since threshold gates add and compare many numbers at
          once. Composing L layers keeps the depth constant. So unless <M>{"\\mathsf{TC}^0 = \\mathsf{NC}^1"}</M>, such transformers cannot
          evaluate Boolean formulas or compose permutations of five elements, problems complete for <M>{"\\mathsf{NC}^1"}</M> that seem to
          require depth growing with n.
        </p>
      </Proof>

      <Remark title="chain of thought adds depth">
        <p>
          Generating T intermediate tokens before answering gives the model T further serial rounds of computation, each
          conditioned on the previous ones. With a number of steps linear in n, decoders can simulate finite automata and
          so recognise all regular languages, including parity; with polynomially many steps they reach all of{" "}
          <M>{"\\mathsf P"}</M>. This is one formal reason why letting a model write out its working helps (l5.6.4), and why the
          analysis of in-context learning (m17.6.3) asks what algorithm a fixed stack of layers can implement.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flip",
      rung: "check",
      prompt: (
        <p>
          A head with equal scores averages +1 for &quot;(&quot; and −1 for &quot;)&quot; over a string of length 100. By how much does its output at
          the last position change when one &quot;(&quot; is flipped to &quot;)&quot;?
        </p>
      ),
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "maj",
      rung: "check",
      prompt: <p>Compute the average sensitivity of the majority function on 3 bits, over all 8 inputs.</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "cot",
      rung: "apply",
      prompt: <p>Why does a chain of thought let a fixed transformer compute the parity of a long string?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each generated token is a further serial step, so the model can carry a running parity one bit at a time",
          "Longer outputs give attention more precision",
          "The intermediate tokens change the model's weights",
          "Parity has low sensitivity once written out",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def prefix_attention(values):
    out, total = [], 0.0
    for i, v in enumerate(values, start=1):
        total += v
        out.append(total / i)
    return out

def dyck1(s):
    means = prefix_attention([1 if c == '(' else -1 for c in s])
    balances = [round(m * i) for i, m in enumerate(means, start=1)]
    return all(b >= 0 for b in balances) and balances[-1] == 0

def histogram(s):
    return [round(sum(1 for d in s if d == c) / len(s) * len(s)) for c in s]

print([round(v, 4) for v in prefix_attention([1, 1, -1, -1])], dyck1('(())'), dyck1('())('), dyck1('(()'), dyck1('()()'))
print(histogram('abca'), histogram('zz'), [round(v, 3) for v in prefix_attention([1, -1, -1])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 0.3333, 0.0] True False False True\n[2, 1, 1, 2] [2, 2] [1.0, 0.0, -0.333]",
          "[1.0, 1.0, 0.3333, 0.0] True False True True\n[2, 1, 1, 2] [2, 2] [1.0, 0.0, -0.333]",
          "[1.0, 2.0, 1.0, 0.0] True False False True\n[2, 1, 1, 2] [2, 2] [1.0, 0.0, -1.0]",
          "[1.0, 1.0, 0.3333, 0.0] True True False True\n[0.5, 0.25, 0.25, 0.5] [1, 1] [1.0, 0.0, -0.333]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def parity(bits):
    return sum(bits) % 2

def sensitivity(f, bits):
    flips = 0
    for i in range(len(bits)):
        other = list(bits)
        other[i] = 1 - other[i]
        flips += f(bits) != f(other)
    return flips

def avg_sensitivity(f, n):
    inputs = list(product((0, 1), repeat=n))
    return sum(sensitivity(f, list(x)) for x in inputs) / len(inputs)

print(parity([1, 0, 1, 1]), sensitivity(parity, [0, 0, 1]), sensitivity(lambda b: int(sum(b) >= 2), [1, 1, 0]), sensitivity(lambda b: b[0], [0, 1, 1]))
print(avg_sensitivity(parity, 4), avg_sensitivity(lambda b: b[0], 3), avg_sensitivity(lambda b: int(all(b)), 2), avg_sensitivity(lambda b: 0, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 3 2 1\n4.0 1.0 1.0 0.0",
          "1 3 1 1\n4.0 1.0 1.0 0.0",
          "1 1 2 1\n2.0 1.0 0.5 0.0",
          "0 3 2 3\n4.0 0.333 1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prefix_attention(values)</C>, the output of causal attention with equal scores at each position;{" "}
          <C>dyck1(s)</C>, deciding balance of a bracket string from those outputs times the position; and <C>histogram(s)</C>,
          giving for each position the number of occurrences of its character.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def prefix_attention(values):
    return []

def dyck1(s):
    return False

def histogram(s):
    return []
`,
        solution: RASP,
        tests: [
          { name: "attention", code: `assert prefix_attention([2, 0, 4]) == [2.0, 1.0, 2.0] and histogram('aab') == [2, 2, 1]` },
          { name: "dyck", code: `assert dyck1('((()))') and not dyck1(')(') and not dyck1('(()))(')` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parity(bits)</C>; <C>sensitivity(f, bits)</C>, the number of positions whose flip changes f; and{" "}
          <C>avg_sensitivity(f, n)</C>, its average over all <M>{"2^n"}</M> inputs, passed to f as lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def parity(bits):
    return 0

def sensitivity(f, bits):
    return 0

def avg_sensitivity(f, n):
    return 0.0
`,
        solution: SENS,
        tests: [
          { name: "sensitivity", code: `assert sensitivity(parity, [1, 0, 1, 0]) == 4 and sensitivity(lambda b: int(any(b)), [0, 0, 0]) == 3 and parity([1, 1, 1]) == 1` },
          { name: "average", code: `assert abs(avg_sensitivity(lambda b: int(any(b)), 2) - 1.0) < 1e-12 and abs(avg_sensitivity(lambda b: b[0] ^ b[1], 3) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "maj5",
      rung: "stretch",
      prompt: <p>Compute the average sensitivity of the majority function on 5 bits. Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.875, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Expressivity asks what a network can compute. Part 2 asks whether a randomly initialised deep network even passes
        signals and gradients through its layers, which decides whether training can start at all.
      </p>
    </>
  ),
};
