import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SftLossWeightViz } from "@/components/viz/SftLossWeightViz";
import type { LessonContent } from "@/lib/types";

const LOSS = `def response_mask(n_prompt, n_total):
    return [0] * n_prompt + [1] * (n_total - n_prompt)

def masked_nll(token_nll, mask):
    return sum(x * m for x, m in zip(token_nll, mask)) / sum(mask)

def batch_loss(examples, per_token=True):
    if per_token:
        total = sum(x * m for nll, mask in examples for x, m in zip(nll, mask))
        return total / sum(sum(mask) for _, mask in examples)
    return sum(masked_nll(nll, mask) for nll, mask in examples) / len(examples)`;

const HYGIENE = `def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def overlap(sample, bench_grams, n):
    grams = [tuple(sample[i:i + n]) for i in range(len(sample) - n + 1)]
    return sum(g in bench_grams for g in grams) / len(grams)

def dedup(texts):
    seen, out = set(), []
    for t in texts:
        key = " ".join(t.lower().split())
        if key not in seen:
            seen.add(key)
            out.append(t)
    return out`;

export const lesson: LessonContent = {
  id: "l9.1.1",
  minutes: 45,
  links: {
    requires: ["l8.7.1", "l8.1.2"],
    revisits: ["l8.1.1", "l0.5.2"],
    foreshadows: ["l9.1.2", "l9.1.3", "l9.2.2", "l10.1.3"],
  },

  puzzle: (
    <>
      <p>
        A pretrained model continues text; asked a question, it may answer, or write five more questions in the same style. The
        LIMA paper turned a 65-billion-parameter base model into a capable assistant with only 1,000 carefully chosen examples,
        while other projects used millions. If a thousand examples can do it, what are the examples teaching, and what makes
        one dataset better than another?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Supervised fine-tuning continues next-token training on conversations in which a user asks and an assistant answers.
        Most of the knowledge is already in the base model; the examples mainly teach a format and a manner: answer the
        question that was asked, at a suitable length, in the assistant&apos;s voice. So the loss is applied only to the assistant&apos;s
        tokens, and the choice of examples, their variety, quality and length, shapes behaviour more than their number.
      </p>
      <SftLossWeightViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the fine-tuning loss">
        <p>
          Each example is a token sequence with a mask that is 1 on response tokens and 0 on prompt tokens (<C>response_mask</C>). Its
          loss is the mean negative log-likelihood over masked-in tokens (<C>masked_nll</C>). A batch can average over all response
          tokens together, or average each example first and then the examples (<C>batch_loss</C>). Implementations differ on this,
          and with gradient accumulation the two can be mixed by accident.
        </p>
        <Code>{LOSS}</Code>
      </Definition>

      <Theorem title="token averaging weights examples by length">
        <p>
          If example i has <M>{"n_i"}</M> response tokens and mean loss <M>{"L_i"}</M>, the token-averaged batch loss is{" "}
          <M>{"\\sum_i (n_i/N) L_i"}</M> with <M>{"N = \\sum_i n_i"}</M>, while the example-averaged loss is <M>{"\\frac1m\\sum_i L_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The token average is the total loss over N tokens, <M>{"\\frac1N\\sum_i n_i L_i"}</M>, since example i contributes <M>{"n_i L_i"}</M>. The two
          agree when all <M>{"n_i"}</M> are equal. Otherwise token averaging lets long responses dominate the gradient, and example
          averaging gives each token of a long response less weight, which can under-train long outputs.
        </p>
      </Proof>

      <Remark title="where instruction data comes from">
        <p>
          InstructGPT&apos;s fine-tuning set was about 13 thousand prompts with demonstrations written by contracted labellers.
          FLAN converted existing NLP datasets into instructions with templates, growing to more than 1,800 tasks. Self-Instruct
          had a model generate 52 thousand instructions from 175 human seeds, and Alpaca used the same recipe with a stronger
          model as the writer. LIMA argued, from its 1,000 examples, that alignment is largely superficial: the base model knows
          what to say and fine-tuning selects how to say it. Open recipes such as Tülu 3 now mix hundreds of thousands of
          prompts by skill, much of it synthetic, written or filtered by strong models.
        </p>
      </Remark>

      <Definition title="data hygiene">
        <p>
          Duplicates over-weight a few examples, so near-identical texts are removed, at minimum after normalising case and
          whitespace (<C>dedup</C>). Fine-tuning data that overlaps an evaluation set inflates scores, so samples are checked for
          shared n-grams (<C>ngrams</C>) against every benchmark, and those whose overlap fraction exceeds a threshold are dropped
          (<C>overlap</C>). Synthetic prompts are a common source of leakage, since a model asked to write maths problems may
          reproduce problems it saw.
        </p>
        <Code>{HYGIENE}</Code>
      </Definition>

      <Example title="what a mixture balances">
        <p>
          A modern mixture has slices for general chat, mathematics, code, instruction following with constraints (&quot;answer in
          three bullet points&quot;), multilingual data, safety and refusals, and tool use. Each slice is sized by ablation, as for
          pretraining data (l8.1.2): adding mathematics improves mathematics benchmarks and can degrade chat quality, and adding
          too many refusals makes the model refuse harmless requests (l9.8.3).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "avg",
      rung: "check",
      prompt: (
        <p>
          A batch holds three examples with 20, 50 and 130 response tokens and mean losses 1.8, 1.2 and 0.9 nats. By how much does
          the example-averaged loss exceed the token-averaged loss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.235, tolerance: 0.001 },
    },
    {
      key: "overlap",
      rung: "check",
      prompt: <p>A 30-token sample shares 7 of its 8-grams with a benchmark. What fraction of its 8-grams overlap? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.304, tolerance: 0.001 },
    },
    {
      key: "lima",
      rung: "apply",
      prompt: <p>What does the success of LIMA&apos;s 1,000 examples suggest about supervised fine-tuning?</p>,
      answer: {
        kind: "choice",
        options: [
          "Most capability comes from pretraining; fine-tuning mainly teaches the format and style of responses, so quality and diversity of examples matter more than quantity",
          "Fine-tuning data teaches most of the knowledge a model uses",
          "Any 1,000 examples are as good as a million",
          "Larger models need fewer pretraining tokens",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def response_mask(n_prompt, n_total):
    return [0] * n_prompt + [1] * (n_total - n_prompt)

def masked_nll(token_nll, mask):
    return sum(x * m for x, m in zip(token_nll, mask)) / sum(mask)

def batch_loss(examples, per_token=True):
    if per_token:
        total = sum(x * m for nll, mask in examples for x, m in zip(nll, mask))
        return total / sum(sum(mask) for _, mask in examples)
    return sum(masked_nll(nll, mask) for nll, mask in examples) / len(examples)

m = response_mask(2, 5)
print(m, masked_nll([9.0, 9.0, 1.0, 2.0, 3.0], m))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 0, 1, 1, 1] 2.0\n3.0 3.5",
          "[0, 0, 1, 1, 1] 4.8\n3.0 3.5",
          "[1, 1, 0, 0, 0] 9.0\n3.0 3.5",
          "[0, 0, 1, 1, 1] 2.0\n3.5 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ngrams(tokens, n):
    return {tuple(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

def overlap(sample, bench_grams, n):
    grams = [tuple(sample[i:i + n]) for i in range(len(sample) - n + 1)]
    return sum(g in bench_grams for g in grams) / len(grams)

def dedup(texts):
    seen, out = set(), []
    for t in texts:
        key = " ".join(t.lower().split())
        if key not in seen:
            seen.add(key)
            out.append(t)
    return out

print(batch_loss([([1.0, 3.0], [1, 1]), ([5.0], [1])]), batch_loss([([1.0, 3.0], [1, 1]), ([5.0], [1])], False))
print(sorted(ngrams([1, 2, 1, 2], 2)), overlap([1, 2, 3, 4], {(2, 3), (9, 9)}, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 2), (2, 1)] 0.3333333333333333\n['Hi  there', 'Bye']",
          "[(1, 2), (1, 2), (2, 1)] 0.3333333333333333\n['Hi  there', 'Bye']",
          "[(1, 2), (2, 1)] 0.25\n['Hi  there', 'Bye']",
          "[(1, 2), (2, 1)] 0.3333333333333333\n['Hi  there', 'hi there', 'Bye']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>response_mask(n_prompt, n_total)</C>, <C>masked_nll(token_nll, mask)</C> and <C>batch_loss(examples, per_token=True)</C>, where
          each example is a pair (token losses, mask).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def response_mask(n_prompt, n_total):
    return [1] * n_total

def masked_nll(token_nll, mask):
    return sum(token_nll) / len(token_nll)

def batch_loss(examples, per_token=True):
    return sum(masked_nll(nll, mask) for nll, mask in examples) / len(examples)
`,
        solution: LOSS,
        tests: [
          { name: "mask", code: `m = response_mask(3, 6)\nassert m == [0, 0, 0, 1, 1, 1] and abs(masked_nll([5.0, 5.0, 5.0, 1.0, 2.0, 6.0], m) - 3.0) < 1e-12` },
          { name: "batch", code: `ex = [([4.0, 2.0, 0.0], [0, 1, 1]), ([3.0, 3.0, 3.0, 7.0], [1, 1, 1, 1])]\nassert abs(batch_loss(ex) - 3.0) < 1e-12 and abs(batch_loss(ex, False) - 2.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngrams(tokens, n)</C> returning a set of tuples, <C>overlap(sample, bench_grams, n)</C> and <C>dedup(texts)</C>, which keeps
          the first of any texts equal after lower-casing and collapsing whitespace.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ngrams(tokens, n):
    return set(tokens)

def overlap(sample, bench_grams, n):
    return 0.0

def dedup(texts):
    return list(set(texts))
`,
        solution: HYGIENE,
        tests: [
          { name: "grams", code: `assert ngrams(["a", "b", "c", "a", "b"], 3) == {("a", "b", "c"), ("b", "c", "a"), ("c", "a", "b")}\nassert abs(overlap([5, 6, 7, 8, 9], {(6, 7, 8), (1, 2, 3)}, 3) - 1 / 3) < 1e-12` },
          { name: "dedup", code: `assert dedup(["A b", "c", "a   B", "C ", "d"]) == ["A b", "c", "d"]` },
        ],
      },
    },
    {
      key: "prompt",
      rung: "stretch",
      prompt: (
        <p>
          An example has a 400-token prompt with mean loss 2.5 nats and a 100-token response with mean loss 1.0 nats. If the prompt
          is not masked and the loss is averaged over all tokens, what fraction of the example&apos;s loss comes from prompt tokens?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.909, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        An example is a conversation, but the model sees only tokens. The next lesson shows how roles, turns and tool calls are
        turned into a token sequence, and why getting that template exactly right matters.
      </p>
    </>
  ),
};
