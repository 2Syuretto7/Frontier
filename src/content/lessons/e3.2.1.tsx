import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BufferViz } from "@/components/viz/BufferViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.2.1",
  minutes: 55,
  links: {
    requires: ["e3.1.1", "e0.1.1"],
    revisits: ["e3.1.2", "e1.5.6"],
    foreshadows: ["e3.2.2", "e3.2.3", "e4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Python itself is a C program, and so are NumPy&rsquo;s inner loops, the Linux kernel, SQLite and most of the code
        between a PyTorch call and the GPU. A loop that takes a second in Python can take a hundredth of a second in C. The
        same freedom that makes C fast lets one missing length check hand an attacker control of a server. What does C make
        you say that Python says for you, and what goes wrong when you say it wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        C is a thin layer over the machine. Every variable has a fixed type and size decided before the program runs, so the
        compiler can turn <C>a + b</C> into a single instruction instead of Python&rsquo;s lookups and checks. An array is just
        a run of bytes with no length attached, and a string is an array of characters ending in a zero byte. Nothing checks
        that you stay inside an array: write too much and you overwrite whatever happens to come next in memory. Type a long
        input below and watch it spill into the neighbouring buffer.
      </p>
      <BufferViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a C program">
        <Code>{`#include <stdio.h>

int square(int x) {          /* types are declared and fixed */
    return x * x;
}

int main(void) {
    int total = 0;
    for (int i = 1; i <= 10; i++) {
        total += square(i);
    }
    printf("%d", total);     /* 385 */
    return 0;
}`}</Code>
        <p>
          <C>gcc -O2 -o prog prog.c</C> compiles this to machine code once; <C>./prog</C> runs it with no interpreter. Types
          such as <C>char</C> (1 byte), <C>int</C> (usually 4), <C>long</C> and <C>double</C> (8 on 64-bit Linux) fix both the
          size and the meaning of the bits, exactly as in the last chapter.
        </p>
      </Definition>

      <Theorem title="C's integer division truncates toward zero">
        <p>
          For integers with b ≠ 0, C defines a / b as the true quotient with its fractional part discarded, and a % b = a −
          (a / b) × b. So −7 / 2 is −3 and −7 % 2 is −1, where Python gives −4 and 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both languages keep the identity a = (a / b) × b + a % b; they differ in which quotient they choose. C (since C99)
          rounds the quotient toward zero, so the remainder has the sign of a; Python rounds it down (floor), so the remainder
          has the sign of b. For −7 and 2 the true quotient is −3.5: toward zero gives −3 and remainder −7 − (−6) = −1; floor
          gives −4 and remainder −7 − (−8) = 1. The two agree whenever a and b have the same sign.
        </p>
      </Proof>

      <Example title="arrays and strings">
        <p>
          <C>int xs[4] = {"{1, 2, 3}"};</C> reserves 16 bytes; missing initialisers become 0. <C>sizeof xs</C> is 16, and{" "}
          <C>sizeof xs / sizeof xs[0]</C> is the element count, but only where the array was declared: passed to a function it
          becomes a bare address. A string literal &quot;hello&quot; is 6 bytes, the five letters and a zero byte;{" "}
          <C>strlen</C> counts up to the zero, so a buffer without one makes it read on through memory. <C>strcpy</C> copies
          until the zero byte whatever the destination&rsquo;s size, which is the classic buffer overflow; <C>snprintf</C> and{" "}
          <C>strncpy</C> take a size.
        </p>
      </Example>

      <Example title="undefined behaviour">
        <p>
          Reading past an array, using memory after freeing it, signed integer overflow, and reading an uninitialised variable
          are <strong>undefined behaviour</strong>: the standard places no requirement on what happens. The compiler is
          allowed to assume they never occur and optimise accordingly, so a program can appear to work and then break with a
          new compiler flag. Tools such as AddressSanitizer (<C>-fsanitize=address</C>) and UBSan catch many of these at run
          time; memory-safe languages such as Rust rule most of them out at compile time.
        </p>
      </Example>

      <Remark title="C and Python together">
        <p>
          CPython&rsquo;s objects are C structs; <C>len(list)</C> reads a field and an extension module is a C file exposing
          functions to Python. NumPy, PyTorch&rsquo;s CPU kernels and tokenisers drop into C or C++ for their loops and hand
          results back as Python objects. <C>ctypes</C> and <C>cffi</C> call C libraries from Python directly. The usual design
          is Python for orchestration and C (or CUDA, which is C++ with GPU extensions) for the hot loop.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>How many bytes does the C string literal &quot;frontier&quot; occupy?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "mod",
      rung: "apply",
      prompt: <p>In C, what is <C>-17 % 5</C>?</p>,
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "ub",
      rung: "apply",
      prompt: <p>Which of these is undefined behaviour in C?</p>,
      answer: {
        kind: "choice",
        options: ["Adding 1 to an int holding INT_MAX", "Adding 1 to an unsigned int holding UINT_MAX", "Dividing −7 by 2", "Comparing two pointers into the same array"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`#include <stdio.h>

int main(void) {
    int a = -7, b = 2;
    unsigned char c = 250;
    c += 10;
    double d = 7 / 2;
    printf("%d %d %d %u %.1f\\n", a / b, a % b, 7 / 2 * 2, c, d);
    return 0;
}`}</Code>
          <p>What does this C program print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-3 -1 6 4 3.0", "-4 1 7 260 3.5", "-3 -1 6 4 3.5", "-4 1 6 4 3.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`#include <stdio.h>
#include <string.h>

int main(void) {
    char s[10] = "hello";
    int xs[4] = {1, 2, 3};
    s[2] = '\\0';
    printf("%zu %zu %zu %s %d\\n", sizeof s, strlen(s), sizeof xs / sizeof xs[0], s + 3, xs[3]);
    return 0;
}`}</Code>
          <p>Arrays, strings and sizeof. What does this C program print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10 2 4 lo 0", "10 5 3 lo 0", "6 2 4 lo 0", "10 2 4 llo 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Port C arithmetic to Python, exactly, for integers of any size (no floats). Write <C>c_div(a, b)</C> and{" "}
            <C>c_mod(a, b)</C> with C&rsquo;s truncating division (<C>ZeroDivisionError</C> for b = 0), and{" "}
            <C>int32_mul(a, b)</C>, the product of two 32-bit signed ints as a machine with wrapping arithmetic computes it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def c_div(a, b):
    return a // b

def c_mod(a, b):
    return a % b

def int32_mul(a, b):
    return a * b
`,
        solution: `def c_div(a, b):
    if b == 0:
        raise ZeroDivisionError('division by zero is undefined in C')
    q = abs(a) // abs(b)
    return q if (a < 0) == (b < 0) else -q

def c_mod(a, b):
    return a - b * c_div(a, b)

def int32_mul(a, b):
    r = (a * b) & 0xFFFFFFFF
    return r - (1 << 32) if r >> 31 else r
`,
        tests: [
          { name: "division", code: `assert c_div(7, 2) == 3 and c_div(-7, 2) == -3 and c_div(7, -2) == -3 and c_div(-7, -2) == 3
assert c_mod(-7, 2) == -1 and c_mod(7, -2) == 1 and c_mod(-7, -2) == -1 and c_mod(6, 3) == 0
try:
    c_div(1, 0)
    assert False, 'Division by zero raises ZeroDivisionError.'
except ZeroDivisionError:
    pass
import random
rng = random.Random(11)
for _ in range(3000):
    a, b = rng.randint(-10 ** 6, 10 ** 6), rng.choice([-1, 1]) * rng.randint(1, 1000)
    q, r = c_div(a, b), c_mod(a, b)
    assert q * b + r == a and abs(r) < abs(b) and (r == 0 or (r < 0) == (a < 0)), (a, b, q, r)
big = 10 ** 30 + 7
assert c_div(-big, 3) == -(big // 3), 'Avoid floating point: big values must stay exact.'` },
          { name: "32-bit multiply", code: `assert int32_mul(2, 3) == 6 and int32_mul(65536, 65536) == 0 and int32_mul(46341, 46341) == -2147479015
assert int32_mul(-1, -2147483648) == -2147483648, 'INT_MIN * -1 wraps to INT_MIN.'
import random, struct
rng = random.Random(12)
for _ in range(3000):
    a, b = rng.randint(-2 ** 31, 2 ** 31 - 1), rng.randint(-2 ** 31, 2 ** 31 - 1)
    want = struct.unpack('<i', struct.pack('<I', (a * b) % 2 ** 32))[0]
    assert int32_mul(a, b) == want, (a, b)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two pieces of the C library in Python:</p>
          <ul>
            <li>
              <C>c_strlen(buf)</C>: the length of the zero-terminated string at the start of a bytes object, or{" "}
              <C>ValueError</C> if there is no zero byte.
            </li>
            <li>
              <C>mini_printf(fmt, *args)</C>: return the formatted string for the conversions <C>%d %s %x %%</C>, each with an
              optional <C>-</C> flag (left-justify) and a minimum width, as in <C>%-5d</C>. <C>%x</C> prints the 32-bit unsigned
              pattern, so −1 gives <C>ffffffff</C>. Raise <C>ValueError</C> for an unknown conversion or leftover arguments.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def c_strlen(buf):
    return len(buf)

def mini_printf(fmt, *args):
    return fmt
`,
        solution: `def c_strlen(buf):
    for i, byte in enumerate(buf):
        if byte == 0:
            return i
    raise ValueError('no terminating zero byte: strlen would run off the end')

def mini_printf(fmt, *args):
    out, i, k = [], 0, 0
    while i < len(fmt):
        if fmt[i] != '%':
            out.append(fmt[i])
            i += 1
            continue
        i += 1
        left = fmt[i] == '-'
        if left:
            i += 1
        width = 0
        while fmt[i].isdigit():
            width = width * 10 + int(fmt[i])
            i += 1
        conv = fmt[i]
        i += 1
        if conv == '%':
            text = '%'
        elif conv in 'ds':
            text, k = str(args[k]), k + 1
        elif conv == 'x':
            text, k = format(args[k] % (1 << 32), 'x'), k + 1
        else:
            raise ValueError('unsupported conversion %' + conv)
        out.append(text.ljust(width) if left else text.rjust(width))
    if k != len(args):
        raise ValueError('too many arguments')
    return ''.join(out)
`,
        tests: [
          { name: "strlen", code: `assert c_strlen(b'hello' + bytes(1)) == 5 and c_strlen(bytes(4)) == 0
assert c_strlen(bytearray(b'he') + bytes(1) + b'llo' + bytes(1)) == 2, 'Stop at the first zero byte.'
try:
    c_strlen(b'abc')
    assert False, 'Without a zero byte, raise ValueError.'
except ValueError:
    pass` },
          { name: "printf", code: `assert mini_printf('%d + %d = %d', 2, 3, 5) == '2 + 3 = 5'
assert mini_printf('[%5d] [%-5d] [%3d]', 42, 42, -42) == '[   42] [42   ] [-42]'
assert mini_printf('%x %x %d', -1, 255, -1) == 'ffffffff ff -1', '%x reads the 32-bit pattern.'
assert mini_printf('%s=%d, 100%%', 'k', 65) == 'k=65, 100%'
assert mini_printf('[%8s][%-3s]', 'hi', 'abcd') == '[      hi][abcd]', 'Width is a minimum, not a maximum.'
assert mini_printf('no args') == 'no args'
for bad in [('%d', 1, 2), ('%q', 1)]:
    try:
        mini_printf(*bad)
        assert False, f'{bad} should raise ValueError.'
    except ValueError:
        pass` },
        ],
      },
    },
    {
      key: "convert",
      rung: "prove",
      prompt: <p>Prove that for integers a and b ≠ 0, C&rsquo;s remainder and Python&rsquo;s remainder are equal when a % b is 0 or a and b have the same sign, and otherwise differ by exactly |b|.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes both as a − qb with q the truncated quotient (C) and the floored quotient (Python).",
          "The quotients agree when the true quotient a/b is an integer or non-negative (same signs).",
          "Otherwise the true quotient is negative and not an integer, so the floored quotient is the truncated one minus 1.",
          "Then Python's remainder is C's plus b, so they differ by |b| (and have opposite signs).",
        ],
      },
    },
    {
      key: "fast",
      rung: "stretch",
      prompt: <p>Summing 10⁸ integers takes about 5 seconds in a Python loop and about 0.05 seconds in C. Explain where the factor of about 100 comes from, naming at least three costs Python pays per iteration that compiled C does not.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Interpretation: Python dispatches each bytecode instruction through the interpreter loop rather than running native instructions.",
          "Dynamic typing: each + looks up the operand types and the method to call at run time.",
          "Boxing: each integer is a heap object with a reference count, so results allocate and refcounts change, while C keeps values in registers.",
          "Mentions that C's compiler can also unroll and vectorise the loop with SIMD instructions, and that NumPy gets C speed by running the loop in C.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why a C program can overwrite a variable it never mentions, using two arrays next to each other in memory.",

  glimpse: (
    <p>
      The overflow worked because name and role sat next to each other at known addresses. Next, addresses as values:
      pointers, the stack and the heap, and how Python&rsquo;s own objects are laid out in memory.
    </p>
  ),
};
