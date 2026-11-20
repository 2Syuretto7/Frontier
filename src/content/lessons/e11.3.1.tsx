import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HeuristicFunnelViz } from "@/components/viz/HeuristicFunnelViz";
import type { LessonContent } from "@/lib/types";

const RULES = `STOP = {"the", "be", "to", "of", "and", "that", "have", "with"}

def gopher_stats(text):
    words, lines = text.split(), [l for l in text.splitlines() if l.strip()]
    n = max(len(words), 1)
    return {
        "words": len(words),
        "mean_len": sum(map(len, words)) / n,
        "symbols": (text.count("#") + text.count("...")) / n,
        "alpha": sum(any(c.isalpha() for c in w) for w in words) / n,
        "stop": len(STOP & {w.lower() for w in words}),
        "bullets": sum(l.lstrip().startswith(("-", "*", "•")) for l in lines) / max(len(lines), 1),
        "ellipsis": sum(l.rstrip().endswith(("...", "…")) for l in lines) / max(len(lines), 1),
    }

def gopher_fail(s):
    rules = {                                     # the thresholds of the Gopher rules
        "length": 50 <= s["words"] <= 100_000, "word_len": 3 <= s["mean_len"] <= 10,
        "symbols": s["symbols"] <= 0.1, "alpha": s["alpha"] >= 0.8, "stop": s["stop"] >= 2,
        "bullets": s["bullets"] <= 0.9, "ellipsis": s["ellipsis"] <= 0.3,
    }
    return [name for name, ok in rules.items() if not ok]

def c4_lines(text, min_words=3):
    keep = [l.strip() for l in text.splitlines()
            if l.strip().endswith((".", "!", "?", '"')) and len(l.split()) >= min_words]
    return "\\n".join(keep)`;

const REPEATS = `from collections import Counter

def dup_line_frac(text):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return (len(lines) - len(set(lines))) / max(len(lines), 1)   # lines that repeat an earlier one

def top_ngram_char_frac(words, n):
    grams = Counter(tuple(words[i:i + n]) for i in range(len(words) - n + 1))
    if not grams:
        return 0.0
    g, k = grams.most_common(1)[0]
    return k * sum(map(len, g)) / sum(map(len, words))

def dup_ngram_char_frac(words, n):
    seen, covered = set(), [False] * len(words)
    for i in range(len(words) - n + 1):
        g = tuple(words[i:i + n])
        if g in seen:                             # a repeat: mark its words, the first occurrence stays unmarked
            covered[i:i + n] = [True] * n
        seen.add(g)
    return sum(len(w) for w, c in zip(words, covered) if c) / max(sum(map(len, words)), 1)`;

