import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LangTemperatureViz } from "@/components/viz/LangTemperatureViz";
import type { LessonContent } from "@/lib/types";

const LID = `import math
from collections import Counter

def char_ngrams(text, n_max=3):
    t = f" {' '.join(text.lower().split())} "     # pad so word starts and ends become features
    return Counter(t[i:i + n] for n in range(1, n_max + 1) for i in range(len(t) - n + 1))

def train_nb(docs_by_lang, n_max=3):
    counts = {l: sum((char_ngrams(d, n_max) for d in ds), Counter()) for l, ds in docs_by_lang.items()}
    vocab = set().union(*counts.values())
    total_docs = sum(len(ds) for ds in docs_by_lang.values())
    model = {}
    for l, c in counts.items():
        denom = sum(c.values()) + len(vocab) + 1   # add-one smoothing, with one slot for unseen n-grams
        model[l] = (math.log(len(docs_by_lang[l]) / total_docs),
                    {g: math.log((k + 1) / denom) for g, k in c.items()}, math.log(1 / denom))
    return model

def predict(model, text, n_max=3):
    feats = char_ngrams(text, n_max)
    scores = {l: prior + sum(k * logp.get(g, unk) for g, k in feats.items()) for l, (prior, logp, unk) in model.items()}
    best = max(scores, key=scores.get)
    z = sum(math.exp(s - scores[best]) for s in scores.values())
    return best, 1 / z                            # the winner's posterior probability`;

const BALANCE = `def lang_probs(counts, alpha):
    w = {l: n ** alpha for l, n in counts.items()}   # alpha = 1: proportional; alpha = 0: uniform
    s = sum(w.values())
    return {l: v / s for l, v in w.items()}

def epochs_needed(counts, probs, budget):
    return {l: budget * probs[l] / counts[l] for l in counts}   # passes over each language's data

def doc_language(line_preds, threshold):
    chars = {}
    for lang, p, n in line_preds:
        if p >= threshold:                         # unsure lines do not vote
            chars[lang] = chars.get(lang, 0) + n
    total = sum(n for _, _, n in line_preds)
    if not chars:
        return "und", 0.0
    best = max(sorted(chars), key=chars.get)
    return best, chars[best] / total`;

