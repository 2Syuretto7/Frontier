import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShapeViz } from "@/components/viz/ShapeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.1",
  minutes: 50,
  links: {
    requires: ["e1.3.3", "e1.4.2"],
    revisits: ["e0.4.1"],
    parallels: ["m3.3.1"],
    foreshadows: ["e1.5.2", "e1.5.6"],
  },

  puzzle: (
    <>
      <p>
        A batch of 32 colour images, each 224 by 224 pixels with 3 colour channels, has to be fed to a network as numbers.
      </p>
      <p>
        How many numbers is that? As a Python list of lists of lists of lists, each number would be a separate float object of 24 bytes,
        plus an 8-byte pointer to it. How much memory would that take, compared with storing each number in 4 bytes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are <C>32 × 224 × 224 × 3 ≈ 4.8</C> million numbers: about 154 MB as Python objects, but about 19 MB packed as
        4-byte floats. A NumPy <strong>array</strong> is that packed form: one block of memory holding numbers all of the same
        type, plus a <strong>shape</strong> that says how to read the block as a grid.
      </p>
      <ShapeViz />
      <p>
        The shape is only an interpretation. Twelve numbers can be a row of 12, a 3 by 4 grid or two 2 by 3 grids without
        moving in memory. The <strong>dtype</strong> decides how many bytes each number takes, and what values it can hold.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="ndarray">
        <p>A NumPy array has:</p>
        <ul>
          <li><C>shape</C>: a tuple of sizes, one per axis, such as <C>(32, 224, 224, 3)</C>;</li>
          <li><C>ndim</C>, the number of axes, and <C>size</C>, the number of elements;</li>
          <li><C>dtype</C>, the single type of every element, with <C>itemsize</C> bytes each, so <C>nbytes = size × itemsize</C>.</li>
        </ul>
      </Definition>

      <Example title="making and reshaping arrays">
        <Code>{`import numpy as np
a = np.arange(12)              # 0, 1, ..., 11
m = a.reshape(3, 4)            # 3 rows of 4; m[1, 2] is 6
z = np.zeros((2, 3), dtype=np.float32)
r = np.random.default_rng(0).normal(size=(1000, 768))
a.reshape(2, -1).shape         # (2, 6): -1 means "whatever fits"
m.sum(axis=0)                  # sum down each column: array([12, 15, 18, 21])`}</Code>
        <p>
          Many functions take an <C>axis</C>: the axis that is summed, averaged or searched over, and so disappears from the
          result.
        </p>
      </Example>

      <Definition title="dtypes and their limits">
        <p>
          Integers have fixed ranges: <C>int8</C> holds −128 to 127, and arithmetic past the end wraps around silently, so{" "}
          <C>np.int8(100) + np.int8(100)</C> is −56. Floats have fixed precision: <C>float32</C> keeps about 7 significant
          digits, so <C>np.float32(16777216) + 1</C> is still 16777216. Model weights are usually stored as{" "}
          <C>float32</C> or the 2-byte <C>bfloat16</C>; the choice sets both memory use and accuracy.
        </p>
      </Definition>

      <Remark title="why homogeneity matters">
        <p>
          Because every element has the same type and sits next to the others, the computer can work through the block with
          compiled loops, without asking each element what it is. That is the subject of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>What is the shape of <C>np.zeros((3, 4))</C>?</p>,
      answer: { kind: "choice", options: ["(3, 4)", "(4, 3)", "(12,)", "(3, 4, 1)"], correct: [0] },
    },
    {
      key: "elem",
      rung: "check",
      prompt: <p>With <C>m = np.arange(12).reshape(3, 4)</C>, what is <C>m[1, 2]</C>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "bytes",
      rung: "apply",
      prompt: <p>What is <C>nbytes</C> for a <C>float32</C> array of shape <C>(1000, 768)</C>?</p>,
      answer: { kind: "numeric", value: 3072000 },
    },
    {
      key: "wrap",
      rung: "apply",
      prompt: <p>What is <C>np.array([100], dtype=np.int8) + np.int8(100)</C>?</p>,
      answer: { kind: "numeric", value: -56 },
    },
    {
      key: "minus1",
      rung: "apply",
      prompt: <p>What is the second number in the shape of <C>np.arange(12).reshape(2, -1)</C>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "dtype",
      rung: "prove",
      prompt: (
        <p>
          Explain why <C>np.float32(16777216) + 1</C> gives 16777216, and use the idea to discuss the trade-off between storing
          model weights in <C>float32</C> and in a 2-byte format such as <C>bfloat16</C>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that float32 stores a 24-bit significand, so above 2²⁴ = 16777216 consecutive integers cannot all be represented and the 1 is rounded away.",
          "Notes that bfloat16 halves memory and bandwidth compared with float32.",
          "Notes that bfloat16 keeps float32's exponent range but has only 8 bits of significand, so small updates to large weights can be lost.",
          "Concludes that training often keeps a float32 copy of the weights while computing in bfloat16.",
        ],
      },
    },
    {
      key: "seven",
      rung: "stretch",
      prompt: <p>How many gigabytes (10⁹ bytes) do the weights of a 7-billion-parameter model take in <C>bfloat16</C>?</p>,
      answer: { kind: "numeric", value: 14 },
    },
  ],

  teachBack:
    "Explain to a friend what an array's shape and dtype are, why reshaping is cheap, and what can go wrong with int8 or float32.",

  glimpse: (
    <p>
      Next, vectorisation: why <C>a + b</C> on arrays is so much faster than a Python loop. Linear Algebra treats these grids of
      numbers as matrices, with an algebra of their own.
    </p>
  ),
};
