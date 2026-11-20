import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VocabTradeoffViz } from "@/components/viz/VocabTradeoffViz";
import type { LessonContent } from "@/lib/types";

const COST = `def embed_params(V, d, tied=True):
    return V * d * (1 if tied else 2)            # input embedding, plus a separate output matrix if untied

def flops_per_byte(N, V, d, bytes_per_token):
    return 2 * (N + V * d) / bytes_per_token     # forward pass: body plus output layer, per byte of text

def best_vocab(compression, N, d):
    return min(compression, key=lambda V: flops_per_byte(N, V, d, compression[V]))`;

const FAIR = `def fertility(tokens, words):
    return {lang: tokens[lang] / words[lang] for lang in tokens}   # tokens per word

def premium(fert, base):
    return {lang: f / fert[base] for lang, f in fert.items()}      # cost of the same content relative to base

def undertrained(tok_counts, model_counts, min_count):
    return sorted(t for t, c in tok_counts.items() if c > 0 and model_counts.get(t, 0) < min_count)`;

export const lesson: LessonContent = {
  id: "e11.5.3",
  minutes: 45,
  links: {
    requires: ["e11.5.2", "l5.1.1"],
    revisits: ["e11.2.3", "e11.1.2"],
    foreshadows: ["e11.5.4", "e11.6.1"],
  },

  puzzle: (
    <>
      <p>
        Two teams pick vocabulary sizes. One, training a small model for phones, picks 256,000 to cover many languages, and finds that
        half its parameters sit in the embedding table. The other, training a very large model, keeps a 32,000-token vocabulary and
        finds that its Hindi and Tamil users pay three times as much per sentence, and fit a third as much text in the context window.
        There is no single right size. What does vocabulary size trade against, and how can the trade be measured?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A bigger vocabulary packs more text into each token, so sequences are shorter and each forward pass covers more bytes. But
        every token type needs a row in the embedding and output matrices, and the output layer is computed for every token. For small
        models those matrices are a large share of the cost; for large models they are small next to the body. Who benefits from the
        compression depends on the tokeniser&apos;s training mix: languages it saw little of get split into many short tokens, which
        costs their users money and context.
      </p>
      <VocabTradeoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the cost of a vocabulary">
        <p>
          With V token types and width d, the embedding table holds Vd parameters, doubled if the output matrix is untied (
          <C>embed_params</C>). A forward pass costs about 2N FLOPs per token for the N body parameters, plus 2Vd for the output layer, so
          per byte of text it costs <M>{"2(N + Vd)/\\beta(V)"}</M>, where <M>{"\\beta(V)"}</M> is the average bytes per token (
          <C>flops_per_byte</C>). <C>best_vocab</C> picks the cheapest among measured options.
        </p>
        <Code>{COST}</Code>
      </Definition>

      <Theorem title="when a larger vocabulary pays">
        <p>
          Doubling V lowers the cost per byte exactly when{" "}
          <M>{"\\beta(2V)/\\beta(V) > (N + 2Vd)/(N + Vd)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The cost per byte at 2V is below that at V when <M>{"2(N + 2Vd)/\\beta(2V) < 2(N + Vd)/\\beta(V)"}</M>; rearranging gives the
          condition. The right side lies between 1 and 2, close to 1 when Vd is small next to N, so large models need only a small
          gain in compression to justify a larger vocabulary, while small models need a large one.
        </p>
      </Proof>

      <Definition title="fertility and its costs">
        <p>
          The fertility of a tokeniser on a language is its average number of tokens per word on parallel text (<C>fertility</C>), and
          the premium of a language is its fertility relative to a base language (<C>premium</C>). Tokens that are common in the
          tokeniser&apos;s training data but rare in the model&apos;s are left with untrained embeddings; <C>undertrained</C> lists
          tokens whose count in the model&apos;s data falls below a minimum.
        </p>
        <Code>{FAIR}</Code>
      </Definition>

      <Theorem title="what a premium costs">
        <p>
          For the same content, a language with premium p uses p times as many tokens as the base language, so it costs p times as
          much per request at a fixed price per token, and a context window of L tokens holds 1/p as much of it.
        </p>
      </Theorem>
      <Proof>
        <p>
          On parallel text with w words, the base language uses <M>{"f_0 w"}</M> tokens and the other{" "}
          <M>{"f w = p f_0 w"}</M>. Price and compute are proportional to tokens, and a window of L tokens holds{" "}
          <M>{"L/(f w)"}</M> as many such texts, a factor 1/p fewer.
        </p>
      </Proof>

      <Remark title="choices in practice">
        <p>
          Vocabularies have grown with models, from about 32,000 tokens to 100,000 to 260,000, partly for multilingual coverage.
          Balancing the tokeniser&apos;s training data across languages, rather than copying the model&apos;s mix (e11.2.3), lowers
          premiums. Splitting numbers into single digits makes arithmetic more regular; keeping runs of spaces as tokens makes indented code
          much cheaper (e11.1.2). Under-trained tokens, the so-called glitch tokens, make models behave strangely when they appear, and
          come from training the tokeniser on different data from the model. Avoiding a fixed vocabulary altogether is the subject of
          the next lesson.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          For the small model, 256,000 rows of embeddings cost more compute per byte than the compression saves, and a smaller vocabulary
          is cheaper. For the large model the output layer is a few per cent of the cost, so a larger vocabulary trained on a balanced
          multilingual mix would cut the premium for Hindi and Tamil at little cost.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>How many millions of parameters are in a tied embedding table with V = 128,000 and d = 4096?</p>,
      answer: { kind: "numeric", value: 524.288, tolerance: 0.001 },
    },
    {
      key: "premium",
      rung: "check",
      prompt: (
        <p>
          On parallel text of 100 words, a tokeniser uses 130 tokens for English and 300 for Hindi. What is Hindi&apos;s premium
          relative to English? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.308, tolerance: 0.001 },
    },
    {
      key: "glitch",
      rung: "apply",
      prompt: <p>Where do under-trained &quot;glitch&quot; tokens come from?</p>,
      answer: {
        kind: "choice",
        options: [
          "The tokeniser was trained on data where they were common, but they almost never appear in the model's training data",
          "They are bytes that are not valid UTF-8",
          "They are merges learned last",
          "They are produced by top-p sampling",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def embed_params(V, d, tied=True):
    return V * d * (1 if tied else 2)            # input embedding, plus a separate output matrix if untied

def flops_per_byte(N, V, d, bytes_per_token):
    return 2 * (N + V * d) / bytes_per_token     # forward pass: body plus output layer, per byte of text

def best_vocab(compression, N, d):
    return min(compression, key=lambda V: flops_per_byte(N, V, d, compression[V]))

comp = {32000: 3.9, 128000: 4.4, 256000: 4.6}
print(embed_params(1000, 8, False), best_vocab(comp, 1e8, 512), best_vocab(comp, 1e10, 4096), round(flops_per_byte(10, 2, 5, 4), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["16000 32000 128000 10.0", "8000 32000 128000 10.0", "16000 256000 256000 10.0", "16000 32000 32000 10.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fertility(tokens, words):
    return {lang: tokens[lang] / words[lang] for lang in tokens}   # tokens per word

def premium(fert, base):
    return {lang: f / fert[base] for lang, f in fert.items()}      # cost of the same content relative to base

def undertrained(tok_counts, model_counts, min_count):
    return sorted(t for t, c in tok_counts.items() if c > 0 and model_counts.get(t, 0) < min_count)

f = fertility({"en": 130, "hi": 390}, {"en": 100, "hi": 100})
print(f, premium(f, "en")["hi"], undertrained({"the": 900, "SolidGold": 40, "xyz": 0}, {"the": 10**6, "SolidGold": 2}, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'en': 1.3, 'hi': 3.9} 3.0 ['SolidGold']",
          "{'en': 1.3, 'hi': 3.9} 3.0 ['SolidGold', 'xyz']",
          "{'en': 1.3, 'hi': 3.9} 0.33 ['SolidGold']",
          "{'en': 130, 'hi': 390} 3.0 ['SolidGold']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed_params(V, d, tied=True)</C>; <C>flops_per_byte(N, V, d, bytes_per_token)</C>; and{" "}
          <C>best_vocab(compression, N, d)</C>, for a dict from vocabulary size to bytes per token.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def embed_params(V, d, tied=True):
    return V * d

def flops_per_byte(N, V, d, bytes_per_token):
    return 2 * N

def best_vocab(compression, N, d):
    return max(compression)
`,
        solution: COST,
        tests: [
          { name: "cost", code: `assert embed_params(10, 3) == 30 and embed_params(10, 3, False) == 60\nassert flops_per_byte(100, 10, 2, 4) == 60.0` },
          { name: "best", code: `c = {1000: 2.0, 4000: 3.0, 16000: 3.2}\nassert best_vocab(c, 10**5, 1000) == 1000 and best_vocab(c, 10**8, 100) == 16000 and best_vocab(c, 10**7, 1000) == 4000` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fertility(tokens, words)</C> for dicts keyed by language; <C>premium(fert, base)</C>; and{" "}
          <C>undertrained(tok_counts, model_counts, min_count)</C>, the sorted tokens present in the tokeniser&apos;s data that
          appear fewer than min_count times in the model&apos;s.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fertility(tokens, words):
    return {lang: 1.0 for lang in tokens}

def premium(fert, base):
    return {lang: 1.0 for lang in fert}

def undertrained(tok_counts, model_counts, min_count):
    return []
`,
        solution: FAIR,
        tests: [
          { name: "fertility", code: `f = fertility({"a": 50, "b": 150}, {"a": 40, "b": 60})\nassert f == {"a": 1.25, "b": 2.5} and premium(f, "a") == {"a": 1.0, "b": 2.0}` },
          { name: "glitch", code: `assert undertrained({"q": 5, "p": 9, "r": 0, "s": 3}, {"p": 100, "q": 1}, 2) == ["q", "s"]` },
        ],
      },
    },
    {
      key: "double",
      rung: "stretch",
      prompt: (
        <p>
          A model has N = 1 billion body parameters and width d = 2048, with a 50,000-token vocabulary giving 4.0 bytes per token. At
          least how many bytes per token must a 100,000-token vocabulary reach for the switch to lower compute per byte? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.372, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every vocabulary is a compromise fixed before training. The last tokeniser lesson looks at models that read raw bytes, and at
        how they recover the efficiency that tokens provide.
      </p>
    </>
  ),
};
