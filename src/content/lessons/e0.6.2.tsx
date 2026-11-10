import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TestTableViz } from "@/components/viz/TestTableViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.6.2",
  minutes: 45,
  links: {
    revisits: ["e0.2.1", "e0.6.1"],
    parallels: ["l0.1.3"],
    foreshadows: ["e4.1.1", "e4.1.2"],
  },

  puzzle: (
    <>
      <p>
        A friend writes a function that decides whether a year is a leap year. They tried it on 2024 and 2023, got True and
        False, and declared it finished.
      </p>
      <p>
        Are you convinced? Which years would you try, and why those? How many tests are enough to trust a function that will
        be given every year from 1 to 3000?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two typical years prove little, because most wrong versions of the function get typical years right. The
        informative tests are the ones where a plausible mistake would give a different answer: here, the century years.
      </p>
      <p>
        Below are three versions of the function. Start with only the two typical years chosen and look at each version.
        Then add the other years one at a time.
      </p>
      <TestTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="test case">
        <p>
          A <strong>test case</strong> is an input together with the output that the <strong>specification</strong>, the
          description of what the function should do, says it must give. Running the test compares the actual output with
          the expected one. The expected output must come from the specification or an independent calculation, never from
          running the code being tested, or the test only checks that the code agrees with itself.
        </p>
      </Definition>

      <Definition title="choosing tests">
        <p>Good test cases come from several groups:</p>
        <ul>
          <li><strong>Typical</strong> inputs, the everyday case.</li>
          <li><strong>Boundaries</strong>, on each side of every threshold in the specification: for a pass mark of 40, test 39 and 40.</li>
          <li><strong>Special values</strong>: zero, negative numbers, an empty list or string, a single item.</li>
          <li><strong>Each rule and exception</strong> in the specification, such as each part of the leap-year rule.</li>
        </ul>
        <p>Each test should be able to fail for some plausible mistake. A test that every reasonable version passes adds little.</p>
      </Definition>

      <Definition title="assert">
        <p>
          The statement <C>assert condition</C> does nothing if the condition is true and stops the program with an{" "}
          <C>AssertionError</C> if it is false. A group of assertions makes a test that can be re-run in a moment:
        </p>
        <Code>{`
def test_is_leap():
    assert is_leap(2024) == True
    assert is_leap(2023) == False
    assert is_leap(1900) == False
    assert is_leap(2000) == True
    print("all tests passed")
`}</Code>
      </Definition>

      <Example title="a boundary bug">
        <Code>{`
def absolute(x):
    if x >= 1:
        return x
    return -x
`}</Code>
        <p>
          This passes tests at 5 and -3, and even at 0. It fails at 0.5, returning -0.5, because the boundary was written as{" "}
          <C>x &gt;= 1</C> instead of <C>x &gt;= 0</C>. Only a test between the true and the written boundary reveals
          it.
        </p>
      </Example>

      <Remark title="what tests can and cannot show">
        <p>
          A failing test proves that there is a bug. Passing tests never prove there is none; they only show that the cases
          you thought of work. That is why choosing tests is a skill. Keep the tests after the function works, and run them
          after every change: a test that once passed and now fails catches a <em>regression</em>, a bug introduced by a
          later edit. This is the same discipline as holding out a test set in machine learning: judge the work on cases it
          was not tuned to.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "case",
      rung: "check",
      prompt: <p>What does a test case consist of?</p>,
      answer: { kind: "choice", options: ["An input and the expected output", "A copy of the function", "An input and whatever the function returns for it"], correct: [0] },
    },
    {
      key: "source",
      rung: "check",
      prompt: <p>Where should the expected output of a test come from?</p>,
      answer: { kind: "choice", options: ["The specification, or an independent calculation", "Running the function and copying its output", "Guessing"], correct: [0] },
    },
    {
      key: "versionb",
      rung: "apply",
      prompt: <p>In the visualisation, with all five years chosen, how many tests does Version B fail?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "abs",
      rung: "apply",
      prompt: <p>Which input reveals the bug in the <C>absolute</C> function of the lesson?</p>,
      answer: { kind: "choice", options: ["5", "-3", "0.5", "0"], correct: [2] },
    },
    {
      key: "assert",
      rung: "apply",
      prompt: <p>What happens when Python runs <C>assert 2 + 2 == 4</C>?</p>,
      answer: { kind: "choice", options: ["Nothing visible: the program carries on", "It prints True", "It raises an AssertionError"], correct: [0] },
    },
    {
      key: "design",
      rung: "prove",
      prompt: (
        <p>
          A function <C>grade(score)</C> must return &ldquo;A&rdquo; for 80 to 100, &ldquo;B&rdquo; for 60 to 79, and
          &ldquo;C&rdquo; for 0 to 59. List the test cases you would write, with expected outputs, and explain what plausible
          mistake each one is there to catch.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Includes typical values from each band, such as 90, 70 and 30.",
          "Includes both sides of each boundary: 79 and 80, 59 and 60.",
          "Includes the extremes 0 and 100.",
          "Links each test to a mistake it would catch, such as > written for >=, conditions in the wrong order, or a missing band.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>For the years 1 to 2400 inclusive, on how many years does Version B give a different answer from Version C?</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what a test case is, how to choose test cases that are likely to catch bugs, and why passing tests do not prove a function is correct.",

  glimpse: (
    <p>
      Next, reading error messages, so that when a test fails or a program crashes you can find the cause quickly. In Software
      Engineering for ML Research you will write tests with pytest and let the computer invent test cases for you with
      property-based testing.
    </p>
  ),
};
