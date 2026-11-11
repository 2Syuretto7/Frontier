import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.4.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.4.2",
  minutes: 50,
  links: {
    revisits: ["e0.4.1"],
    parallels: ["l0.2.4"],
    foreshadows: ["e2.3.1", "e1.7.1"],
  },

  puzzle: (
    <>
      <p>
        You keep your friends&rsquo; phone numbers in a list of pairs: <C>[[&quot;Asha&quot;, &quot;98100&hellip;&quot;],
        [&quot;Ravi&quot;, &quot;98200&hellip;&quot;], &hellip;]</C>. To find Ravi&rsquo;s number, the program checks each
        pair in turn until it finds his name.
      </p>
      <p>
        With 10 friends this is fine. With 10 million customers, and thousands of look-ups a second, it is not. What would
        you want instead? How does a printed dictionary let you find a word without reading from page one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        You want to go straight from a name to its number. Python&rsquo;s <strong>dictionary</strong> does exactly that: it
        stores <strong>key</strong>&ndash;<strong>value</strong> pairs and finds the value for a key directly, however many
        pairs there are.
      </p>
      <p>
        A classic use is counting. The program below counts how often each word appears. Watch the dictionary grow: a new
        word gets a new key, and a repeated word has its value increased.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="dictionary">
        <p>
          A <strong>dictionary</strong>, or <C>dict</C>, maps keys to values. It is written in curly brackets with a colon
          between each key and its value: <C>{"{"}&quot;Asha&quot;: 16, &quot;Ravi&quot;: 17{"}"}</C>. Each key appears at
          most once. <C>{"{}"}</C> is the empty dictionary, and <C>len(d)</C> is the number of keys.
        </p>
      </Definition>

      <Definition title="looking up and changing">
        <Code>{`
ages = {"Asha": 16, "Ravi": 17}
ages["Ravi"]            # 17
ages["Meera"] = 15      # adds a new key
ages["Asha"] = 17       # replaces the value for an existing key
"Zoya" in ages          # False: in tests the keys
ages.get("Zoya", 0)     # 0: the default, since "Zoya" is not a key
del ages["Ravi"]        # removes a key and its value
`}</Code>
        <p>
          Looking up a key that is not there, such as <C>ages[&quot;Zoya&quot;]</C>, stops the program with a{" "}
          <C>KeyError</C>. Use <C>in</C> to check first, or <C>get</C> with a default.
        </p>
      </Definition>

      <Definition title="looping over a dictionary">
        <p>
          <C>for k in d:</C> visits the keys. <C>d.values()</C> gives the values and <C>d.items()</C> gives key&ndash;value
          pairs, so <C>for name, age in ages.items():</C> visits both at once. Python keeps the keys in the order they were
          first added.
        </p>
      </Definition>

      <Example title="counting with get">
        <p>The counting loop of the trace can be written in one line, using <C>get</C> with a default of 0:</p>
        <Code>{`
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
`}</Code>
        <p>
          This is exactly how the word-pair counts of the bigram model in How Machines Learn were built: the key is a pair
          of words, and the value is how often the pair occurred.
        </p>
      </Example>

      <Remark title="why look-up is fast">
        <p>
          A dictionary does not search its keys one by one. It computes a number from the key, called a{" "}
          <em>hash</em>, and uses it to jump almost directly to where the value is stored. That is why look-up takes about
          the same time with ten keys or ten million. It is also why keys must be values that cannot change, such as
          strings, numbers and tuples: if a key changed after it was stored, its hash would change and it could no longer
          be found. A list cannot be a key.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "maps",
      rung: "check",
      prompt: <p>What does a dictionary store?</p>,
      answer: { kind: "choice", options: ["Pairs of keys and values, with each key at most once", "An ordered list of values found by position", "Only strings"], correct: [0] },
    },
    {
      key: "missing",
      rung: "check",
      prompt: <p>What happens when you look up <C>d[k]</C> for a key <C>k</C> that is not in <C>d</C>?</p>,
      answer: { kind: "choice", options: ["The program stops with a KeyError", "It gives None", "It gives 0", "It adds k with the value None"], correct: [0] },
    },
    {
      key: "ages",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
ages = {"Asha": 16, "Ravi": 17}
ages["Meera"] = 15
ages["Asha"] = 17
print(sum(ages.values()))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 49 },
    },
    {
      key: "stock",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
stock = {"pen": 10, "ink": 4}
stock["pen"] = stock["pen"] - 3
stock["ink"] = stock.get("ink", 0) + 5
stock["pad"] = stock.get("pad", 0) + 2
print(sum(stock.values()))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "keys",
      rung: "apply",
      prompt: <p>In the traced program, how many keys does <C>counts</C> have at the end?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`stock = {"tea": 3, "rice": 10}
stock["tea"] += 2
stock["salt"] = stock.get("salt", 0) + 1
print(sorted(stock.items()))`}</Code>
          <p>Updating and adding dictionary entries. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[('rice', 10), ('salt', 1), ('tea', 5)]", "[('tea', 5), ('rice', 10), ('salt', 1)]", "[('rice', 10), ('tea', 5)]", "A KeyError"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`d = {"a": 1, "b": 2}
