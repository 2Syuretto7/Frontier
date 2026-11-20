import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GrokkingViz } from "@/components/viz/GrokkingViz";
import type { LessonContent } from "@/lib/types";

const TASK = `import math
import random

def mod_add_pairs(p):
    return [(a, b, (a + b) % p) for a in range(p) for b in range(p)]

def split_pairs(pairs, frac, seed):
    shuffled = list(pairs)
    random.Random(seed).shuffle(shuffled)
    k = int(frac * len(shuffled))
    return shuffled[:k], shuffled[k:]

def fourier_logit(a, b, c, p, freqs):
    return sum(math.cos(2 * math.pi * k * (a + b - c) / p) for k in freqs)`;

const CIRCUIT = `import math

def expanded_logit(a, b, c, p, freqs):
    total = 0.0
    for k in freqs:
        w = 2 * math.pi * k / p
        cos_ab = math.cos(w * a) * math.cos(w * b) - math.sin(w * a) * math.sin(w * b)
        sin_ab = math.sin(w * a) * math.cos(w * b) + math.cos(w * a) * math.sin(w * b)
        total += cos_ab * math.cos(w * c) + sin_ab * math.sin(w * c)
    return total

def fourier_predict(a, b, p, freqs):
    scores = [expanded_logit(a, b, c, p, freqs) for c in range(p)]
    return max(range(p), key=lambda c: scores[c])

def fourier_accuracy(p, freqs):
    hits = sum(fourier_predict(a, b, p, freqs) == (a + b) % p for a in range(p) for b in range(p))
    return hits / (p * p)`;

