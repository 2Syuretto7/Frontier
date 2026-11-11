import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StrideViz } from "@/components/viz/StrideViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.6",
  minutes: 50,
  links: {
    requires: ["e1.5.4"],
    revisits: ["e1.5.1"],
    parallels: ["m3.3.5"],
    foreshadows: ["e2.2.1"],
  },

  puzzle: (
    <>
      <p>
        Transposing a 10,000 by 10,000 array of floats with <C>a.T</C> takes about a microsecond, though the array holds
        800 MB. Then <C>a.T.copy()</C> takes a noticeable fraction of a second.
      </p>
      <p>If <C>a.T</C> did not move 800 MB of numbers, what did it do? And what is the copy doing that the transpose was not?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Memory is one long line of bytes. An array finds element <C>(i, j)</C> with simple arithmetic: start at an offset, add{" "}
        <C>i</C> times one step size and <C>j</C> times another. Those step sizes are the <strong>strides</strong>. A transpose
        just swaps the two strides, so the same bytes are read in a different order. Copying actually rearranges the bytes.
        Pick a view, then click cells to see where they live.
      </p>
      <StrideViz />
    </>
  ),

  theory: (
    <>
      <Definition title="strides">
        <p>
          An array is a pointer to memory, a dtype, a <C>shape</C> and a tuple of <C>strides</C>, the number of bytes to move to
          step one place along each axis. Element <C>(i₀, i₁, …)</C> lives at byte
        </p>
        <Code>{`offset + i0 * strides[0] + i1 * strides[1] + ...`}</Code>
        <p>
          For a <C>float64</C> array of shape <C>(3, 4)</C> in the default <strong>C order</strong> (row-major), the strides are{" "}
          <C>(32, 8)</C>: the last axis changes fastest.
        </p>
      </Definition>

      <Definition title="views are new strides">
        <p>
          Slicing, transposing and many reshapes produce views by computing a new offset, shape and strides over the same
          memory. A step of 2 doubles a stride; reversing makes it negative; a transpose permutes the strides. An array is{" "}
          <strong>contiguous</strong> when its elements fill memory in order with no gaps.
        </p>
      </Definition>

      <Example title="when reshape must copy">
        <Code>{`a = np.arange(12).reshape(3, 4)
t = a.T                    # view, strides swapped, not contiguous
t.reshape(12)              # must copy: no single stride walks t's order through memory
np.ascontiguousarray(t)    # explicit copy into row-major order`}</Code>
      </Example>

      <Remark title="why order affects speed">
        <p>
          Processors fetch memory in blocks of 64 bytes, called cache lines. Walking along the last axis of a C-order array uses
          every byte of each block; walking down a column jumps a whole row each step and wastes most of each block. The same
          sum can run several times faster in the right order. Deep learning frameworks are full of operations, such as a
          transpose followed by a contiguous copy, that exist only to put data in the order the next operation reads fastest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "copy",
      rung: "check",
      prompt: <p>Does <C>a.T</C> copy the array&rsquo;s data?</p>,
      answer: { kind: "choice", options: ["No; it swaps the strides of a view", "Yes, always", "Only for square arrays"], correct: [0] },
    },
    {
      key: "corder",
      rung: "check",
      prompt: <p>In C (row-major) order, which axis changes fastest as you walk through memory?</p>,
      answer: { kind: "choice", options: ["The last axis", "The first axis", "They alternate"], correct: [0] },
    },
    {
      key: "s0",
      rung: "apply",
      prompt: <p>What is the first stride, in bytes, of a <C>float64</C> array of shape <C>(3, 4)</C> in C order?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "byte",
      rung: "apply",
      prompt: <p>For an <C>int32</C> array of shape <C>(3, 4)</C> in C order, at what byte offset does element <C>[2, 1]</C> live?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "tstride",
      rung: "apply",
      prompt: <p>What is the first stride of <C>a.T</C>, where <C>a</C> is a <C>float64</C> array of shape <C>(3, 4)</C>?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "speed",
      rung: "prove",
      prompt: (
        <p>
          For a large C-order array, explain why summing each row is usually faster than summing each column, using strides and
          cache lines. Then explain why <C>a.T.reshape(-1)</C> must copy while <C>a.reshape(-1)</C> need not.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that along a row the stride is the item size, so consecutive elements share cache lines.",
          "Notes that down a column the stride is a whole row, so each element needs a new cache line and most fetched bytes are wasted.",
          "Explains a.reshape(-1) on a contiguous array reads memory in order, so it can be a view with one stride.",
          "Explains a.T's elements, read in row-major order of the transpose, are not evenly spaced in memory, so no single stride works and NumPy copies.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: <p>What is the first stride of a <C>float32</C> array of shape <C>(2, 3, 4)</C> in C order?</p>,
      answer: { kind: "numeric", value: 48 },
    },
  ],

  teachBack:
    "Explain to a friend what strides are, why a transpose is free, and why memory order affects speed.",

  glimpse: (
    <p>
      Next, visualisation: turning arrays into pictures you can trust. Data Structures and Algorithms begins with the dynamic
      array, the contiguous block of memory that underlies both Python lists and NumPy arrays.
    </p>
  ),
};
