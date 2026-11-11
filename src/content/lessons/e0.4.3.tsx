import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IndexViz } from "@/components/viz/IndexViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.4.3",
  minutes: 50,
  links: {
    revisits: ["e0.4.1", "e0.1.2"],
    parallels: ["l0.5.2"],
    foreshadows: ["e2.8.1"],
  },

  puzzle: (
    <>
      <p>
        A form asks for an email address. Users type things like <C>&nbsp; Asha.Rao@Example.COM&nbsp;</C>, with stray
        spaces and random capitals, and you need to store a tidy version, <C>asha.rao@example.com</C>, and also pick out the
        part after the <C>@</C>.
      </p>
      <p>
        Thinking of the text as a row of characters, what operations would you need? Which of them have you already met for
        lists?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A string is a sequence of characters, so everything you learned about indexing and slicing lists works on strings
        too. Strings also come with many <strong>methods</strong>, functions attached to the value, for the everyday jobs:
        changing case, trimming spaces, splitting and joining.
      </p>
      <IndexViz name="word" items={["f", "r", "o", "n", "t", "i", "e", "r"]} kind="str" />
      <p>
        The puzzle is solved by <C>email.strip().lower()</C>, which trims and lowers, and{" "}
        <C>email.split(&quot;@&quot;)[1]</C>, which splits at the <C>@</C> and takes the second piece.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="strings as sequences">
        <p>
          A <strong>string</strong> is an ordered sequence of characters. <C>len(s)</C> is its number of characters,{" "}
          <C>s[i]</C> is the character at index <C>i</C> (itself a string of length one), <C>s[a:b]</C> is a slice, and{" "}
          <C>for ch in s:</C> visits each character. <C>&quot;ont&quot; in &quot;frontier&quot;</C> tests for a
          substring and is <C>True</C>.
        </p>
      </Definition>

      <Definition title="immutability">
        <p>
          Strings are <strong>immutable</strong>: they cannot be changed in place. <C>word[0] = &quot;F&quot;</C> stops with a{" "}
          <C>TypeError</C>. Every string method returns a <em>new</em> string and leaves the original alone, so you must keep
          the result: <C>word = word.upper()</C>.
        </p>
      </Definition>

      <Definition title="common methods">
        <Code>{`
"Hello".upper()                 # 'HELLO'
"Hello".lower()                 # 'hello'
"   tide  ".strip()             # 'tide'   removes spaces at both ends
"Hello".replace("l", "L")       # 'HeLLo'
"frontier".find("t")            # 4        index of first match, or -1
"data.csv".endswith(".csv")     # True
"a b  c".split()                # ['a', 'b', 'c']   split on runs of spaces
"a,b,,c".split(",")             # ['a', 'b', '', 'c']
"-".join(["2026", "11", "10"])  # '2026-11-10'
`}</Code>
        <p>
          <C>split</C> and <C>join</C> are opposites: <C>split</C> breaks a string into a list of strings, and{" "}
          <C>sep.join(parts)</C> glues a list of strings together with <C>sep</C> between them.
        </p>
      </Definition>

      <Example title="special characters">
        <p>
          A backslash inside a string starts an <strong>escape sequence</strong>: <C>&quot;\n&quot;</C> is a newline and{" "}
          <C>&quot;\t&quot;</C> a tab. So <C>print(&quot;a\nb&quot;)</C> prints <C>a</C> and <C>b</C> on separate
          lines. Python strings hold any Unicode character, so <C>&quot;नमस्ते&quot;</C> and <C>&quot;naïve&quot;</C> are
          ordinary strings. Every character has a number: <C>ord(&quot;A&quot;)</C> is 65 and <C>chr(97)</C> is{" "}
          <C>&apos;a&apos;</C>.
        </p>
      </Example>

      <Remark title="characters are not always what you see">
        <p>
          <C>len(&quot;नमस्ते&quot;)</C> is 6, though a reader sees fewer letters, because some visible letters are built
          from several Unicode characters. Text is subtler than it looks, which is one reason language models do not work on
          characters directly but split text into tokens, as the pipeline lesson of How Machines Learn described.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "slice",
      rung: "check",
      prompt: <p>What is <C>&quot;frontier&quot;[2:5]</C>?</p>,
      answer: { kind: "choice", options: ["'ont'", "'ron'", "'onti'", "'nti'"], correct: [0] },
    },
    {
      key: "immutable",
      rung: "check",
      prompt: <p>What happens when Python runs <C>word[0] = &quot;F&quot;</C> with <C>word = &quot;frontier&quot;</C>?</p>,
      answer: { kind: "choice", options: ["A TypeError: strings cannot be changed in place", "word becomes 'Frontier'", "A new variable called word[0] is made"], correct: [0] },
    },
    {
      key: "split",
      rung: "apply",
      prompt: <p>How many items are in the list <C>&quot;a,b,,c&quot;.split(&quot;,&quot;)</C>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "find",
      rung: "apply",
      prompt: <p>What is <C>&quot;frontier&quot;.find(&quot;t&quot;)</C>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "join",
      rung: "apply",
      prompt: <p>What is <C>&quot;/&quot;.join([&quot;10&quot;, &quot;11&quot;, &quot;2026&quot;])</C>?</p>,
      answer: { kind: "choice", options: ["'10/11/2026'", "'/10/11/2026/'", "['10', '11', '2026']", "'10112026'"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`s = "Frontier"
print(s[0], s[-1], s[2:5], s[::-1][:3])`}</Code>
          <p>Indexing and slicing a string. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["F r ont rei", "F r on rei", "F r ont Fro", "r F ont rei"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`s = "Hello, World"
print(s[::-1][:5], s.find("o"), s.count("l"), s.replace("l", "L", 2), s.split(", "))`}</Code>
          <p>Slicing backwards, searching, counting and replacing in a string. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["dlroW 4 3 HeLLo, World ['Hello', 'World']", "dlroW 4 3 HeLLo, WorLd ['Hello', 'World']", "olleH 4 3 HeLLo, World ['Hello', 'World']", "dlroW 7 3 HeLLo, World ['Hello,', 'World']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_palindrome(s)</C>, which ignores case and every character that is not a letter, and says whether s reads the same backwards.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_palindrome(s):
    return s == s[::-1]
`,
        solution: `def is_palindrome(s):
    t = ''.join(ch.lower() for ch in s if ch.isalpha())
    return t == t[::-1]
`,
        tests: [
          { name: "plain", code: `assert is_palindrome('level') and not is_palindrome('python'), 'Compare the string with its reverse.'` },
          { name: "messy", code: `assert is_palindrome('Never odd or even.'), 'Drop spaces and punctuation and ignore case.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>caesar(text, shift)</C>, which shifts each letter a–z and A–Z by shift places around the alphabet (keeping its case) and leaves other characters alone; a negative shift undoes a positive one. Then write <C>rle_encode(s)</C>, run-length encoding such as <C>"aaabcc"</C> → <C>"a3b1c2"</C>, and <C>rle_decode(code)</C>, which inverts it (counts may have several digits; the text has no digits).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def caesar(text, shift):
    return text

def rle_encode(s):
    return s

def rle_decode(code):
    return code
`,
        solution: `def caesar(text, shift):
    out = []
    for ch in text:
        if 'a' <= ch <= 'z':
            out.append(chr((ord(ch) - 97 + shift) % 26 + 97))
        elif 'A' <= ch <= 'Z':
            out.append(chr((ord(ch) - 65 + shift) % 26 + 65))
        else:
            out.append(ch)
    return ''.join(out)

def rle_encode(s):
    out, i = [], 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]:
            j += 1
        out.append(s[i] + str(j - i))
        i = j
    return ''.join(out)

def rle_decode(code):
    out, i = [], 0
    while i < len(code):
        ch = code[i]
        j = i + 1
        while j < len(code) and code[j].isdigit():
            j += 1
        out.append(ch * int(code[i + 1:j]))
        i = j
    return ''.join(out)
`,
        tests: [
          { name: "caesar", code: `assert caesar('Hello, World!', 3) == 'Khoor, Zruog!' and caesar('xyz XYZ', 2) == 'zab ZAB' and caesar(caesar('Round trip 123', 11), -11) == 'Round trip 123' and caesar('abc', 52) == 'abc'` },
          { name: "encode", code: `assert rle_encode('aaabcc') == 'a3b1c2' and rle_encode('') == '' and rle_encode('z' * 12) == 'z12' and rle_encode('abab') == 'a1b1a1b1'` },
          { name: "decode", code: `import random
random.seed(2)
for _ in range(100):
    s = ''.join(random.choice('ab ') * random.randint(1, 15) for _ in range(random.randint(0, 6)))
    assert rle_decode(rle_encode(s)) == s, f'Round trip failed for {s!r}'
assert rle_decode('x10y1') == 'x' * 10 + 'y'` },
        ],
      },
    },
    {
      key: "palindrome",
      rung: "prove",
      prompt: (
        <p>
          Write a function <C>is_palindrome(text)</C> that returns <C>True</C> when the text reads the same backwards,
          ignoring capital letters and spaces, so that &ldquo;Never odd or even&rdquo; counts. Explain each step, and why
          the function must use the strings that methods return.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lowers the case, for example with lower().",
          "Removes spaces, for example with replace(\" \", \"\") or by joining the split pieces.",
          "Compares the cleaned string with its reverse, for example s == s[::-1], and returns the result.",
          "Explains that strings are immutable, so each method returns a new string that must be stored or used.",
        ],
      },
    },
    {
      key: "vowels",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
text = "Machine Learning"
n = 0
for ch in text.lower():
    if ch in "aeiou":
        n = n + 1
print(n)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend how strings are like lists, why they cannot be changed in place, and how split and join turn text into pieces and back.",

  glimpse: (
    <p>
      Next, two more collections: tuples, which cannot change, and sets, which hold each value once. In Data Structures and
      Algorithms you will study fast ways to find one string inside another, the problem behind every search box.
    </p>
  ),
};