export const lesson: LessonContent = {
  id: "e11.3.1",
  minutes: 45,
  links: {
    requires: ["e11.2.1", "l8.1.2"],
    revisits: ["e11.1.4", "e11.1.2"],
    foreshadows: ["e11.3.2", "e11.4.1"],
  },

  puzzle: (
    <>
      <p>
        After extraction and language identification, a crawl still contains product listings that are lists of prices, tag clouds,
        pages of hashtags, error messages, lorem ipsum, and spam that repeats one sentence a hundred times. A trained quality model
        could catch these, but it must run on billions of documents and needs labelled examples. How far do a dozen lines of rules get,
        and how should their thresholds be judged?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Natural prose has stable statistics. Its words average four to six letters, almost all contain letters, common function words
        such as &quot;the&quot; and &quot;of&quot; appear in any real paragraph, and lines rarely repeat. Junk breaks at least one of
        these: lists of links have few function words, tables are mostly numbers, spam repeats itself. Each rule is a cheap test of one
        statistic, and a document is kept only if it passes all of them.
      </p>
      <HeuristicFunnelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="document rules">
        <p>
          <C>gopher_stats</C> computes the statistics behind the rules used for DeepMind&apos;s Gopher data: word count, mean word
          length, symbols (# and ...) per word, the fraction of words containing a letter, how many of eight stop words appear, and the
          fractions of lines starting with a bullet or ending with an ellipsis. <C>gopher_fail</C> lists the rules a document breaks.{" "}
          <C>c4_lines</C> keeps only lines that end in terminal punctuation and have at least three words, as in the C4 data.
        </p>
        <Code>{RULES}</Code>
      </Definition>

      <Definition title="repetition">
        <p>
          <C>dup_line_frac</C> is the fraction of non-empty lines that repeat an earlier line. For a word sequence,{" "}
          <C>top_ngram_char_frac</C> is the fraction of characters taken by the occurrences of the most common n-gram, and{" "}
          <C>dup_ngram_char_frac</C> the fraction of characters in words covered by an n-gram that has occurred before. Gopher removes
          documents above thresholds that decrease with n, from 0.20 for the top bigram to 0.10 for duplicated 10-grams.
        </p>
        <Code>{REPEATS}</Code>
      </Definition>

      <Theorem title="order changes the report, not the result">
        <p>
          Applying rules <M>{"r_1, \\dots, r_k"}</M> in any order keeps the same documents, those passing every rule. The number removed
          by rule <M>{"r_i"}</M> in a given order lies between the number failing only <M>{"r_i"}</M> and the number failing{" "}
          <M>{"r_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The kept set is the intersection of the sets passing each rule, and intersection does not depend on order. Rule{" "}
          <M>{"r_i"}</M> removes the documents that fail it and pass every earlier rule. That includes every document failing only{" "}
          <M>{"r_i"}</M>, and is contained in the set failing <M>{"r_i"}</M>. So a funnel&apos;s per-rule counts should be read with
          the order in mind; the counts of documents failing only one rule show what each rule adds.
        </p>
      </Proof>

      <Theorem title="repeated blocks">
        <p>
          If a word sequence is k ≥ 2 copies of a block of m ≥ n words, then <C>dup_ngram_char_frac</C> with n is at least{" "}
          <M>{"(k - 1)/k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let the length be L = km. Take a word at position p in copy two or later, so p ≥ m, and let{" "}
          <M>{"i = \\min(p, L - n)"}</M>. Then i ≥ m since L − n ≥ 2m − m, and the n-gram at i covers p. It equals the n-gram at
          i − m, which occurred before, so p is covered. Copies two to k hold a fraction (k − 1)/k of the characters.
        </p>
      </Proof>

      <Remark title="rules in practice">
        <p>
          C4 also removed pages containing words from a block list, curly braces, &quot;lorem ipsum&quot; or javascript warnings, and
          pages with fewer than three sentences. RefinedWeb, FineWeb and DCLM all start with Gopher-style rules, and FineWeb added rules
          chosen by comparing statistics of kept and removed text, then checked each with small training runs. Rules cost almost
          nothing, but they are tuned on English prose and can remove legitimate text: code, poetry, lists and other languages. Learned
          classifiers (e11.3.2) catch what rules cannot, and near-duplicate removal (e11.4.1) handles repetition across documents
          rather than within one.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Price lists fail the alphabetic and stop-word rules, hashtag pages the symbol rule, spam the repetition rules, and fragments
          the length rule. Each rule&apos;s threshold is judged by reading samples of what it alone removes and by small ablation runs;
          what is left after the rules is the input to the more expensive quality model.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "symbols",
      rung: "check",
      prompt: <p>A document has 200 words, 15 hash signs and 10 ellipses. What is its symbol-to-word ratio? Give a decimal.</p>,
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
    {
      key: "duplines",
      rung: "check",
      prompt: <p>A document&apos;s non-empty lines are a, b, a, a, c. What is its duplicate-line fraction? Give a decimal.</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
    {
      key: "stop",
      rung: "apply",
      prompt: <p>What kind of junk does the stop-word rule catch that the length and symbol rules miss?</p>,
      answer: {
        kind: "choice",
        options: [
          "Long lists of keywords, product names or links, which contain no function words such as the, of and and",
          "Documents in a different script",
          "Pages with too many hash signs",
          "Text with very long words",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`STOP = {"the", "be", "to", "of", "and", "that", "have", "with"}

def gopher_stats(text):
    words, lines = text.split(), [l for l in text.splitlines() if l.strip()]
    n = max(len(words), 1)
    return {
        "words": len(words),
        "mean_len": sum(map(len, words)) / n,
        "symbols": (text.count("#") + text.count("...")) / n,
        "alpha": sum(any(c.isalpha() for c in w) for w in words) / n,
        "stop": len(STOP & {w.lower() for w in words}),
        "bullets": sum(l.lstrip().startswith(("-", "*", "•")) for l in lines) / max(len(lines), 1),
        "ellipsis": sum(l.rstrip().endswith(("...", "…")) for l in lines) / max(len(lines), 1),
    }

def gopher_fail(s):
    rules = {                                     # the thresholds of the Gopher rules
        "length": 50 <= s["words"] <= 100_000, "word_len": 3 <= s["mean_len"] <= 10,
        "symbols": s["symbols"] <= 0.1, "alpha": s["alpha"] >= 0.8, "stop": s["stop"] >= 2,
        "bullets": s["bullets"] <= 0.9, "ellipsis": s["ellipsis"] <= 0.3,
    }
    return [name for name, ok in rules.items() if not ok]

def c4_lines(text, min_words=3):
    keep = [l.strip() for l in text.splitlines()
            if l.strip().endswith((".", "!", "?", '"')) and len(l.split()) >= min_words]
    return "\\n".join(keep)

s = gopher_stats("# Deals\\n- buy now...\\n- the best...\\n- and more")
print(s["words"], s["stop"], round(s["bullets"], 2), gopher_fail(s), c4_lines("Click here\\nThe sun rose over the hills.\\nOk.").count("\\n"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "11 2 0.75 ['length', 'symbols', 'alpha', 'ellipsis'] 0",
          "11 2 0.75 ['length', 'symbols', 'alpha', 'bullets', 'ellipsis'] 0",
          "11 2 0.75 ['length', 'symbols', 'alpha', 'ellipsis'] 1",
          "8 2 0.75 ['length', 'symbols', 'ellipsis'] 0",
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

def dup_line_frac(text):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return (len(lines) - len(set(lines))) / max(len(lines), 1)   # lines that repeat an earlier one

def top_ngram_char_frac(words, n):
    grams = Counter(tuple(words[i:i + n]) for i in range(len(words) - n + 1))
    if not grams:
        return 0.0
    g, k = grams.most_common(1)[0]
    return k * sum(map(len, g)) / sum(map(len, words))

def dup_ngram_char_frac(words, n):
    seen, covered = set(), [False] * len(words)
    for i in range(len(words) - n + 1):
        g = tuple(words[i:i + n])
        if g in seen:                             # a repeat: mark its words, the first occurrence stays unmarked
            covered[i:i + n] = [True] * n
        seen.add(g)
    return sum(len(w) for w, c in zip(words, covered) if c) / max(sum(map(len, words)), 1)

w = "a b a b a b c".split()
print(round(dup_line_frac("x\\ny\\nx\\nx"), 2), round(top_ngram_char_frac(w, 2), 2), round(dup_ngram_char_frac(w, 2), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 0.86 0.57", "0.75 0.86 0.57", "0.5 0.43 0.57", "0.5 0.86 0.86"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gopher_stats(text)</C>, returning the dict of seven statistics with the keys shown, where line fractions count only
          non-empty lines; <C>gopher_fail(s)</C>, listing failed rules in the order shown; and <C>c4_lines(text, min_words=3)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `STOP = {"the", "be", "to", "of", "and", "that", "have", "with"}

def gopher_stats(text):
    return {"words": 0, "mean_len": 0.0, "symbols": 0.0, "alpha": 1.0, "stop": 0, "bullets": 0.0, "ellipsis": 0.0}

def gopher_fail(s):
    return []

def c4_lines(text, min_words=3):
    return text
`,
        solution: RULES,
        tests: [
          { name: "stats", code: `s = gopher_stats("The cat and 42\\n\\n* to be ...\\n# x")\nassert s == {"words": 10, "mean_len": 21 / 10, "symbols": 2 / 10, "alpha": 6 / 10, "stop": 4, "bullets": 1 / 3, "ellipsis": 1 / 3}\nassert gopher_stats("")["words"] == 0` },
          { name: "rules", code: `ok = {"words": 100, "mean_len": 5, "symbols": 0.0, "alpha": 0.9, "stop": 3, "bullets": 0.0, "ellipsis": 0.0}\nassert gopher_fail(ok) == [] and gopher_fail(dict(ok, words=49, stop=1, ellipsis=0.31)) == ["length", "stop", "ellipsis"]\nassert c4_lines(" One two three. \\nfour five\\nSix seven?\\nA b c d!") == "One two three.\\nA b c d!"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dup_line_frac(text)</C> over stripped non-empty lines; <C>top_ngram_char_frac(words, n)</C>, returning 0.0 when there
          are no n-grams; and <C>dup_ngram_char_frac(words, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def dup_line_frac(text):
    return 0.0

def top_ngram_char_frac(words, n):
    return 0.0

def dup_ngram_char_frac(words, n):
    return 0.0
`,
        solution: REPEATS,
        tests: [
          { name: "lines", code: `assert dup_line_frac(" a\\na \\n\\nb\\na") == 0.5 and dup_line_frac("") == 0.0\nassert top_ngram_char_frac(["xx", "y", "xx", "y", "z"], 2) == 6 / 7 and top_ngram_char_frac(["a"], 2) == 0.0` },
          { name: "dups", code: `assert dup_ngram_char_frac("p q r p q r".split(), 3) == 0.5 and dup_ngram_char_frac("aa b aa c".split(), 1) == 1 / 3\nassert dup_ngram_char_frac([], 2) == 0.0` },
        ],
      },
    },
    {
      key: "block",
      rung: "stretch",
      prompt: (
        <p>
          A spam page is one block of 20 distinct words repeated 5 times. What is its <C>dup_ngram_char_frac</C> with n = 5? Give a
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Rules see surface statistics only. The next lesson trains a classifier to recognise text that resembles a chosen reference,
        such as educational pages, and scores every document with it.
      </p>
    </>
  ),
};
