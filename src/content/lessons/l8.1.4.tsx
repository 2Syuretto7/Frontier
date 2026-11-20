import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FimViz } from "@/components/viz/FimViz";
import type { LessonContent } from "@/lib/types";

const FIM = `def fim_psm(doc, i, j):
    prefix, middle, suffix = doc[:i], doc[i:j], doc[j:]
    return "<PRE>" + prefix + "<SUF>" + suffix + "<MID>" + middle

def fim_spm(doc, i, j):
    prefix, middle, suffix = doc[:i], doc[i:j], doc[j:]
    return "<PRE><SUF>" + suffix + "<MID>" + prefix + middle

def fim_undo(s):
    rest = s[len("<PRE>"):]
    prefix, rest = rest.split("<SUF>", 1)
    suffix, middle = rest.split("<MID>", 1)
    return prefix + middle + suffix`;

const REPO = `def ngrams(text, n):
    w = text.split()
    return {tuple(w[k:k + n]) for k in range(len(w) - n + 1)}

def contaminated(doc, bench_ngrams, n):
    return len(ngrams(doc, n) & bench_ngrams) > 0

def topo_order(deps):
    order, done = [], set()
    while len(order) < len(deps):
        ready = sorted(f for f in deps if f not in done and all(d in done for d in deps[f]))
        if not ready:
            raise ValueError("cycle")
        order.append(ready[0])
        done.add(ready[0])
    return order`;