export const lesson: LessonContent = {
  id: "e11.2.3",
  minutes: 45,
  links: {
    requires: ["e11.2.1", "m7.1.4"],
    revisits: ["m11.2.3", "l2.2.3"],
    foreshadows: ["e11.3.2", "e11.6.1"],
  },

  puzzle: (
    <>
      <p>
        A multilingual corpus is ninety per cent English by tokens. Its Swahili portion is a few billion tokens, a large share of it
        actually Arabic-script spam, code and pages in neighbouring languages that the identifier labelled Swahili with little
        confidence. And if the corpus is sampled in proportion to size, the model will see almost no Swahili at all. How are
        languages identified at this scale, and how should they be balanced?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Languages leave fingerprints in short character sequences: &quot;the&quot;, &quot;der&quot;, &quot;ção&quot;. A classifier over
        counts of character n-grams, trained on labelled text, identifies the language of a line in microseconds. Its confidence matters
        as much as its answer: short, mixed or unusual lines get low confidence and should not decide a document&apos;s label. Once
        languages are labelled, sampling them with probability proportional to their size raised to a power below one gives small
        languages more weight, at the cost of repeating their data.
      </p>
      <LangTemperatureViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a character n-gram classifier">
        <p>
          <C>char_ngrams</C> counts all substrings of length 1 to n of the lower-cased text padded with spaces. <C>train_nb</C>{" "}
          estimates, for each language l, a prior <M>{"\\pi_l"}</M> from document counts and n-gram probabilities with add-one
          smoothing, <M>{"\\theta_{l,g} = (c_{l,g} + 1)/(C_l + |V| + 1)"}</M>, where <M>{"c_{l,g}"}</M> counts n-gram g in language
          l, <M>{"C_l"}</M> is their total and V the vocabulary; the extra slot is the probability of an unseen n-gram.{" "}
          <C>predict</C> applies Bayes&apos; rule (m7.1.4) and returns the winning language with its posterior, computed stably by
          subtracting the largest score (m11.2.3).
        </p>
        <Code>{LID}</Code>
      </Definition>

      <Theorem title="naive Bayes is a linear classifier">
        <p>
          The score of language l for a text with n-gram counts <M>{"x_g"}</M> is{" "}
          <M>{"s_l = \\log \\pi_l + \\sum_g x_g \\log \\theta_{l,g}"}</M>, a linear function of x, and the posterior is{" "}
          <M>{"\\mathrm{softmax}(s)_l"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Treating n-grams as independent given the language,{" "}
          <M>{"p(x \\mid l) \\propto \\prod_g \\theta_{l,g}^{x_g}"}</M>, where the multinomial coefficient does not depend on l. By
          Bayes&apos; rule <M>{"p(l \\mid x) = \\pi_l\\, p(x \\mid l) / \\sum_m \\pi_m\\, p(x \\mid m)"}</M>; taking logs of numerator
          and denominator gives <M>{"e^{s_l}/\\sum_m e^{s_m}"}</M>. This is the same form as softmax regression (l2.2.3); fastText,
          used by most corpus pipelines, learns the weights directly instead of counting them.
        </p>
      </Proof>

      <Definition title="balancing languages">
        <p>
          <C>lang_probs</C> samples language l with probability proportional to <M>{"n_l^{\\alpha}"}</M>, where{" "}
          <M>{"n_l"}</M> is its token count. <C>epochs_needed</C> gives the passes over each language&apos;s data that a run of a given
          budget makes. <C>doc_language</C> labels a document from per-line predictions (language, probability, characters), letting
          only lines above a confidence threshold vote, and reports the winner&apos;s share of all characters.
        </p>
        <Code>{BALANCE}</Code>
      </Definition>

      <Theorem title="lowering α flattens the distribution">
        <p>
          For any two languages, <M>{"p_l/p_m = (n_l/n_m)^{\\alpha}"}</M>. So if <M>{"n_l > n_m"}</M>, lowering α lowers the ratio
          toward 1, and the share of the single largest language falls monotonically as α decreases from 1 to 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          The normalising constant cancels in the ratio. For the largest language L,{" "}
          <M>{"1/p_L = \\sum_m (n_m/n_L)^{\\alpha}"}</M>, and each term has base at most 1, so it does not decrease as α decreases;
          hence <M>{"p_L"}</M> does not increase, and it strictly decreases if any language is smaller.
        </p>
      </Proof>

      <Remark title="language identification in practice">
        <p>
          Pipelines usually run a fastText model trained on Wikipedia and other labelled text, often line by line, and keep documents
          whose top language clears a threshold such as 0.65. Errors concentrate in short texts, closely related languages, and
          low-resource languages, where web pages labelled with a language often turn out on inspection to be mostly other text. Mixed
          documents, such as code with comments or quotations, need line-level labels. Multilingual models have used α around 0.3 for
          languages; the mixture chapter returns to these weights (e11.6.1), and the same classifier design reappears for quality
          (e11.3.2).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Line-level identification with a confidence threshold removes the low-confidence lines that inflated the Swahili set, and
          inspecting a sample shows what remains. Sampling with α below one then gives Swahili far more than its size would, repeated
          over several passes, while English still dominates in absolute tokens.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "share",
      rung: "check",
      prompt: (
        <p>
          A corpus has 1600 billion English tokens and 100 billion Swahili tokens. With α = 0.5, what share of samples is Swahili? Give a
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.001 },
    },
    {
      key: "smooth",
      rung: "check",
      prompt: (
        <p>
          A language&apos;s n-gram counts total 990 and the vocabulary has 9 n-grams. What probability does <C>train_nb</C> give an
          n-gram never seen in this language? Give a decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.001, tolerance: 0.000001 },
    },
    {
      key: "threshold",
      rung: "apply",
      prompt: <p>Why let only confident lines vote on a document&apos;s language?</p>,
      answer: {
        kind: "choice",
        options: [
          "Short, mixed or unusual lines are often misidentified, and counting them can mislabel the document",
          "Confident lines are always longer",
          "The classifier cannot score short lines",
          "It makes the identifier run faster",
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
from collections import Counter

def char_ngrams(text, n_max=3):
    t = f" {' '.join(text.lower().split())} "     # pad so word starts and ends become features
    return Counter(t[i:i + n] for n in range(1, n_max + 1) for i in range(len(t) - n + 1))

def train_nb(docs_by_lang, n_max=3):
    counts = {l: sum((char_ngrams(d, n_max) for d in ds), Counter()) for l, ds in docs_by_lang.items()}
    vocab = set().union(*counts.values())
    total_docs = sum(len(ds) for ds in docs_by_lang.values())
    model = {}
    for l, c in counts.items():
        denom = sum(c.values()) + len(vocab) + 1   # add-one smoothing, with one slot for unseen n-grams
        model[l] = (math.log(len(docs_by_lang[l]) / total_docs),
                    {g: math.log((k + 1) / denom) for g, k in c.items()}, math.log(1 / denom))
    return model

def predict(model, text, n_max=3):
    feats = char_ngrams(text, n_max)
    scores = {l: prior + sum(k * logp.get(g, unk) for g, k in feats.items()) for l, (prior, logp, unk) in model.items()}
    best = max(scores, key=scores.get)
    z = sum(math.exp(s - scores[best]) for s in scores.values())
    return best, 1 / z                            # the winner's posterior probability

m = train_nb({"en": ["the cat and the dog", "this is the end"], "de": ["der hund und die katze", "das ist das ende"]})
print(sorted(char_ngrams("ab", 2).items()), predict(m, "the end")[0], predict(m, "die katze")[0], predict(m, "the")[1] > 0.5)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(' ', 2), (' a', 1), ('a', 1), ('ab', 1), ('b', 1), ('b ', 1)] en de True",
          "[(' a', 1), ('a', 1), ('ab', 1), ('b', 1), ('b ', 1)] en de True",
          "[(' ', 2), (' a', 1), ('a', 1), ('ab', 1), ('b', 1), ('b ', 1)] en en True",
          "[('a', 1), ('ab', 1), ('b', 1)] en de True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lang_probs(counts, alpha):
    w = {l: n ** alpha for l, n in counts.items()}   # alpha = 1: proportional; alpha = 0: uniform
    s = sum(w.values())
    return {l: v / s for l, v in w.items()}

def epochs_needed(counts, probs, budget):
    return {l: budget * probs[l] / counts[l] for l in counts}   # passes over each language's data

def doc_language(line_preds, threshold):
    chars = {}
    for lang, p, n in line_preds:
        if p >= threshold:                         # unsure lines do not vote
            chars[lang] = chars.get(lang, 0) + n
    total = sum(n for _, _, n in line_preds)
    if not chars:
        return "und", 0.0
    best = max(sorted(chars), key=chars.get)
    return best, chars[best] / total

p, (lang, share) = lang_probs({"en": 900, "sw": 100}, 0.5), doc_language([("en", 0.9, 50), ("fr", 0.95, 30), ("de", 0.4, 40)], 0.5)
print({l: round(v, 2) for l, v in p.items()}, round(epochs_needed({"en": 900, "sw": 100}, p, 400)["sw"], 2), lang, round(share, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'en': 0.75, 'sw': 0.25} 1.0 en 0.42",
          "{'en': 0.9, 'sw': 0.1} 0.4 en 0.42",
          "{'en': 0.75, 'sw': 0.25} 1.0 en 0.62",
          "{'en': 0.75, 'sw': 0.25} 1.0 fr 0.42",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>char_ngrams(text, n_max=3)</C>, collapsing whitespace before padding; <C>train_nb(docs_by_lang, n_max=3)</C>,
          mapping each language to (log prior, dict of log probabilities, log probability of an unseen n-gram); and{" "}
          <C>predict(model, text, n_max=3)</C>, returning (language, posterior).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from collections import Counter

def char_ngrams(text, n_max=3):
    return Counter(text.split())

def train_nb(docs_by_lang, n_max=3):
    return {l: (0.0, {}, 0.0) for l in docs_by_lang}

def predict(model, text, n_max=3):
    return next(iter(model)), 1.0
`,
        solution: LID,
        tests: [
          { name: "ngrams", code: `assert char_ngrams("A  b", 2) == Counter({" ": 3, "a": 1, "b": 1, " a": 1, "a ": 1, " b": 1, "b ": 1})\nm = train_nb({"x": ["a"], "y": ["b", "b"]}, 1)\nassert abs(m["x"][0] - math.log(1 / 3)) < 1e-12 and abs(m["x"][1]["a"] - math.log(2 / 7)) < 1e-12 and abs(m["y"][2] - math.log(1 / 10)) < 1e-12` },
          { name: "predict", code: `m = train_nb({"en": ["the house is here", "where is the"], "es": ["la casa es aqui", "donde esta la"]})\nl, p = predict(m, "the house")\nassert l == "en" and 0.5 < p <= 1 and predict(m, "la casa")[0] == "es"\nm2 = {"u": (math.log(0.5), {"a": math.log(0.5)}, math.log(0.5)), "v": (math.log(0.5), {"a": math.log(0.25)}, math.log(0.5))}\nl, p = predict(m2, "a", 1)\nassert l == "u" and abs(p - 2 / 3) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lang_probs(counts, alpha)</C>; <C>epochs_needed(counts, probs, budget)</C>; and{" "}
          <C>doc_language(line_preds, threshold)</C>, returning (&quot;und&quot;, 0.0) when no line is confident and breaking ties
          by the alphabetically first language.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lang_probs(counts, alpha):
    return {l: 1 / len(counts) for l in counts}

def epochs_needed(counts, probs, budget):
    return {l: 1.0 for l in counts}

def doc_language(line_preds, threshold):
    return "und", 0.0
`,
        solution: BALANCE,
        tests: [
          { name: "probs", code: `p = lang_probs({"a": 8, "b": 1}, 1 / 3)\nassert abs(p["a"] - 2 / 3) < 1e-12 and lang_probs({"a": 5, "b": 1}, 0) == {"a": 0.5, "b": 0.5}\nassert epochs_needed({"a": 10, "b": 2}, {"a": 0.5, "b": 0.5}, 8) == {"a": 0.4, "b": 2.0}` },
          { name: "doc", code: `assert doc_language([("x", 0.3, 10)], 0.5) == ("und", 0.0)\nassert doc_language([("b", 0.7, 20), ("a", 0.6, 20), ("c", 0.1, 40)], 0.5) == ("a", 0.25)` },
        ],
      },
    },
    {
      key: "alpha",
      rung: "stretch",
      prompt: (
        <p>
          A corpus has 10,000 billion tokens of one language and 100 billion of another. What is the largest α for which the small
          language gets at least a quarter of the samples? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.239, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With text extracted and labelled by language, the next chapter decides which documents are good enough to keep, starting with
        cheap rules about length, symbols and repetition.
      </p>
    </>
  ),
};
