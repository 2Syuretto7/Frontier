import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AsmStepViz } from "@/components/viz/AsmStepViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.2.3",
  minutes: 60,
  links: {
    requires: ["e3.2.2"],
    revisits: ["e3.2.1", "e3.1.1"],
    foreshadows: ["e3.3.1", "e3.4.1", "e4.5.1"],
  },

  puzzle: (
    <>
      <p>
        A processor has no idea what a <C>for</C> loop, an <C>if</C> or a function is. It runs a list of tiny instructions,
        each of which moves a number, does one piece of arithmetic, or jumps somewhere else. Yet every program you have written,
        recursion included, ends up as such a list. How do loops, conditionals and calls turn into jumps, and why would you ever
        want to read the result?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The processor keeps a handful of <strong>registers</strong>, small fast slots for numbers, and a{" "}
        <strong>program counter</strong> (pc) saying which instruction runs next. Normally pc just moves to the next line. A{" "}
        <strong>branch</strong> compares two registers and, if the test holds, sets pc to a label instead: that is all an{" "}
        <C>if</C> is, and a loop is a branch that goes backwards. A <strong>call</strong> pushes the address of the next
        instruction onto the stack and jumps; <strong>ret</strong> pops it and jumps back. Step through both programs below.
      </p>
      <AsmStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a toy instruction set">
        <p>
          This lesson uses a small assembly language close in spirit to RISC-V. There are eight registers r0 to r7, all starting
          at 0, and a stack. One instruction per line; <C>;</C> starts a comment and <C>name:</C> labels a line.
        </p>
        <Code>{`li   rd, imm          rd = imm
mov  rd, rs           rd = rs
add  rd, rs, rt       rd = rs + rt     (also sub, mul)
addi rd, rs, imm      rd = rs + imm
beq  rs, rt, L        if rs == rt: jump to L   (also bne, blt)
j    L                jump to L
push rs / pop rd      stack operations
call L / ret          push the next pc and jump / pop pc
halt                  stop (so does running off the end)`}</Code>
      </Definition>

      <Example title="from Python to jumps">
        <p>
          A <C>while</C> loop becomes a test at the top that jumps past the body when it fails, and a jump at the bottom back to
          the test. <C>if a &lt; b: X else: Y</C> becomes <C>blt a, b, then</C>, the code for Y, a jump past X, then X at
          label <C>then</C>. A compiler such as gcc does exactly this; <C>gcc -S -O1 prog.c</C> writes the real x86-64 or ARM
          assembly, and Compiler Explorer (godbolt.org) shows it side by side with the source.
        </p>
      </Example>

      <Theorem title="calls nest correctly">
        <p>
          If every function pops exactly what it pushes before its <C>ret</C>, then every <C>ret</C> returns to the
          instruction just after the <C>call</C> that entered that function, however deeply calls nest, recursion included.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on the number of instructions executed inside the call. When <C>call L</C> runs, the stack is some list
          s and the call pushes the return address a, giving s + [a]. Inside the function, each push is matched by a later pop,
          and each nested call, by the induction hypothesis, returns with the stack exactly as it was before that call. So when
          the function reaches its <C>ret</C>, the stack is again s + [a], and ret pops a and jumps there, leaving s as it was
          before the call. Real processors keep the same discipline in a stack frame per call, which is why the frames of the
          last lesson are popped in reverse order of creation.
        </p>
      </Proof>

      <Example title="calling conventions">
        <p>
          Caller and callee must agree on where arguments and results go and which registers a function may overwrite. On
          x86-64 Linux the first six integer arguments arrive in rdi, rsi, rdx, rcx, r8 and r9, the result returns in rax, and
          registers such as rbx must be saved and restored by any function that uses them, just as <C>sq</C> in the viz saves
          r2. This agreement, the <strong>ABI</strong>, is what lets Python call a C library compiled years earlier.
        </p>
      </Example>

      <Remark title="why read assembly">
        <p>
          Reading the compiler&rsquo;s output answers questions no profiler can: did the loop get vectorised into SIMD
          instructions, did a bounds check survive, did a function get inlined. GPU programmers read PTX and SASS, NVIDIA&rsquo;s
          assembly languages, to see whether a kernel uses tensor-core instructions or spills registers to slow memory.
          Python bytecode (<C>import dis; dis.dis(f)</C>) is the same idea one level up: a stack machine that the interpreter
          runs one instruction at a time.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pc",
      rung: "check",
      prompt: <p>The instruction at address 12 is <C>beq r1, r2, end</C>, and r1 differs from r2. Instructions are numbered one per line. What is pc after it runs?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "loopcount",
      rung: "apply",
      prompt: <p>A loop body of 4 instructions is preceded by a 1-instruction test (<C>blt</C>) and followed by <C>j</C> back to the test. The body runs 10 times. Counting the final failing test, how many instructions does the loop execute?</p>,
      answer: { kind: "numeric", value: 61 },
    },
    {
      key: "stack",
      rung: "apply",
      prompt: <p>A recursive function is entered with <C>call</C> and pushes one register before calling itself. How many stack entries are in use at the deepest point of computing fact(5), if fact(1) returns without recursing and the outermost call is counted too?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`; prints r1 r2 r3
        li   r1, 0          ; total
        li   r2, 1          ; i
        li   r3, 5          ; n
loop:   blt  r3, r2, done   ; stop once n < i
        mul  r4, r2, r2
        add  r1, r1, r4     ; total += i * i
        addi r2, r2, 2      ; i += 2
        j    loop
done:   halt`}</Code>
          <p>What are r1, r2 and r3 when this toy program halts?</p>
        </>
      ),
      answer: { kind: "choice", options: ["r1=35 r2=7 r3=5", "r1=84 r2=9 r3=5", "r1=9 r2=7 r3=5", "r1=35 r2=5 r3=5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`; prints r1 r2 r5
        li   r1, 3
        li   r5, 0
        call twice
        call twice
        halt
twice:  push r1
        add  r1, r1, r1
        addi r5, r5, 1
        pop  r2
        ret`}</Code>
          <p>Calls and the stack. What are r1, r2 and r5 when this toy program halts?</p>
        </>
      ),
      answer: { kind: "choice", options: ["r1=12 r2=6 r5=2", "r1=12 r2=0 r5=2", "r1=6 r2=3 r5=1", "r1=12 r2=3 r5=2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>run(source, regs=None, max_steps=100000)</C>, an interpreter for the toy instruction set in the theory. The
            starter&rsquo;s <C>parse(source)</C> turns the source into a list of <C>(op, operands)</C> pairs and a dict from
            label to instruction index, raising <C>ValueError</C> for an unknown instruction or an unknown or duplicate label.{" "}
            <C>run</C> returns the dict of all eight registers <C>{"{'r0': ..., 'r7': ...}"}</C> after the program halts, starting
            from 0 except for any given in <C>regs</C>, and raises <C>RuntimeError</C> if more than <C>max_steps</C> instructions
            run.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `OPS = {'li', 'mov', 'add', 'sub', 'mul', 'addi', 'beq', 'bne', 'blt', 'j', 'push', 'pop', 'call', 'ret', 'halt'}

def parse(source):
    # Returns (program, labels): a list of (op, operands) and a dict from label to index.
    program, labels = [], {}
    for line in source.splitlines():
        line = line.split(';')[0].strip()
        while ':' in line:
            label, line = line.split(':', 1)
            label = label.strip()
            if label in labels:
                raise ValueError(f'duplicate label {label}')
            labels[label] = len(program)
            line = line.strip()
        if line:
            op, _, rest = line.partition(' ')
            if op not in OPS:
                raise ValueError(f'unknown instruction {op}')
            program.append((op, [a.strip() for a in rest.split(',')] if rest.strip() else []))
    for op, a in program:
        name = a[2] if op in ('beq', 'bne', 'blt') else a[0] if op in ('j', 'call') else None
        if name is not None and name not in labels:
            raise ValueError(f'unknown label {name}')
    return program, labels

def run(source, regs=None, max_steps=100000):
    program, labels = parse(source)
    r = {f'r{i}': 0 for i in range(8)} | (regs or {})
    for op, a in program:
        if op == 'li':
            r[a[0]] = int(a[1])
    return r
`,
        solution: `OPS = {'li', 'mov', 'add', 'sub', 'mul', 'addi', 'beq', 'bne', 'blt', 'j', 'push', 'pop', 'call', 'ret', 'halt'}

def parse(source):
    # Returns (program, labels): a list of (op, operands) and a dict from label to index.
    program, labels = [], {}
    for line in source.splitlines():
        line = line.split(';')[0].strip()
        while ':' in line:
            label, line = line.split(':', 1)
            label = label.strip()
            if label in labels:
                raise ValueError(f'duplicate label {label}')
            labels[label] = len(program)
            line = line.strip()
        if line:
            op, _, rest = line.partition(' ')
            if op not in OPS:
                raise ValueError(f'unknown instruction {op}')
            program.append((op, [a.strip() for a in rest.split(',')] if rest.strip() else []))
    for op, a in program:
        name = a[2] if op in ('beq', 'bne', 'blt') else a[0] if op in ('j', 'call') else None
        if name is not None and name not in labels:
            raise ValueError(f'unknown label {name}')
    return program, labels

def run(source, regs=None, max_steps=100000):
    program, labels = parse(source)
    r = {f'r{i}': 0 for i in range(8)} | (regs or {})
    stack, pc, steps = [], 0, 0
    while pc < len(program):
        steps += 1
        if steps > max_steps:
            raise RuntimeError('step limit exceeded')
        op, a = program[pc]
        pc += 1
        if op == 'li':
            r[a[0]] = int(a[1])
        elif op == 'mov':
            r[a[0]] = r[a[1]]
        elif op in ('add', 'sub', 'mul', 'addi'):
            x, y = r[a[1]], (int(a[2]) if op == 'addi' else r[a[2]])
            r[a[0]] = x - y if op == 'sub' else x * y if op == 'mul' else x + y
        elif op in ('beq', 'bne', 'blt'):
            x, y = r[a[0]], r[a[1]]
            if (x == y) if op == 'beq' else (x != y) if op == 'bne' else (x < y):
                pc = labels[a[2]]
        elif op in ('j', 'call'):
            if op == 'call':
                stack.append(pc)
            pc = labels[a[0]]
        elif op == 'push':
            stack.append(r[a[0]])
        elif op == 'pop':
            r[a[0]] = stack.pop()
        elif op == 'ret':
            pc = stack.pop()
        elif op == 'halt':
            break
    return r
`,
        tests: [
          { name: "arithmetic and loops", code: `SUM = '''
        li   r1, 0
        li   r2, 1
loop:   blt  r3, r2, done   ; stop once n < i
        add  r1, r1, r2
        addi r2, r2, 1
        j    loop
done:   halt
'''
r = run(SUM, {'r3': 10})
assert r['r1'] == 55 and r['r2'] == 11 and r['r3'] == 10, r
assert run(SUM, {'r3': 0})['r1'] == 0
assert set(run('halt')) == {f'r{i}' for i in range(8)} and all(v == 0 for v in run('halt').values())
r = run(chr(10).join(['li r1, 6', 'li r2, 7', 'mul r3, r1, r2', 'sub r4, r1, r2', 'mov r5, r3', 'addi r6, r5, -2']))
assert (r['r3'], r['r4'], r['r5'], r['r6']) == (42, -1, 42, 40), 'Running off the end halts.'
FACT = '''
        li   r2, 1          ; result
        li   r3, 1
top:    beq  r1, r0, end    ; r0 is 0
        mul  r2, r2, r1
        sub  r1, r1, r3
        j    top
end:    halt
'''
assert run(FACT, {'r1': 10})['r2'] == 3628800
assert run(chr(10).join(['beq r0, r0, x', 'li r1, 9', 'x: bne r0, r1, y', 'li r2, 5', 'y: halt']))['r2'] == 5` },
          { name: "calls and errors", code: `CALLS = '''
        li   r1, 3
        call sq
        mov  r6, r1
        li   r1, 5
        call sq
        halt
sq:     push r2
        mul  r2, r1, r1
        mov  r1, r2
        pop  r2
        ret
'''
r = run(CALLS, {'r2': 99})
assert r['r6'] == 9 and r['r1'] == 25 and r['r2'] == 99, 'Calls return to the next instruction; push and pop restore r2.'
for bad in ['j nowhere', 'frob r1', chr(10).join(['a: halt', 'a: halt'])]:
    try:
        run(bad)
        assert False, f'{bad!r} should raise ValueError.'
    except ValueError:
        pass
try:
    run('spin: j spin', max_steps=1000)
    assert False, 'An endless loop raises RuntimeError at the step limit.'
except RuntimeError:
    pass
FIB = '''
        li   r2, 0
        li   r3, 1
        li   r4, 1
again:  beq  r1, r0, out
        add  r5, r2, r3
        mov  r2, r3
        mov  r3, r5
        sub  r1, r1, r4
        j    again
out:    halt
'''
assert run(FIB, {'r1': 90})['r2'] == 2880067194370816120` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Now program the toy machine. <C>run</C> is already defined. Write three source strings:</p>
          <ul>
            <li>
              <C>GCD_PROGRAM</C>: from positive r1 and r2, leave their greatest common divisor in r1. There is no division, so
              use repeated subtraction.
            </li>
            <li><C>SORT3_PROGRAM</C>: sort r1, r2, r3 into increasing order (you may use r7 as scratch).</li>
            <li>
              <C>FACT_PROGRAM</C>: from n ≥ 0 in r1, leave n! in r2 and r1 unchanged, as a recursive function entered with{" "}
              <C>call</C> and left with <C>ret</C>.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        setup: `def run(source, regs=None, max_steps=100000):
    program, labels = [], {}
    for line in source.splitlines():
        line = line.split(';')[0].strip()
        while ':' in line:
            label, line = line.split(':', 1)
            label = label.strip()
            if label in labels:
                raise ValueError(f'duplicate label {label}')
            labels[label] = len(program)
            line = line.strip()
        if line:
            op, _, rest = line.partition(' ')
            program.append((op, [a.strip() for a in rest.split(',')] if rest.strip() else []))
    r = {f'r{i}': 0 for i in range(8)}
    r.update(regs or {})

    def target(name):
        if name not in labels:
            raise ValueError(f'unknown label {name}')
        return labels[name]

    stack, pc, steps = [], 0, 0
    while pc < len(program):
        steps += 1
        if steps > max_steps:
            raise RuntimeError('step limit exceeded')
        op, a = program[pc]
        pc += 1
        if op == 'li':
            r[a[0]] = int(a[1])
        elif op == 'mov':
            r[a[0]] = r[a[1]]
        elif op in ('add', 'sub', 'mul'):
            x, y = r[a[1]], r[a[2]]
            r[a[0]] = x + y if op == 'add' else x - y if op == 'sub' else x * y
        elif op == 'addi':
            r[a[0]] = r[a[1]] + int(a[2])
        elif op in ('beq', 'bne', 'blt'):
            x, y = r[a[0]], r[a[1]]
            if (x == y) if op == 'beq' else (x != y) if op == 'bne' else (x < y):
                pc = target(a[2])
        elif op == 'j':
            pc = target(a[0])
        elif op == 'push':
            stack.append(r[a[0]])
        elif op == 'pop':
            r[a[0]] = stack.pop()
        elif op == 'call':
            stack.append(pc)
            pc = target(a[0])
        elif op == 'ret':
            pc = stack.pop()
        elif op == 'halt':
            break
        else:
            raise ValueError(f'unknown instruction {op}')
    return r`,
        starter: `# Each program is toy-assembly source for run(), which is already defined.

GCD_PROGRAM = '''
        halt
'''

SORT3_PROGRAM = '''
        halt
'''

FACT_PROGRAM = '''
        halt
'''
`,
        solution: `# Each program is toy-assembly source for run(), which is already defined.

GCD_PROGRAM = '''
loop:   beq  r1, r2, done      ; equal: that is the gcd
        blt  r1, r2, swap
        sub  r1, r1, r2        ; r1 > r2: r1 -= r2
        j    loop
swap:   sub  r2, r2, r1        ; r2 > r1: r2 -= r1
        j    loop
done:   halt
'''

SORT3_PROGRAM = '''
        blt  r2, r1, s12       ; make r1 <= r2
c23:    blt  r3, r2, s23       ; make r2 <= r3
        halt
s12:    mov  r7, r1
        mov  r1, r2
        mov  r2, r7
        j    c23
s23:    mov  r7, r2
        mov  r2, r3
        mov  r3, r7
        blt  r2, r1, s12       ; the new r2 may be below r1
        halt
'''

FACT_PROGRAM = '''
        call fact
        halt
fact:   li   r6, 1
        blt  r6, r1, rec       ; n > 1: recurse
        li   r2, 1             ; fact(0) = fact(1) = 1
        ret
rec:    push r1
        addi r1, r1, -1
        call fact              ; r2 = fact(n - 1)
        pop  r1
        mul  r2, r2, r1        ; r2 = n * fact(n - 1)
        ret
'''
`,
        tests: [
          { name: "gcd", code: `from math import gcd
for a in range(1, 40):
    for b in range(1, 40):
        r = run(GCD_PROGRAM, {'r1': a, 'r2': b}, max_steps=200)
        assert r['r1'] == gcd(a, b), f'gcd({a}, {b}) should leave {gcd(a, b)} in r1, got {r["r1"]}.'
r = run(GCD_PROGRAM, {'r1': 1071, 'r2': 462}, max_steps=200)
assert r['r1'] == 21, 'gcd(1071, 462) is 21.'` },
          { name: "sort and factorial", code: `from itertools import product
from math import factorial
for x, y, z in product([-3, 0, 2, 2, 7], repeat=3):
    r = run(SORT3_PROGRAM, {'r1': x, 'r2': y, 'r3': z}, max_steps=60)
    got = [r['r1'], r['r2'], r['r3']]
    assert got == sorted([x, y, z]), f'Sorting {[x, y, z]} gave {got}.'
ops = [l.split(';')[0].split(':')[-1].split()[:1] for l in FACT_PROGRAM.splitlines()]
assert ['call'] in ops and ['ret'] in ops, 'FACT_PROGRAM should be a function, entered with call and left with ret.'
for n in range(0, 21):
    r = run(FACT_PROGRAM, {'r1': n}, max_steps=1000)
    assert r['r2'] == factorial(n), f'fact({n}) should leave {factorial(n)} in r2, got {r["r2"]}.'
    assert r['r1'] == n, 'FACT_PROGRAM should leave r1 as it found it.'` },
        ],
      },
    },
    {
      key: "gcdproof",
      rung: "prove",
      prompt: <p>Prove that the subtractive GCD loop (replace the larger of a and b by their difference until they are equal) halts for positive a and b, and that it halts with both equal to gcd(a, b).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Invariant: gcd(a, b) is unchanged by replacing a by a − b, since any common divisor of a and b divides a − b and conversely.",
          "Both values stay positive, because only the strictly larger one is reduced by the smaller.",
          "Termination: a + b is a positive integer that strictly decreases each step, so the loop stops.",
          "At the end a = b, and gcd(a, a) = a, so the common value is the gcd of the original pair.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>The subtractive GCD can take very many steps. Give inputs below 1000 that make it take more than 900 subtractions, and explain how adding a single remainder instruction would bound the steps by a multiple of the number of digits.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Gives a pair such as (999, 1), which needs 998 subtractions.",
          "Notes repeated subtraction of b from a is exactly computing a mod b, one step per multiple removed.",
          "With a mod instruction each step is Euclid's algorithm, and every two steps at least halve the larger number.",
          "Concludes the step count is O(log min(a, b)), proportional to the number of digits (Lamé's theorem: Fibonacci pairs are worst).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a processor that only has jumps and a stack can run a recursive function and come back to the right place.",

  glimpse: (
    <p>
      Every load and store in these programs was treated as instant. Next chapter: why reading memory can cost a hundred
      times more than adding two registers, and how caches hide most of it.
    </p>
  ),
};