export const lesson: LessonContent = {
  id: "l8.1.4",
  minutes: 50,
  links: {
    requires: ["l8.1.2", "l5.2.2"],
    revisits: ["l8.1.3", "m9.8.1"],
    foreshadows: ["l8.7.1", "l13.1.1"],
  },

  puzzle: (
    <>
      <p>
        Code is a few percent of the web, yet frontier pretraining mixtures give it a sixth or more of their tokens, and
        mathematics is up-weighted just as heavily. Models trained this way get better at code and maths, as expected, but
        also at reasoning in plain English. What makes these sources different, and what has to change in the pipeline to use
        them well?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Code and mathematics are text in which every step must follow from the ones before. Predicting the next line of a
        proof or a function forces a model to track variables, scopes and long chains of dependence, and those skills carry
        over to other tasks. They also have structure that plain web text lacks: files depend on other files, and real
        editing happens in the middle of a document, not only at its end. The pipeline has to respect both.
      </p>
      <FimViz />
    </>
  ),

  theory: (
    <>
      <Definition title="fill-in-the-middle">
        <p>
          Pick two cut points in a document and split it into prefix, middle and suffix. The prefix-suffix-middle (PSM) format
          trains on <C>{"<PRE>"}</C> prefix <C>{"<SUF>"}</C> suffix <C>{"<MID>"}</C> middle (<C>fim_psm</C>); the suffix-prefix-middle (SPM) format puts
          the suffix first, so that prefix and middle are contiguous (<C>fim_spm</C>). The transform is invertible (<C>fim_undo</C>). Applied
          to a fraction of documents, typically half, with cuts at character level, it teaches infilling while leaving the
          ordinary left-to-right loss essentially unchanged, the finding Bavarian and colleagues called FIM for free.
        </p>
        <Code>{FIM}</Code>
      </Definition>

      <Theorem title="the expected middle is a third of the document">
        <p>
          If the two cut points are independent and uniform on a document of length L, then the expected length of each of
          prefix, middle and suffix is L/3.
        </p>
      </Theorem>
      <Proof>
        <p>
          Two uniform points split [0, L] into three gaps whose joint distribution is symmetric under permuting the gaps, since
          the ordered pair of points is uniform on a triangle that the three gap lengths parametrise symmetrically. The gaps sum
          to L, so each has mean L/3. Directly: <M>{"\\mathbb{E}|U_1 - U_2| = L/3"}</M> for independent uniforms.
        </p>
      </Proof>

      <Definition title="repository-level data">
        <p>
          A file read alone often calls functions defined elsewhere. Packing the files of a repository into one context in
          dependency order, every file after the files it imports, lets the model see definitions before uses. The order is a
          topological sort of the import graph (<C>topo_order</C>, here with alphabetical tie-breaking so that it is
          deterministic); cycles, which real repositories contain, are broken arbitrarily. DeepSeek-Coder trained on data
          prepared this way.
        </p>
        <Code>{REPO}</Code>
      </Definition>

      <Remark title="mathematics from the web">
        <p>
          Mathematical text is scattered across the web in forums, lecture notes and papers, and is easily destroyed by
          extraction that drops LaTeX. DeepSeekMath built a 120-billion-token maths corpus by training a fastText classifier on
          a seed set, recalling pages from Common Crawl, labelling the domains that yielded many hits, and retraining, over
          four rounds. The resulting 7-billion-parameter model matched far larger general models on competition mathematics,
          which shows how much of mathematical ability depends on the data rather than the scale.
        </p>
      </Remark>

      <Definition title="decontamination">
        <p>
          Code and maths benchmarks are small and widely copied, so their problems leak into web crawls. A standard guard is to
          drop or flag any training document that shares a long word n-gram with a benchmark item (<C>ngrams</C>,{" "}
          <C>contaminated</C>); GPT-3 used 13-grams and later reports use n between about 8 and 13. Shorter n catches paraphrases
          but flags innocent overlaps such as common idioms and boilerplate code; longer n misses rewritten copies.
          Contamination that survives inflates benchmark scores, a problem l8.6.3 returns to.
        </p>
      </Definition>

      <Example title="does code help language?">
        <p>
          Aryabumi and colleagues trained models with and without code in the mixture and evaluated them on tasks with no code
          at all. Including code improved natural-language reasoning and world-knowledge scores by relative margins of several
          percent, and the gains survived continued training on text. The usual explanation is that code supplies dense,
          checkable examples of multi-step structure, though the mechanism is not settled.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mid",
      rung: "check",
      prompt: <p>FIM cuts a 1,000-character document at two independent uniform points. What is the expected length of the middle span, in characters? Give one decimal.</p>,
      answer: { kind: "numeric", value: 333.3, tolerance: 0.1 },
    },
    {
      key: "grams",
      rung: "check",
      prompt: <p>How many word 13-grams, counted with repetition, does a document of 2,000 words contain?</p>,
      answer: { kind: "numeric", value: 1988, tolerance: 0 },
    },
    {
      key: "spm",
      rung: "apply",
      prompt: <p>Why can FIM be applied to half the training documents without hurting ordinary left-to-right generation much?</p>,
      answer: {
        kind: "choice",
        options: [
          "The reordered sequence is still trained left to right on every token, so the model keeps practising ordinary next-token prediction on the prefix, the suffix and the middle",
          "The loss is masked on all FIM documents, so they contribute nothing",
          "FIM only applies to code, which is a small part of the mixture",
          "The sentinel tokens are removed before the loss is computed",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fim_psm(doc, i, j):
    prefix, middle, suffix = doc[:i], doc[i:j], doc[j:]
    return "<PRE>" + prefix + "<SUF>" + suffix + "<MID>" + middle

def fim_spm(doc, i, j):
    prefix, middle, suffix = doc[:i], doc[i:j], doc[j:]
    return "<PRE><SUF>" + suffix + "<MID>" + prefix + middle

def fim_undo(s):
    rest = s[len("<PRE>"):]
    prefix, rest = rest.split("<SUF>", 1)
    suffix, middle = rest.split("<MID>", 1)
    return prefix + middle + suffix

print(fim_psm("abcdef", 2, 4), fim_spm("abcdef", 2, 4))
print(fim_undo(fim_psm("hello", 1, 3)), len(fim_psm("xyz", 0, 3)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "<PRE>ab<SUF>ef<MID>cd <PRE><SUF>ef<MID>abcd\nhello 18",
          "<PRE>ab<SUF>ef<MID>cd <PRE><SUF>ef<MID>cdab\nhello 18",
          "<PRE>ab<SUF>cd<MID>ef <PRE><SUF>ef<MID>abcd\nhello 18",
          "<PRE>ab<SUF>ef<MID>cd <PRE><SUF>ef<MID>abcd\nhlloe 18",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ngrams(text, n):
    w = text.split()
    return {tuple(w[k:k + n]) for k in range(len(w) - n + 1)}

def contaminated(doc, bench_ngrams, n):
    return len(ngrams(doc, n) & bench_ngrams) > 0

def topo_order(deps):
    order, done = [], set()
    while len(order) < len(deps):
        ready = sorted(f for f in deps if f not in done and all(d in done for d in deps[f]))
        if not ready:
            raise ValueError("cycle")
        order.append(ready[0])
        done.add(ready[0])
    return order

print(len(ngrams("a b c a b c", 2)), contaminated("x a b y", ngrams("a b c", 2), 2), contaminated("x a b y", ngrams("a b c", 3), 3))
print(topo_order({"main": ["util", "model"], "model": ["util"], "util": [], "app": []}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 True False\n['app', 'util', 'model', 'main']",
          "5 True False\n['app', 'util', 'model', 'main']",
          "3 True True\n['app', 'util', 'model', 'main']",
          "3 True False\n['util', 'model', 'main', 'app']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fim_psm(doc, i, j)</C> and <C>fim_spm(doc, i, j)</C> with middle <C>doc[i:j]</C> and the sentinels shown in the text, and{" "}
          <C>fim_undo(s)</C>, which recovers the document from a PSM string.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fim_psm(doc, i, j):
    return "<PRE>" + doc

def fim_spm(doc, i, j):
    return "<PRE><SUF>" + doc

def fim_undo(s):
    return s
`,
        solution: FIM,
        tests: [
          { name: "formats", code: `assert fim_psm("012345", 1, 3) == "<PRE>0<SUF>345<MID>12" and fim_spm("012345", 1, 3) == "<PRE><SUF>345<MID>012"` },
          { name: "undo", code: `d = "def f(x):\\n    return x + 1\\n"\nassert all(fim_undo(fim_psm(d, i, j)) == d for i in range(len(d)) for j in range(i, len(d) + 1))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ngrams(text, n)</C>, the set of word n-gram tuples, <C>contaminated(doc, bench_ngrams, n)</C>, and{" "}
          <C>topo_order(deps)</C>, which repeatedly emits the alphabetically first file whose dependencies are all emitted and
          raises <C>ValueError</C> if none is ready.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ngrams(text, n):
    return set(text.split())

def contaminated(doc, bench_ngrams, n):
    return False

def topo_order(deps):
    return sorted(deps)
`,
        solution: REPO,
        tests: [
          { name: "ngrams", code: `assert ngrams("the cat sat on the mat", 3) == {("the", "cat", "sat"), ("cat", "sat", "on"), ("sat", "on", "the"), ("on", "the", "mat")}\nassert contaminated("we sat on the mat today", ngrams("the cat sat on the mat", 3), 3)` },
          { name: "order", code: `deps = {"utils": [], "models": ["utils"], "data": ["utils"], "train": ["models", "data"], "cli": ["train"], "readme": []}\nassert topo_order(deps) == ["readme", "utils", "data", "models", "train", "cli"]\ntry:\n    topo_order({"a": ["b"], "b": ["a"]})\n    assert False\nexcept ValueError:\n    pass` },
        ],
      },
    },
    {
      key: "orders",
      rung: "stretch",
      prompt: (
        <p>
          A repository has six files: utils; models and data, which both import utils; train, which imports models and data; cli,
          which imports train; and a readme that imports nothing. How many orderings of the six files put every file after all
          the files it imports?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The data chapter is done: what the loss measures, which tokens to keep, how often to repeat them, and how to treat code
        and maths. The next chapter turns to the model that reads them, starting with the trio of changes that every modern
        transformer has adopted.
      </p>
    </>
  ),
};
