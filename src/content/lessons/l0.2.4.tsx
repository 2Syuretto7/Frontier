import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { BigramViz } from "@/components/viz/BigramViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.2.4",
  minutes: 50,
  links: {
    parallels: ["m0.8.3"],
    foreshadows: ["l5.1.1", "l7.1.1"],
  },

  puzzle: (
    <>
      <p>
        Here is a game. One person says a word. The next must say a word that could plausibly follow it, and so on round the
        room. &ldquo;The&rdquo; &rarr; &ldquo;cat&rdquo; &rarr; &ldquo;sat&rdquo; &rarr; &hellip;
      </p>
      <p>
        Nobody plans the sentence, and each person sees only the word before theirs. Will the result make sense? What would
        have to change for the game to produce whole paragraphs that read as if one person wrote them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With only one word of memory, the sentence wanders. It stays locally plausible, each pair of words fine, while the
        whole drifts or loops. Remember the last two words and it improves; the last hundred, and it can keep a topic; the last
        hundred thousand, and it can keep a whole argument together.
      </p>
      <p>
        That game is a generative model. Below, a computer plays it after reading just six sentences. It has counted which
        word followed which, and turns the counts into probabilities. Generate a few sentences.
      </p>
      <BigramViz />
      <p>
        Some sentences are copies of the training data, and some are new, assembled from pieces the model has seen. Raise
        the temperature and rarer choices appear more often; lower it and the model says the likeliest thing every time. A
        large language model plays exactly this game, choosing one word piece at a time, with a far better way of using
        everything that came before.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="generative model">
        <p>
          A <strong>generative model</strong> learns the patterns of a collection of data well enough to produce new
          examples that look as if they came from the same source: new sentences, images, pieces of music, molecules.
        </p>
      </Definition>

      <Definition title="next-word prediction">
        <p>
          A <strong>language model</strong> assigns a probability to each possible next word given the words so far:
          after &ldquo;the cat&rdquo;, &ldquo;sat&rdquo; might get 30% and &ldquo;volcano&rdquo; 0.001%. To generate, it
          picks a word at random according to these probabilities, adds it to the text, and repeats.
        </p>
      </Definition>

      <Example title="counting gives probabilities">
        <p>
          In the six training sentences, &ldquo;the&rdquo; is followed 10 times: by &ldquo;cat&rdquo; 4 times,
          &ldquo;dog&rdquo; 3 times, and &ldquo;mat&rdquo;, &ldquo;rug&rdquo; and &ldquo;fish&rdquo; once each. So the
          model gives &ldquo;cat&rdquo; probability <M>{"\\tfrac{4}{10}"}</M> after &ldquo;the&rdquo;. A model that looks
          only at the previous word is called a <strong>bigram</strong> model.
        </p>
      </Example>

      <Definition title="temperature">
        <p>
          <strong>Temperature</strong> reshapes the probabilities before sampling. Below 1, it makes likely words even
          likelier, and the text becomes safe and repetitive. Above 1, it flattens the probabilities, and the text becomes
          more varied and more error-prone. At temperature close to 0, the model always picks the single most likely word.
        </p>
      </Definition>

      <Remark title="plausible is not true">
        <p>
          A generative model is trained to produce what is <em>likely</em> given its data, not what is true. Asked about a
          book that does not exist, a language model can write a fluent summary of it, because fluent summaries of books are
          very likely text. These confident inventions are often called hallucinations, and reducing them is a central
          problem in building trustworthy models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "is-gen",
      rung: "check",
      prompt: <p>Select every task that is generation.</p>,
      answer: {
        kind: "choice",
        options: ["Producing a new image from the description “a red bicycle in the snow”", "Deciding whether an image contains a bicycle", "Writing a reply to an email", "Grouping images into clusters"],
        correct: [0, 2],
      },
    },
    {
      key: "prob",
      rung: "check",
      prompt: <p>In the six training sentences, what probability does the bigram model give to &ldquo;dog&rdquo; after &ldquo;the&rdquo;? Give a decimal.</p>,
      answer: { kind: "numeric", value: 0.3 },
    },
    {
      key: "sat",
      rung: "apply",
      prompt: <p>In the six training sentences, &ldquo;sat&rdquo; appears three times, always followed by &ldquo;on&rdquo;. What probability does the model give to &ldquo;on&rdquo; after &ldquo;sat&rdquo;?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "cold",
      rung: "apply",
      prompt: <p>At a temperature close to 0, which word does the model always choose after &ldquo;the&rdquo;?</p>,
      answer: { kind: "choice", options: ["cat", "dog", "mat", "fish"], correct: [0] },
    },
    {
      key: "two-step",
      rung: "apply",
      prompt: (
        <p>
          A sentence must start with &ldquo;the&rdquo; or &ldquo;a&rdquo;. In the training data, 5 of the 6 sentences start
          with &ldquo;the&rdquo;. What is the probability that a generated sentence begins &ldquo;the cat&rdquo;? Give a
          decimal to two places.
        </p>
      ),
      answer: { kind: "numeric", value: 1 / 3, tolerance: 0.02 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(0)
counts = {"a": 4, "b": 1}
text = "".join(random.choices(list(counts), weights=counts.values(), k=4000))
print(round(text.count("a") / len(text), 1))`}</Code>
          <p>A generative model samples from what it learned: 'a' four times as often as 'b'. What fraction of the output is 'a', to one decimal place?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bigram_model(text)</C>, which returns a dict from each character to a dict of counts of the characters that follow it, and <C>most_likely_next(model, ch)</C>, which returns the most frequent follower (ties broken by the alphabetically smallest).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bigram_model(text):
    return {}

def most_likely_next(model, ch):
    return ch
`,
        solution: `def bigram_model(text):
    model = {}
    for a, b in zip(text, text[1:]):
        model.setdefault(a, {})
        model[a][b] = model[a].get(b, 0) + 1
    return model

def most_likely_next(model, ch):
    follow = model[ch]
    return min(follow, key=lambda c: (-follow[c], c))
`,
        tests: [
          { name: "counts", code: `m = bigram_model('abab')
assert m == {'a': {'b': 2}, 'b': {'a': 1}}, 'Count each pair of neighbouring characters.'` },
          { name: "next", code: `m = bigram_model('the then there')
assert most_likely_next(m, 't') == 'h' and most_likely_next(m, 'h') == 'e', 'After t comes h every time.'` },
        ],
      },
    },
    {
      key: "memory",
      rung: "prove",
      prompt: (
        <p>
          Explain why a model that looks only at the previous word cannot reliably finish the sentence &ldquo;The keys to the
          old cabinet ___ on the table&rdquo; with &ldquo;are&rdquo; rather than &ldquo;is&rdquo;. What would the model need
          to see?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the previous word, 'cabinet', is singular, so a one-word model would favour 'is'.",
          "Explains that the verb must agree with 'keys', several words earlier.",
          "Concludes that the model needs to use words further back than one, ideally the whole sentence.",
        ],
      },
    },
    {
      key: "count-pairs",
      rung: "stretch",
      prompt: (
        <p>
          A bigram model for a language with a vocabulary of 50,000 words stores one count for every possible pair of words.
          How many counts is that, in billions?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5 },
    },
  ],

  teachBack:
    "Explain to a friend how a computer can write new sentences by predicting one word at a time, what temperature does, and why fluent text is not necessarily true.",

  glimpse: (
    <p>
      Next, decision-making, where a model acts in the world and learns from what happens. In Transformers and Language
      Models, the one-word memory of the bigram model is replaced by attention, which can look back over the whole text at
      once, and in Probabilistic Deep Learning and Generative Models you will meet the other main families of generative
      model, which make images and sound.
    </p>
  ),
};
