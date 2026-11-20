import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MadeMaskViz } from "@/components/viz/MadeMaskViz";
import type { LessonContent } from "@/lib/types";

const CHAIN = `import math
from itertools import product

def ar_log_prob(x, cond):
    lp = 0.0
    for i, b in enumerate(x):
        p = cond(x[:i])
        lp += math.log(p if b == 1 else 1 - p)
    return lp

def ar_sample(cond, n, us):
    x = []
    for i in range(n):
        x.append(1 if us[i] < cond(x) else 0)
    return x

def total_probability(cond, n):
    return sum(math.exp(ar_log_prob(list(s), cond)) for s in product([0, 1], repeat=n))`;

const MADE = `def made_masks(order, hidden_degrees):
    deg = [0] * len(order)
    for pos, d in enumerate(order):
        deg[d] = pos + 1
    m1 = [[1 if h >= g else 0 for g in deg] for h in hidden_degrees]
    m2 = [[1 if g > h else 0 for h in hidden_degrees] for g in deg]
    return m1, m2

def depends(m1, m2):
    D, H = len(m2), len(m1)
    return [[int(any(m2[o][k] and m1[k][i] for k in range(H))) for i in range(D)] for o in range(D)]

def is_autoregressive(dep, order):
    pos = {d: p for p, d in enumerate(order)}
    n = len(dep)
    return all(not dep[o][i] or pos[i] < pos[o] for o in range(n) for i in range(n))`;