d["c"] = d.get("a", 0) + d.get("z", 10)
d["a"] += 5
print(d, sorted(d, key=d.get), list(d.items())[0])`}</Code>
          <p>get with a default, updating a value, and sorting keys by value. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{'a': 6, 'b': 2, 'c': 11} ['b', 'a', 'c'] ('a', 6)", "{'a': 6, 'b': 2, 'c': 1} ['c', 'b', 'a'] ('a', 6)", "{'a': 6, 'b': 2, 'c': 11} ['a', 'b', 'c'] ('a', 6)", "{'a': 1, 'b': 2, 'c': 11} ['a', 'b', 'c'] ('a', 1)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>word_counts(text)</C>, which returns a dictionary from each word (split on whitespace, lower-cased) to the number of times it appears.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def word_counts(text):
    counts = {}
    for w in text.split():
        counts[w] = 1
    return counts
`,
        solution: `def word_counts(text):
    counts = {}
    for w in text.lower().split():
        counts[w] = counts.get(w, 0) + 1
    return counts
`,
        tests: [
          { name: "counts", code: `assert word_counts('the cat and the hat') == {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}, 'Add one to the count each time a word appears.'` },
          { name: "case", code: `assert word_counts('Go go GO') == {'go': 3}, 'Lower-case each word first.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>invert(d)</C>, a dict mapping each value of d to the sorted list of keys that had it; <C>group_by(items, key)</C>, a dict mapping <C>key(item)</C> to the list of items with that key, in their original order; and <C>merge_counts(a, b)</C>, a new dict adding the counts of two count dicts. None of them may change their inputs.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def invert(d):
    return {v: k for k, v in d.items()}

def group_by(items, key):
    return {}

def merge_counts(a, b):
    a.update(b)
    return a
`,
        solution: `def invert(d):
    out = {}
    for k, v in d.items():
        out.setdefault(v, []).append(k)
    return {v: sorted(ks) for v, ks in out.items()}

def group_by(items, key):
    out = {}
    for x in items:
        out.setdefault(key(x), []).append(x)
    return out

def merge_counts(a, b):
    out = dict(a)
    for k, v in b.items():
        out[k] = out.get(k, 0) + v
    return out
`,
        tests: [
          { name: "invert", code: `assert invert({'x': 1, 'y': 2, 'z': 1, 'a': 1}) == {1: ['a', 'x', 'z'], 2: ['y']} and invert({}) == {}` },
          { name: "group", code: `g = group_by(['apple', 'bat', 'avocado', 'cat', 'banana'], lambda w: w[0])
assert g == {'a': ['apple', 'avocado'], 'b': ['bat', 'banana'], 'c': ['cat']} and group_by(range(6), lambda n: n % 3) == {0: [0, 3], 1: [1, 4], 2: [2, 5]}` },
          { name: "merge", code: `a, b = {'x': 2, 'y': 1}, {'y': 4, 'z': 3}
assert merge_counts(a, b) == {'x': 2, 'y': 5, 'z': 3} and a == {'x': 2, 'y': 1} and b == {'y': 4, 'z': 3}, 'Do not change the inputs.'` },
        ],
      },
    },
    {
      key: "phonebook",
      rung: "prove",
      prompt: (
        <p>
          Explain why a dictionary from names to numbers is better than a list of name&ndash;number pairs for a phone book
          with millions of entries. Then explain why a list cannot be used as a dictionary key while a string can.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that finding a name in a list of pairs means checking pairs one by one, which takes time proportional to the number of entries.",
          "Explains that a dictionary jumps almost directly to the value using a hash of the key, so look-up time hardly grows with size.",
          "Explains that keys are found by their hash, so a key must not change after it is stored.",
          "Notes that strings cannot be changed while lists can, so a list's hash could become out of date.",
        ],
      },
    },
    {
      key: "banana",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
c = {}
for ch in "banana":
    c[ch] = c.get(ch, 0) + 1
print(c["a"] * 10 + c["n"])
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 32 },
    },
  ],

  teachBack:
    "Explain to a friend what a dictionary is, how to add, look up and safely look up keys, and why looking up a key is fast.",

  glimpse: (
    <p>
      Next, strings, seen as sequences of characters. In Data Structures and Algorithms you will build a hash table yourself
      and see exactly how a dictionary finds a key, and in Python, NumPy and the Command Line you will meet dataframes, tables
      whose columns are looked up by name.
    </p>
  ),
};