export const lesson: LessonContent = {
  id: "l10.6.2",
  minutes: 55,
  links: {
    requires: ["l10.6.1", "l3.7.1"],
    revisits: ["m4.4.3", "l3.6.2", "m14.2.4"],
    foreshadows: ["l10.6.3", "m21.2.3", "l11.2.2"],
  },

  puzzle: (
    <>
      <p>
        Power et al. (2022) trained small transformers on tables of modular arithmetic, such as (a + b) mod 97, showing them only part of
        the table. The networks fitted their training data almost at once and stayed at chance on the held-out entries for thousands of
        steps. Then, long after the training loss had flattened, test accuracy jumped to 100%. They called this grokking. Why would a
        network that has nothing left to learn on its training set keep changing, and what does it change into?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two solutions fit the training set: a lookup table of the examples seen, and an algorithm for addition. The lookup table is
        found first because it is easy to reach. The algorithm generalises, and it is also more economical: it needs smaller weights.
        Weight decay keeps pulling the weights towards smaller norms, so even with the training loss at zero, it slowly trades the
        lookup table for the algorithm, and test accuracy follows. The figure shows real runs of a small network.
      </p>
      <GrokkingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the task">
        <p>
          The full table for modulus p has <M>{"p^2"}</M> entries (a, b, (a + b) mod p) (<C>mod_add_pairs</C>); a random fraction is used
          for training and the rest for testing (<C>split_pairs</C>). Every test entry is new, and no amount of memorising the training
          entries helps with it, so test accuracy above chance means the network has found the rule.
        </p>
        <Code>{TASK}</Code>
      </Definition>

      <Theorem title="the Fourier algorithm">
        <p>
          Let p be prime and K a non-empty set of frequencies in 1, …, p − 1. The score{" "}
          <M>{"s(c) = \\sum_{k \\in K} \\cos\\bigl(2\\pi k (a + b - c)/p\\bigr)"}</M> (<C>fourier_logit</C>) is maximised exactly at{" "}
          <M>{"c \\equiv a + b \\pmod p"}</M>, and it can be computed from products of sines and cosines of a, b and c alone.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each cosine is at most 1, with equality exactly when <M>{"k(a + b - c)"}</M> is a multiple of p. Since p is prime and{" "}
          <M>{"0 < k < p"}</M>, p divides <M>{"k(a+b-c)"}</M> only if it divides <M>{"a + b - c"}</M> (m4.4.3), so every term reaches 1 at{" "}
          <M>{"c \\equiv a+b"}</M> and none does elsewhere. With <M>{"\\omega = 2\\pi k/p"}</M>, the angle-sum formulas give{" "}
          <M>{"\\cos\\omega(a+b) = \\cos\\omega a\\cos\\omega b - \\sin\\omega a\\sin\\omega b"}</M>, similarly for the sine, and{" "}
          <M>{"\\cos\\omega(a+b-c) = \\cos\\omega(a+b)\\cos\\omega c + \\sin\\omega(a+b)\\sin\\omega c"}</M> (<C>expanded_logit</C>). Embeddings
          that map a to <M>{"(\\cos\\omega a, \\sin\\omega a)"}</M>, multiplications in a hidden layer, and an unembedding of c complete the
          algorithm, so the network classifies every pair correctly (<C>fourier_predict</C>, <C>fourier_accuracy</C>). Nanda et al. (2023)
          found that trained transformers implement this, using a handful of key frequencies.
        </p>
        <Code>{CIRCUIT}</Code>
      </Proof>

      <Remark title="why the switch is slow and why weight decay matters">
        <p>
          With decoupled weight decay at rate λ and learning rate η, a weight that receives no gradient shrinks by a factor{" "}
          <M>{"(1 - \\eta\\lambda)"}</M> per step (l3.6.2), halving every <M>{"\\ln 2/(\\eta\\lambda)"}</M> steps or so. Once the training loss
          is near zero, the gradient is tiny and this slow shrinkage dominates: weights that the lookup table relies on decay, and the
          Fourier circuit, which fits the data at smaller norm, grows to take over. Varma et al. (2023) formalised this as a competition
          between a memorising and a generalising circuit, with the generalising one more efficient. Nanda et al. tracked progress
          measures during training and found the Fourier circuit forming gradually during the apparently flat period, followed by a
          clean-up phase in which the memorised components were removed. More data makes memorisation costlier and grokking sooner;
          without weight decay, on small datasets, the switch may never come, as the figure shows.
        </p>
      </Remark>

      <Example title="beyond toy tasks">
        <p>
          Grokking has been seen on other algorithmic tasks and, under some settings, on image classification and other standard data
          (Liu et al., 2022). It is a vivid case of a general lesson: training curves of loss and accuracy can hide large changes in how a
          network computes, and internal measurements, such as the strength of the Fourier components here, can reveal them (l11.2.2).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "logit",
      rung: "check",
      prompt: (
        <p>
          With p = 7 and frequencies 1 and 3, what is the Fourier score <M>{"s(c)"}</M> for a = 2, b = 3 and c = 4? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.278, tolerance: 0.001 },
    },
    {
      key: "decay",
      rung: "check",
      prompt: (
        <p>
          With learning rate 0.003 and decoupled weight decay 1, a weight receives no gradient. After how many steps has it first fallen
          to half its size or less?
        </p>
      ),
      answer: { kind: "numeric", value: 231, tolerance: 0 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: (
        <p>
          During the long period of grokking where training accuracy is 100% and test accuracy is at chance, what is happening inside the
          network?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The generalising circuit is slowly forming while weight decay erodes the memorised solution; the change is hidden from accuracy curves",
          "Nothing: the weights are fixed once the training loss reaches zero",
          "The network is memorising the test set",
          "The learning rate has fallen to zero, so training has stopped",
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
import random

def mod_add_pairs(p):
    return [(a, b, (a + b) % p) for a in range(p) for b in range(p)]

def split_pairs(pairs, frac, seed):
    shuffled = list(pairs)
    random.Random(seed).shuffle(shuffled)
    k = int(frac * len(shuffled))
    return shuffled[:k], shuffled[k:]

def fourier_logit(a, b, c, p, freqs):
    return sum(math.cos(2 * math.pi * k * (a + b - c) / p) for k in freqs)

print(mod_add_pairs(3)[:4], len(mod_add_pairs(5)))
print(round(fourier_logit(1, 2, 3, 5, [1]), 3), round(fourier_logit(1, 2, 0, 5, [1, 2]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 0, 0), (0, 1, 1), (0, 2, 2), (1, 0, 1)] 25\n1.0 -0.5",
          "[(0, 0, 0), (0, 1, 1), (0, 2, 2), (1, 0, 1)] 10\n1.0 -0.5",
          "[(0, 0, 0), (1, 0, 1), (2, 0, 2), (0, 1, 1)] 25\n1.0 -0.5",
          "[(0, 0, 0), (0, 1, 1), (0, 2, 2), (1, 0, 1)] 25\n2.0 -0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def expanded_logit(a, b, c, p, freqs):
    total = 0.0
    for k in freqs:
        w = 2 * math.pi * k / p
        cos_ab = math.cos(w * a) * math.cos(w * b) - math.sin(w * a) * math.sin(w * b)
        sin_ab = math.sin(w * a) * math.cos(w * b) + math.cos(w * a) * math.sin(w * b)
        total += cos_ab * math.cos(w * c) + sin_ab * math.sin(w * c)
    return total

def fourier_predict(a, b, p, freqs):
    scores = [expanded_logit(a, b, c, p, freqs) for c in range(p)]
    return max(range(p), key=lambda c: scores[c])

def fourier_accuracy(p, freqs):
    hits = sum(fourier_predict(a, b, p, freqs) == (a + b) % p for a in range(p) for b in range(p))
    return hits / (p * p)

print(round(expanded_logit(2, 2, 1, 5, [1, 2]), 3), fourier_predict(3, 4, 7, [2]))
print(fourier_accuracy(7, [1]), fourier_predict(5, 9, 11, [2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.5 0\n1.0 3",
          "-0.5 7\n1.0 3",
          "1.0 0\n1.0 3",
          "-0.5 0\n1.0 14",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mod_add_pairs(p)</C> in the order a then b, <C>split_pairs(pairs, frac, seed)</C>, which shuffles a copy with{" "}
          <C>random.Random(seed).shuffle</C> and returns the first <C>int(frac * n)</C> as training and the rest as test, and{" "}
          <C>fourier_logit(a, b, c, p, freqs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import random

def mod_add_pairs(p):
    return []

def split_pairs(pairs, frac, seed):
    return pairs, []

def fourier_logit(a, b, c, p, freqs):
    return 0.0
`,
        solution: TASK,
        tests: [
          { name: "pairs", code: `ps = mod_add_pairs(4)\nassert len(ps) == 16 and ps[6] == (1, 2, 3) and ps[15] == (3, 3, 2)\ntr, te = split_pairs(ps, 0.25, 0)\nassert tr == [(2, 2, 0), (3, 2, 1), (1, 1, 2), (0, 1, 1)] and len(te) == 12` },
          { name: "logit", code: `assert abs(fourier_logit(0, 0, 0, 9, [1, 2, 4]) - 3.0) < 1e-12 and abs(fourier_logit(1, 5, 2, 7, [2]) - 0.6234898019) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expanded_logit(a, b, c, p, freqs)</C> using only sines and cosines of a, b and c separately,{" "}
          <C>fourier_predict(a, b, p, freqs)</C>, the first c with the highest score, and <C>fourier_accuracy(p, freqs)</C> over the
          whole table.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def expanded_logit(a, b, c, p, freqs):
    return 0.0

def fourier_predict(a, b, p, freqs):
    return 0

def fourier_accuracy(p, freqs):
    return 0.0
`,
        solution: CIRCUIT,
        tests: [
          { name: "expand", code: `assert abs(expanded_logit(1, 5, 2, 7, [2]) - 0.6234898019) < 1e-9 and abs(expanded_logit(0, 0, 0, 9, [1, 2, 4]) - 3.0) < 1e-12` },
          { name: "predict", code: `assert fourier_predict(5, 9, 11, [2]) == 3 and fourier_accuracy(11, [3, 5]) == 1.0` },
        ],
      },
    },
    {
      key: "ties",
      rung: "stretch",
      prompt: (
        <p>
          The proof needed p prime. With p = 12 and the single frequency k = 4, for fixed a and b, how many residues c in 0, …, 11 achieve
          the maximum score of 1?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Grokking shows test performance changing long after the training error stops. The next lesson finds another surprise in test
        error, as model size grows past the point where the training data can be fitted exactly.
      </p>
    </>
  ),
};