export const lesson: LessonContent = {
  id: "l7.2.1",
  minutes: 45,
  links: {
    requires: ["l7.1.3", "m12.1.4", "l4.3.1"],
    revisits: ["l5.2.2", "l7.1.1"],
    foreshadows: ["l7.2.2", "l7.2.3", "l7.4.2"],
  },

  puzzle: (
    <>
      <p>
        A table of probabilities for every possible sequence of 100 binary pixels would need about{" "}
        <M>{"10^{30}"}</M> entries. Yet a language model assigns an exact probability to every possible paragraph, an even
        larger space, using a few billion numbers, and the probabilities add up to one. What identity makes this possible, and
        what does it cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any joint distribution can be written as a sequence of predictions: the probability of the first variable, times the
        probability of the second given the first, and so on. Each factor is a distribution over one variable, which is easy to
        normalise, and a single neural network with shared weights can produce all of them. The product is automatically a
        valid distribution, so the likelihood is exact.
      </p>
      <p>
        Training is fast because, given a complete training example, every factor can be computed at once, provided the network
        is prevented from peeking at the variables it is predicting. Sampling is slow because each variable must be drawn
        before the next can be predicted. Masks enforce the no-peeking rule.
      </p>
      <MadeMaskViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the chain rule">
        <p>For any distribution over <M>{"x = (x_1, \\dots, x_D)"}</M> and any ordering of the variables,</p>
        <MD>{"p(x) = \\prod_{i=1}^{D} p(x_i \\mid x_{<i}), \\qquad \\log p(x) = \\sum_{i=1}^{D} \\log p(x_i \\mid x_{<i})."}</MD>
        <p>
          Conversely, any choice of conditional distributions <M>{"q_i(x_i \\mid x_{<i})"}</M>, each normalised over{" "}
          <M>{"x_i"}</M>, defines a normalised joint distribution by this product.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first statement follows by applying <M>{"p(a, b) = p(a) p(b \\mid a)"}</M> repeatedly, peeling off the last
          variable each time (m12.1.4). For the converse, sum the product over <M>{"x_D"}</M> first: only the last factor depends
          on it, and it sums to one. What is left is the product of the first D − 1 factors; repeating the argument down to{" "}
          <M>{"x_1"}</M> leaves 1 (<C>total_probability</C> checks this by brute force). So an autoregressive model never needs a
          normalising constant over the whole space, only over one variable at a time.
        </p>
      </Proof>

      <Definition title="autoregressive model">
        <p>
          An <em>autoregressive model</em> parametrises each conditional with a network that reads the prefix{" "}
          <M>{"x_{<i}"}</M> and outputs a distribution over <M>{"x_i"}</M>: a Bernoulli probability for binary variables, a
          softmax over values for discrete ones, a mixture of Gaussians or logistics for continuous ones. The log-likelihood is
          the sum of per-variable log-probabilities (<C>ar_log_prob</C>), so training is maximum likelihood with no
          approximation. Sampling is ancestral, one variable at a time (<C>ar_sample</C>). The n-gram model (l4.3.1) is the
          special case in which each conditional looks at only the last n − 1 variables.
        </p>
        <Code>{CHAIN}</Code>
      </Definition>

      <Remark title="parameter counts">
        <p>
          With tabular conditionals the chain rule saves nothing: the i-th conditional of D binary variables needs{" "}
          <M>{"2^{i-1}"}</M> numbers, <M>{"2^D - 1"}</M> in total, exactly as many as the joint table. The savings come from
          restricting the conditionals. Logistic regression on the prefix needs i numbers for the i-th, D(D + 1)/2 in total;
          a shared network needs a fixed number however long the sequence. The ordering matters for how easy the conditionals
          are to learn, though not for what can be represented in principle.
        </p>
      </Remark>

      <Definition title="masking">
        <p>
          A network computes all D conditionals in one pass if output i is wired to depend only on inputs earlier in the order.
          The masked autoencoder MADE (Germain and others, 2015) assigns input j the degree <M>{"m(j)"}</M>, its position in the
          order, and each hidden unit k a degree <M>{"m(k) \\in \\{1, \\dots, D - 1\\}"}</M>. Weights from input j to hidden k are kept
          if <M>{"m(k) \\ge m(j)"}</M>, and from hidden k to output i if <M>{"m(i) > m(k)"}</M> (<C>made_masks</C>). Output i then
          depends on input j only through some k with <M>{"m(j) \\le m(k) < m(i)"}</M>, so only on earlier inputs (<C>depends</C>,{" "}
          <C>is_autoregressive</C>). Causal attention masks (l5.2.2) and the masked convolutions of the next lesson enforce the
          same rule.
        </p>
        <Code>{MADE}</Code>
      </Definition>

      <Remark title="teacher forcing and its cost">
        <p>
          During training the prefix is always the true data, called <em>teacher forcing</em>, so all D losses come from one
          parallel pass. During sampling the prefix is the model&apos;s own output, so D sequential passes are needed, and early
          mistakes are never revised. This asymmetry, cheap exact likelihood against slow sampling, is the defining trade-off of
          autoregressive models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "table",
      rung: "check",
      prompt: <p>How many free parameters does a full joint probability table over 10 binary variables have?</p>,
      answer: { kind: "numeric", value: 1023, tolerance: 0 },
    },
    {
      key: "logistic",
      rung: "check",
      prompt: (
        <p>
          An autoregressive model of 10 binary variables uses logistic regression for each conditional: a bias plus one weight
          per earlier variable. How many parameters in total?
        </p>
      ),
      answer: { kind: "numeric", value: 55, tolerance: 0 },
    },
    {
      key: "speed",
      rung: "apply",
      prompt: <p>Why can an autoregressive model compute the loss on a training sequence in one pass but needs many passes to sample?</p>,
      answer: {
        kind: "choice",
        options: [
          "In training every prefix is known from the data, so all conditionals are computed at once under a mask; in sampling each prefix contains the model's own earlier outputs",
          "Sampling uses a larger network than training",
          "Training ignores all but the last conditional",
          "Masks are removed during sampling, which makes the network slower",
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
from itertools import product

def ar_log_prob(x, cond):
    lp = 0.0
    for i, b in enumerate(x):
        p = cond(x[:i])
        lp += math.log(p if b == 1 else 1 - p)
    return lp

def ar_sample(cond, n, us):
    x = []
    for i in range(n):
        x.append(1 if us[i] < cond(x) else 0)
    return x

def total_probability(cond, n):
    return sum(math.exp(ar_log_prob(list(s), cond)) for s in product([0, 1], repeat=n))

cond = lambda prefix: 0.5 if not prefix else (0.9 if prefix[-1] == 1 else 0.2); print(round(ar_log_prob([1, 1, 0], cond), 4))
print(ar_sample(cond, 4, [0.3, 0.95, 0.1, 0.5]), round(total_probability(cond, 3), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-3.1011\n[1, 0, 1, 1] 1.0",
          "-0.6539\n[1, 0, 1, 1] 1.0",
          "-3.1011\n[1, 1, 0, 1] 1.0",
          "-3.1011\n[1, 0, 1, 1] 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def made_masks(order, hidden_degrees):
    deg = [0] * len(order)
    for pos, d in enumerate(order):
        deg[d] = pos + 1
    m1 = [[1 if h >= g else 0 for g in deg] for h in hidden_degrees]
    m2 = [[1 if g > h else 0 for h in hidden_degrees] for g in deg]
    return m1, m2

def depends(m1, m2):
    D, H = len(m2), len(m1)
    return [[int(any(m2[o][k] and m1[k][i] for k in range(H))) for i in range(D)] for o in range(D)]

def is_autoregressive(dep, order):
    pos = {d: p for p, d in enumerate(order)}
    n = len(dep)
    return all(not dep[o][i] or pos[i] < pos[o] for o in range(n) for i in range(n))

m1, m2 = made_masks([0, 1, 2], [1, 2]); print(m1, m2)
dep = depends(m1, m2); print(dep, is_autoregressive(dep, [0, 1, 2]), is_autoregressive(dep, [2, 1, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 0, 0], [1, 1, 0]] [[0, 0], [1, 0], [1, 1]]\n[[0, 0, 0], [1, 0, 0], [1, 1, 0]] True False",
          "[[1, 0, 0], [1, 1, 0]] [[0, 0], [1, 0], [1, 1]]\n[[0, 0, 0], [1, 0, 0], [1, 1, 0]] True True",
          "[[0, 1, 1], [0, 0, 1]] [[0, 0], [1, 0], [1, 1]]\n[[0, 0, 0], [1, 0, 0], [1, 1, 0]] True False",
          "[[1, 0, 0], [1, 1, 0]] [[1, 0], [1, 1], [1, 1]]\n[[1, 0, 0], [1, 1, 0], [1, 1, 1]] False False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For binary sequences and a function <C>cond(prefix)</C> giving the probability that the next bit is 1, write{" "}
          <C>ar_log_prob(x, cond)</C>; <C>ar_sample(cond, n, us)</C>, which sets bit i to 1 when <C>us[i] &lt; cond(prefix)</C>;
          and <C>total_probability(cond, n)</C>, the sum of the probabilities of all <M>{"2^n"}</M> sequences.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from itertools import product

def ar_log_prob(x, cond):
    return sum(math.log(cond([])) for b in x)

def ar_sample(cond, n, us):
    return [0] * n

def total_probability(cond, n):
    return 0.0
`,
        solution: CHAIN,
        tests: [
          { name: "log prob", code: `c = lambda p: 0.25 if len(p) % 2 == 0 else 0.5
assert abs(ar_log_prob([1, 0], c) - math.log(0.125)) < 1e-12 and abs(ar_log_prob([0, 1, 0], c) - math.log(0.75 * 0.5 * 0.75)) < 1e-12 and ar_log_prob([], c) == 0.0` },
          { name: "sample and total", code: `c = lambda p: 0.8 if sum(p) >= 1 else 0.3
assert ar_sample(c, 3, [0.5, 0.2, 0.9]) == [0, 1, 0] and ar_sample(c, 2, [0.1, 0.7]) == [1, 1]
assert abs(total_probability(c, 4) - 1) < 1e-12 and abs(total_probability(lambda p: 0.5, 1) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>made_masks(order, hidden_degrees)</C>, returning the input-to-hidden mask indexed [hidden][input] and the
          hidden-to-output mask indexed [output][hidden]; <C>depends(m1, m2)</C>, indexed [output][input]; and{" "}
          <C>is_autoregressive(dep, order)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def made_masks(order, hidden_degrees):
    D, H = len(order), len(hidden_degrees)
    return [[1] * D for _ in range(H)], [[1] * H for _ in range(D)]

def depends(m1, m2):
    return [[1] * len(m2) for _ in m2]

def is_autoregressive(dep, order):
    return True
`,
        solution: MADE,
        tests: [
          { name: "masks", code: `m1, m2 = made_masks([1, 0], [1, 1])
assert m1 == [[0, 1], [0, 1]] and m2 == [[1, 1], [0, 0]]
m1, m2 = made_masks([0, 1, 2], [2]); assert m1 == [[1, 1, 0]] and m2 == [[0], [0], [1]]` },
          { name: "dependencies", code: `m1, m2 = made_masks([2, 0, 1], [1, 2, 2])
d = depends(m1, m2); assert d == [[0, 0, 1], [1, 0, 1], [0, 0, 0]] and is_autoregressive(d, [2, 0, 1]) and not is_autoregressive(d, [0, 1, 2])
assert depends([[1, 1]], [[1], [0]]) == [[1, 1], [0, 0]] and not is_autoregressive([[1, 1], [0, 0]], [0, 1])` },
        ],
      },
    },
    {
      key: "marginal",
      rung: "stretch",
      prompt: (
        <p>
          A model of binary sequences sets the first bit to 1 with probability 0.5, and each later bit to 1 with probability 0.9
          if the previous bit is 1 and 0.2 if it is 0. What is the probability that the third bit is 1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.585, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        For images and audio the prefix is enormous: tens of thousands of pixels or samples. The next lesson shows how masked
        and dilated convolutions turn the chain rule into practical models of pixels and waveforms.
      </p>
    </>
  ),
};
