import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PerplexityViz } from "@/components/viz/PerplexityViz";
import type { LessonContent } from "@/lib/types";

const PP = `import math

def perplexity(probs):
    return 2 ** (-sum(math.log2(q) for q in probs) / len(probs))

def bits_per_byte(nats_per_token, n_tokens, n_bytes):
    return nats_per_token * n_tokens / (n_bytes * math.log(2))

def mean_doc_ppl(docs):
    return sum(perplexity(d) for d in docs) / len(docs)`;

const TK = `from collections import Counter
import math

def unigram_bits(tokens):
    n, c = len(tokens), Counter(tokens)
    return -sum(k * math.log2(k / n) for k in c.values())

def report(text, tokens):
    bits = unigram_bits(tokens)
    return round(bits / len(tokens), 3), round(2 ** (bits / len(tokens)), 2), round(bits / len(text.encode()), 3)`;

export const lesson: LessonContent = {
  id: "m12.4.2",
  minutes: 45,
  links: {
    requires: ["m12.4.1"],
    revisits: ["m12.1.2", "m12.2.2"],
    foreshadows: ["m12.4.3"],
  },

  puzzle: (
    <>
      <p>
        Model A reports a perplexity of 12 on a test set and model B a perplexity of 30 on the same text. Is A better? Not
        necessarily: if B&apos;s tokeniser cuts the text into half as many tokens, each of B&apos;s tokens carries twice as much
        text, and B may compress the text better. What quantity can be compared across tokenisers, and what exactly is a
        perplexity of 12 measuring?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A perplexity of 12 means the model is, on average, as uncertain as if it were choosing uniformly among 12 tokens at
        every step. It is the loss in disguise: 2 raised to the bits per token, or e raised to the nats per token. Because
        the unit is a token, it depends on what a token is. Multiplying bits per token by tokens per byte gives bits per
        byte, which only depends on the text and the model&apos;s total code length, so it is the fair score.
      </p>
      <PerplexityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="perplexity">
        <p>
          The perplexity of a predictor q on tokens <M>{"x_1, \\dots, x_n"}</M> is
        </p>
        <MD>{"\\mathrm{PPL} = 2^{L_q / n} = \\Bigl(\\prod_{t=1}^{n} \\frac{1}{q(x_t \\mid x_{<t})}\\Bigr)^{1/n} = \\exp(\\text{mean loss in nats}),"}</MD>
        <p>the geometric mean of the inverse probabilities given to the tokens that occurred.</p>
      </Definition>

      <Theorem title="perplexity counts effective choices">
        <p>
          A predictor that is uniform over K tokens has perplexity K on every text it supports. If the tokens are drawn
          independently from P and predicted with a fixed q, then{" "}
          <M>{"\\log_2 \\mathrm{PPL} \\to H(P) + D(P \\,\\|\\, q) \\ge H(P)"}</M> almost surely, so the perplexity tends to at
          least <M>{"2^{H(P)}"}</M>, with equality only when q = P.
        </p>
      </Theorem>
      <Proof>
        <p>
          The uniform case is <M>{"(K^n)^{1/n} = K"}</M>. In general <M>{"\\log_2 \\mathrm{PPL} = \\frac1n\\sum_t -\\log_2 q(x_t)"}</M>{" "}
          is an average of independent terms with mean <M>{"\\mathbb E_P[-\\log_2 q(X)] = H(P) + D(P \\,\\|\\, q)"}</M>, so the strong
          law of large numbers gives the limit, and Gibbs&apos; inequality gives D ≥ 0 with equality only at q = P.
        </p>
      </Proof>

      <Theorem title="bits per byte">
        <p>
          If a text of B bytes is tokenised into n tokens and a model spends <M>{"\\ell"}</M> nats per token, its total code
          length is <M>{"n\\ell / \\ln 2"}</M> bits, so
        </p>
        <MD>{"\\text{bits per byte} = \\frac{n}{B}\\cdot\\frac{\\ell}{\\ln 2}."}</MD>
        <p>
          Two models evaluated on the same bytes are compared fairly by bits per byte, whatever their tokenisers, while their
          perplexities per token are not comparable.
        </p>
      </Theorem>
      <Proof>
        <p>
          The total is n tokens times <M>{"\\ell/\\ln 2"}</M> bits each; divide by B. Bits per byte is the length of an arithmetic
          code for the same file divided by its size, a property of the model and the text alone. One subtlety: a token model
          could in principle also give probability to non-standard tokenisations of the same bytes, so its true probability of
          the byte string is at least that of the standard tokenisation, and the reported bits per byte is an upper bound.
        </p>
        <Code>{PP}</Code>
      </Proof>

      <Remark title="averaging perplexities">
        <p>
          Perplexity is a geometric mean, so a single token given probability <M>{"10^{-10}"}</M> adds 33 bits to the total:
          in a hundred tokens otherwise predicted with probability 0.9 it lifts the perplexity from 1.11 to 1.40. And averaging
          per-document perplexities is not the same as the corpus perplexity. For documents of equal length the mean of the
          perplexities is at least the corpus value by the AM–GM inequality, but with unequal lengths it can go either way.
          Always report the total code length over total tokens, or better, over total bytes.
        </p>
      </Remark>

      <Remark title="plug-in numbers flatter large vocabularies">
        <p>
          Fitting a unigram model to a text and scoring the same text shows the trap: a word-level model gets far fewer bits
          per byte than a character-level one because it is allowed to memorise the vocabulary for free. A fair comparison
          scores held-out text, or charges for the model itself, which is the next lesson. For reference, Shannon&apos;s 1951
          guessing experiments put printed English at roughly 0.6 to 1.3 bits per character.
        </p>
        <Code>{TK}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: <p>A language model has mean test loss 2.0 nats per token. What is its perplexity? Give three decimals.</p>,
      answer: { kind: "numeric", value: 7.389, tolerance: 0.001 },
    },
    {
      key: "bpb",
      rung: "check",
      prompt: (
        <p>
          A model scores 0.9 nats per token, and its tokeniser averages 4 bytes per token. What is its bits per byte? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.325, tolerance: 0.001 },
    },
    {
      key: "fair",
      rung: "apply",
      prompt: <p>Two models with different tokenisers are evaluated on the same test file. Which comparison is fair?</p>,
      answer: {
        kind: "choice",
        options: [
          "Bits per byte, the total code length of the file divided by its size",
          "Perplexity per token, because both models see the same text",
          "Loss in nats per token, because it does not depend on the base of the logarithm",
          "The probability each model gives to the first token",
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

def perplexity(probs):
    return 2 ** (-sum(math.log2(q) for q in probs) / len(probs))

def bits_per_byte(nats_per_token, n_tokens, n_bytes):
    return nats_per_token * n_tokens / (n_bytes * math.log(2))

def mean_doc_ppl(docs):
    return sum(perplexity(d) for d in docs) / len(docs)

p = [0.5, 0.25, 0.25, 0.125]; print(perplexity([0.25] * 10), round(perplexity(p), 3), round(bits_per_byte(2.0, 1000, 4000), 3))
docs = [[0.5, 0.5], [0.25] * 4]; print(mean_doc_ppl(docs), round(perplexity(docs[0] + docs[1]), 2))
print(round(perplexity([0.9] * 100), 3), round(perplexity([1e-10] + [0.9] * 99), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 4.0 0.721\n3.0 3.17\n1.111 1.397",
          "4.0 4.0 0.5\n3.0 3.17\n1.111 1.397",
          "4.0 4.0 0.721\n3.0 3.0\n1.111 1.397",
          "4.0 4.0 0.721\n3.0 3.17\n1.111 1.111",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter
import math

def unigram_bits(tokens):
    n, c = len(tokens), Counter(tokens)
    return -sum(k * math.log2(k / n) for k in c.values())

def report(text, tokens):
    bits = unigram_bits(tokens)
    return round(bits / len(tokens), 3), round(2 ** (bits / len(tokens)), 2), round(bits / len(text.encode()), 3)

text = "to be or not to be"; print(report(text, list(text)), report(text, text.split()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.594, 6.04, 2.594) (1.918, 3.78, 0.639)",
          "(2.594, 6.04, 2.594) (1.918, 3.78, 1.918)",
          "(2.594, 6.04, 0.324) (1.918, 3.78, 0.639)",
          "(2.594, 5.0, 2.594) (1.918, 4.0, 0.639)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>perplexity(probs)</C> from the probabilities given to the observed tokens;{" "}
          <C>bits_per_byte(nats_per_token, n_tokens, n_bytes)</C>; and <C>mean_doc_ppl(docs)</C>, the plain average of the
          per-document perplexities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def perplexity(probs):
    return 1.0

def bits_per_byte(nats_per_token, n_tokens, n_bytes):
    return 0.0

def mean_doc_ppl(docs):
    return 1.0
`,
        solution: PP,
        tests: [
          { name: "perplexity", code: `assert abs(perplexity([0.5] * 3) - 2) < 1e-12 and abs(perplexity([1 / 3] * 5) - 3) < 1e-9
assert abs(perplexity([0.5, 0.125]) - 4) < 1e-12` },
          { name: "bytes", code: `assert abs(bits_per_byte(3 * math.log(2), 2, 6) - 1.0) < 1e-12
assert abs(mean_doc_ppl([[0.5], [0.25]]) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>unigram_bits(tokens)</C>, the code length of the tokens under their own empirical frequencies, and{" "}
          <C>report(text, tokens)</C> returning bits per token, perplexity and bits per byte, each rounded to 3, 2 and 3
          decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter
import math

def unigram_bits(tokens):
    return 0.0

def report(text, tokens):
    return 0.0, 1.0, 0.0
`,
        solution: TK,
        tests: [
          { name: "bits", code: `assert abs(unigram_bits(list("aab")) - (3 * math.log2(3) - 2)) < 1e-9 and unigram_bits(["x"] * 5) == 0` },
          { name: "report", code: `assert report("abab", list("abab")) == (1.0, 2.0, 1.0)
assert report("aa bb", ["aa", "bb"]) == (1.0, 2.0, 0.4)` },
        ],
      },
    },
    {
      key: "corpus",
      rung: "stretch",
      prompt: (
        <p>
          Document 1 has two tokens, each predicted with probability 0.5; document 2 has two tokens, each predicted with
          probability 0.1. The mean of the two document perplexities is 6. What is the perplexity of the whole corpus? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.472, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Scoring a model on the text it was fitted to lets a big enough model memorise everything for free. Minimum
        description length closes the loophole by charging for the model as well as the data, and turns compression into a
        principle for choosing between models.
      </p>
    </>
  ),
};
