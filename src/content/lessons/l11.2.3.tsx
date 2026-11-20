import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InductionPhaseViz } from "@/components/viz/InductionPhaseViz";
import type { LessonContent } from "@/lib/types";

const MEASURE = `def make_repeated(seq):
    return list(seq) + list(seq)

def induction_score(pattern, n):
    return sum(pattern[i][i - n + 1] for i in range(n, 2 * n)) / n

def icl_score(losses, early, late):
    return losses[late] - losses[early]`;

const RULE = `def prev_tokens(tokens):
    return [None] + list(tokens[:-1])

def induction_prediction(tokens):
    preds = []
    for i, t in enumerate(tokens):
        js = [j for j in range(i) if tokens[j] == t]
        preds.append(tokens[js[-1] + 1] if js else None)
    return preds

def accuracy(preds, tokens):
    pairs = [(p, tokens[i + 1]) for i, p in enumerate(preds[:-1]) if p is not None]
    return sum(p == t for p, t in pairs) / len(pairs) if pairs else None`;

export const lesson: LessonContent = {
  id: "l11.2.3",
  minutes: 55,
  links: {
    requires: ["l11.2.2", "l5.6.2"],
    revisits: ["l5.6.1", "l8.6.1", "l10.6.2"],
    foreshadows: ["l11.2.4", "l11.5.2"],
  },

  puzzle: (
    <>
      <p>
        Training curves of small language models show a bump: for a while the loss falls steadily, then for a short stretch it falls
        faster, and afterwards the model is much better at using earlier parts of its context. The bump happens at about the same point
        in models of very different sizes. What forms during the bump, and how could you show that it is responsible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An induction head completes patterns of the form [A][B] … [A] → [B]: it finds an earlier occurrence of the current token and
        copies whatever came next. The earlier lesson built one by hand from two heads, a previous-token head in one layer feeding the
        keys of a copying head in the next. Here the question is empirical: do trained models really learn this circuit, when, and how
        do we know it is the circuit and not something that merely behaves like it?
      </p>
      <InductionPhaseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measuring induction">
        <p>
          Feed a random sequence of n tokens followed by an exact repeat (<C>make_repeated</C>). A head&apos;s induction score is its mean
          attention, over positions i in the repeat, to position i − n + 1, the token after the earlier copy (<C>induction_score</C>). On
          real text, the in-context learning score compares the loss at a late token position with that at an early one (
          <C>icl_score</C>); a negative score means later tokens are predicted better because more context is available.
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Definition title="the rule being learned">
        <p>
          The behaviour an induction head implements can be written down without any network: look back to the latest earlier
          occurrence of the current token and predict the token that followed it (<C>induction_prediction</C>, built from{" "}
          <C>prev_tokens</C>, which is what the previous-token head supplies). Its accuracy on a sequence (<C>accuracy</C>) is the ceiling
          an exact induction mechanism can reach, and comparing a model with it separates induction from other strategies.
        </p>
        <Code>{RULE}</Code>
      </Definition>

      <Theorem title="a fixed-offset shortcut does not generalise">
        <p>
          If every training sequence repeats at the same offset n, a single attention head that attends by position alone, from i to{" "}
          <M>{"i - n + 1"}</M>, achieves the same accuracy as an induction head on that data. When the offset varies, no head that attends
          by position alone can do so for all offsets.
        </p>
      </Theorem>
      <Proof>
        <p>
          With a fixed offset, the token at <M>{"i - n + 1"}</M> is always the correct next token in the repeat, and positions alone
          identify it, so a head with a QK circuit on positional embeddings can attend there and copy. With offsets n and n′, the
          correct source for position i is <M>{"i - n + 1"}</M> in one sequence and <M>{"i - n' + 1"}</M> in another, but a head that
          uses only positions gives the same pattern in both, so it is wrong on at least one. This is why the experiment in the
          visualisation varies the length of the repeated segment: in a first version with a fixed offset, the trained model used the
          positional shortcut and ablating its first layer barely hurt.
        </p>
      </Proof>

      <Remark title="the evidence that induction heads drive in-context learning">
        <p>
          Olsson and colleagues gave several lines of evidence in real models. The heads form during a short phase change early in
          training, visible as a bump in the loss curve (l8.6.1), and the in-context learning score jumps at the same point.
          Architectural changes that make the circuit easier to form, such as letting one layer see the previous token directly, move the
          phase change earlier. Ablating the heads at test time removes much of the in-context learning in small models. In larger models
          the same heads also perform fuzzy induction, copying patterns rather than exact tokens, such as translating word by word. For
          the largest models the evidence is correlational, which is why the patching methods of the next lesson matter.
        </p>
      </Remark>

      <Example title="the experiment, read">
        <p>
          In the visualisation the repeat loss falls only slowly for over a thousand steps, then drops within a few hundred,
          as the previous-token and induction scores rise together: two heads that are useless alone become useful together, so neither
          has a gradient until the other partly exists, which is one explanation of the plateau (compare grokking, l10.6.2). Ablating the
          first layer&apos;s head at the end destroys the second head&apos;s induction pattern and returns the repeat loss to near its
          plateau value, which is causal evidence that the two heads form one circuit.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "icl",
      rung: "check",
      prompt: (
        <p>
          A model&apos;s mean loss is 3.2 at token position 50 and 2.6 at position 500 of its context. What is its in-context learning
          score?
        </p>
      ),
      answer: { kind: "numeric", value: -0.6, tolerance: 0.001 },
    },
    {
      key: "uniform",
      rung: "check",
      prompt: (
        <p>
          Sequences are 200 random tokens from a vocabulary of 1000, then the same 200 again. A model that has learned nothing predicts
          uniformly. What is its mean loss on the first copy, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.908, tolerance: 0.001 },
    },
    {
      key: "evidence",
      rung: "apply",
      prompt: (
        <p>
          A head in layer 5 has a high induction score on repeated random tokens. Which additional result most strengthens the claim that
          it implements induction through K-composition with an earlier head?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Ablating a previous-token head in an earlier layer removes the layer-5 head's induction pattern while leaving the head intact",
          "The layer-5 head has a large weight norm",
          "The layer-5 head also attends strongly to the first token",
          "The model's loss on natural text is low",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def make_repeated(seq):
    return list(seq) + list(seq)

def induction_score(pattern, n):
    return sum(pattern[i][i - n + 1] for i in range(n, 2 * n)) / n

def icl_score(losses, early, late):
    return losses[late] - losses[early]

P = [[1, 0, 0, 0], [.5, .5, 0, 0], [0, .8, .2, 0], [0, .1, .6, .3]]
print(make_repeated([5, 7, 9]), round(induction_score(P, 2), 3), icl_score([5.0, 4.0, 3.0, 2.5], 0, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 7, 9, 5, 7, 9] 0.7 -2.5",
          "[5, 7, 9, 5, 7, 9] 0.4 -2.5",
          "[5, 7, 9, 5, 7, 9] 0.7 2.5",
          "[5, 5, 7, 7, 9, 9] 0.7 -2.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def prev_tokens(tokens):
    return [None] + list(tokens[:-1])

def induction_prediction(tokens):
    preds = []
    for i, t in enumerate(tokens):
        js = [j for j in range(i) if tokens[j] == t]
        preds.append(tokens[js[-1] + 1] if js else None)
    return preds

def accuracy(preds, tokens):
    pairs = [(p, tokens[i + 1]) for i, p in enumerate(preds[:-1]) if p is not None]
    return sum(p == t for p, t in pairs) / len(pairs) if pairs else None

toks = [4, 8, 4, 2]
print(prev_tokens(toks), induction_prediction(toks), accuracy(induction_prediction(toks), toks))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[None, 4, 8, 4] [None, None, 8, None] 0.0",
          "[None, 4, 8, 4] [None, None, 8, None] 1.0",
          "[4, 8, 4, None] [None, None, 8, None] 0.0",
          "[None, 4, 8, 4] [None, None, 4, None] 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>make_repeated(seq)</C>, returning a list of the sequence followed by itself; <C>induction_score(pattern, n)</C> for
          a 2n by 2n attention pattern; and <C>icl_score(losses, early, late)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def make_repeated(seq):
    return list(seq)

def induction_score(pattern, n):
    return 0.0

def icl_score(losses, early, late):
    return 0.0
`,
        solution: MEASURE,
        tests: [
          { name: "score", code: `P = [[1, 0, 0, 0, 0, 0], [.5, .5, 0, 0, 0, 0], [.2, .3, .5, 0, 0, 0], [.1, .6, .1, .2, 0, 0], [0, .1, .7, .1, .1, 0], [.1, 0, .3, .5, .05, .05]]\nassert abs(induction_score(P, 3) - 0.6) < 1e-12` },
          { name: "other", code: `assert make_repeated((1, 2)) == [1, 2, 1, 2]\nassert abs(icl_score([4.0, 3.5, 3.0, 2.0, 1.8], 1, 4) + 1.7) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prev_tokens(tokens)</C>, with None at position 0; <C>induction_prediction(tokens)</C>, the token after the latest
          earlier occurrence of each token, or None; and <C>accuracy(preds, tokens)</C>, the share of positions i before the last with a
          prediction where it equals token i + 1, or None if there are none.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def prev_tokens(tokens):
    return list(tokens)

def induction_prediction(tokens):
    return [None] * len(tokens)

def accuracy(preds, tokens):
    return None
`,
        solution: RULE,
        tests: [
          { name: "rule", code: `t = [1, 2, 3, 1, 2, 3, 1, 4]\nassert prev_tokens(t) == [None, 1, 2, 3, 1, 2, 3, 1]\nassert induction_prediction(t) == [None, None, None, 2, 3, 1, 2, None]` },
          { name: "accuracy", code: `t = [1, 2, 3, 1, 2, 3, 1, 4]\nassert abs(accuracy(induction_prediction(t), t) - 0.75) < 1e-12 and accuracy([None, None], [1, 2]) is None` },
        ],
      },
    },
    {
      key: "false",
      rung: "stretch",
      prompt: (
        <p>
          In a sequence of 50 independent uniformly random tokens from a vocabulary of 1000, how many positions are expected to hold a
          token that already occurred earlier, so that an induction head fires on a coincidence? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.206, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Ablation showed the first head matters. The next lesson makes such interventions precise: patching activations from one input
        into a run on another to locate exactly where a behaviour is computed.
      </p>
    </>
  ),
};
