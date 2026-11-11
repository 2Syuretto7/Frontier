import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ViewViz } from "@/components/viz/ViewViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.4",
  minutes: 50,
  links: {
    requires: ["e1.5.1"],
    revisits: ["e1.3.1"],
    foreshadows: ["e1.5.6"],
  },

  puzzle: (
    <>
      <p>You take the first 100 rows of a dataset to experiment on, and standardise them in place:</p>
      <Code>{`sample = data[:100]
sample -= sample.mean(axis=0)`}</Code>
      <p>Later, your model trained on <C>data</C> behaves strangely on its first 100 examples. What happened to <C>data</C>?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>data[:100]</C> did not copy anything. It made a <strong>view</strong>: a new array object that looks at the same
        memory. Subtracting in place through the view changed <C>data</C> too. It is the aliasing of the data-model lesson
        again, now for arrays, and it is deliberate: views make slicing free even for gigabyte arrays. Some kinds of indexing
        give views and some give copies.
      </p>
      <ViewViz />
    </>
  ),

  theory: (
    <>
      <Definition title="basic indexing gives views">
        <p>
          Integers and slices (<C>a[3]</C>, <C>a[2:8]</C>, <C>a[::2]</C>, <C>m[1:, :3]</C>), along with <C>reshape</C> of a
          contiguous array and <C>.T</C>, return views. Writing to a view writes to the original.
        </p>
      </Definition>

      <Definition title="advanced indexing gives copies">
        <p>
          Indexing with an array or list of integers (<C>a[[1, 5, 7]]</C>) or a boolean mask (<C>a[a &gt; 0]</C>) returns a
          new array with its own memory, because the chosen elements need not follow any regular pattern.
        </p>
      </Definition>

      <Example title="assignment is different">
        <Code>{`a = np.arange(10)
a[a > 5] = 0        # assignment through a mask changes a itself
print(a.sum())      # 15`}</Code>
        <p>
          <C>a[mask]</C> on the right of <C>=</C> makes a copy, but <C>a[mask] = value</C> is a call to{" "}
          <C>a.__setitem__</C>, which writes into <C>a</C> directly. That is how you clip, replace or zero out values in place.
        </p>
      </Example>

      <Remark title="habits">
        <p>
          When you want an independent array, say so with <C>.copy()</C>. When you are unsure, <C>np.shares_memory(a, b)</C>{" "}
          answers. Prefer <C>x = x - m</C>, which makes a new array, over <C>x -= m</C> on anything that might be a view of data
          you care about.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "slice",
      rung: "check",
      prompt: <p>Is <C>a[2:8]</C> a view or a copy?</p>,
      answer: { kind: "choice", options: ["A view", "A copy"], correct: [0] },
    },
    {
      key: "mask",
      rung: "check",
      prompt: <p>Is <C>a[a &gt; 0]</C>, used as a value, a view or a copy?</p>,
      answer: { kind: "choice", options: ["A copy", "A view"], correct: [0] },
    },
    {
      key: "sliceSum",
      rung: "apply",
      prompt: <p><C>a = np.arange(10)</C>, <C>b = a[2:5]</C>, <C>b[0] = 100</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 143 },
    },
    {
      key: "fancySum",
      rung: "apply",
      prompt: <p><C>a = np.arange(10)</C>, <C>c = a[[2, 3, 4]]</C>, <C>c[0] = 100</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>What is <C>np.arange(12).reshape(3, 4)[1:, ::2].sum()</C>?</p>,
      answer: { kind: "numeric", value: 28 },
    },
    {
      key: "puzzle",
      rung: "prove",
      prompt: (
        <p>
          Explain what the puzzle&rsquo;s two lines did to <C>data</C>, and rewrite them so that <C>data</C> is untouched. Then
          explain why NumPy makes slices views rather than copies, despite the risk.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that data[:100] is a view sharing memory with data.",
          "Explains that -= modifies in place, so the first 100 rows of data were centred too.",
          "Rewrites as sample = data[:100].copy(), or sample = data[:100] - data[:100].mean(axis=0).",
          "Explains views make slicing take constant time and no extra memory, which matters for very large arrays.",
        ],
      },
    },
    {
      key: "setmask",
      rung: "stretch",
      prompt: <p><C>a = np.arange(10)</C>, then <C>a[a &gt; 5] = 0</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 15 },
    },
  ],

  teachBack:
    "Explain to a friend which kinds of indexing give views and which give copies, and why a[mask] = 0 still changes a.",

  glimpse: (
    <p>
      Next, einsum, a single notation for sums, products and transposes of arrays. Strides, at the end of this chapter, show how a
      view can look at memory in a different order without moving it.
    </p>
  ),
};
