import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.3.3";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.3.3",
  minutes: 45,
  links: {
    revisits: ["e0.3.2"],
    foreshadows: ["e1.3.2", "e3.2.2"],
  },

  puzzle: (
    <>
      <p>
        Two people on a large team each write a function. Both happen to use a variable called <C>total</C> inside their
        function, for completely different purposes. Neither knows about the other.
      </p>
      <p>
        If a variable name meant the same thing everywhere in a program, what would go wrong when both functions run? What
        rule would you want the language to follow so that this cannot happen?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Python&rsquo;s rule is that each call of a function gets its own private set of variables. A name assigned inside a
        function is <strong>local</strong>: it exists only during that call, and it is separate from any variable of the
        same name elsewhere. The two <C>total</C>s never meet.
      </p>
      <p>
        The program below has a <strong>global</strong> variable, <C>rate</C>, and a function that assigns its own{" "}
        <C>rate</C>. While a function runs, the variables box shows the global variables first, then the function&rsquo;s
        local ones. Watch whether the global <C>rate</C> ever changes.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="scope">
        <p>
          The <strong>scope</strong> of a name is the part of the program where it can be used. Names assigned at the top
          level of a file, outside any function, are <strong>global</strong> and can be read anywhere in the file. Names
          assigned inside a function, including its parameters, are <strong>local</strong> to that function. Local
          variables are created when the function is called and disappear when it returns.
        </p>
      </Definition>

      <Definition title="how Python finds a name">
        <p>
          When code inside a function uses a name, Python looks first among the function&rsquo;s local variables, then among
          the global ones, and finally among the built-in names such as <C>print</C> and <C>len</C>. The first match wins.
        </p>
        <p>
          Python decides which names are local before the function runs: <em>any</em> name assigned anywhere in the body is
          local throughout the body. That is why this fails:
        </p>
        <Code>{`
count = 0
def bump():
    count = count + 1   # UnboundLocalError
`}</Code>
        <p>
          Because <C>count</C> is assigned in <C>bump</C>, it is local there, and the right side tries to read the local{" "}
          <C>count</C> before it has a value.
        </p>
      </Definition>

      <Definition title="the global statement">
        <p>
          Writing <C>global count</C> at the top of the function tells Python that <C>count</C> in this function means the
          global variable, so assigning to it changes the global. It works, but use it rarely.
        </p>
      </Definition>

      <Example title="passing values in and out instead">
        <Code>{`
def bump(count):
    return count + 1

count = 0
count = bump(count)
count = bump(count)    # count is now 2
`}</Code>
        <p>
          The function receives what it needs as a parameter and gives back its result, and the caller decides what to do
          with it. Nothing outside the function changes unless the caller says so.
        </p>
      </Example>

      <Remark title="why globals cause trouble">
        <p>
          A function that changes global variables can affect any other part of the program, so to understand it you must
          understand the whole program. A function that only uses its parameters and its return value can be understood, and
          tested, on its own. Constants that never change, such as a tax rate written in capitals, <C>GST_RATE = 0.18</C>, are
          a reasonable exception.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "local",
      rung: "check",
      prompt: <p>A variable is assigned inside a function. Where can it be used?</p>,
      answer: { kind: "choice", options: ["Only inside that function, during the call", "Anywhere in the program", "Anywhere after the function is first called"], correct: [0] },
    },
    {
      key: "lookup",
      rung: "check",
      prompt: <p>Inside a function, a name is read but never assigned. Where does Python look for it first, and next?</p>,
      answer: { kind: "choice", options: ["Local variables, then global, then built-in", "Global, then local", "Built-in, then global, then local"], correct: [0] },
    },
    {
      key: "shadow",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
x = 5

def f():
    x = 99
    return x

y = f()
print(x + y)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 104 },
    },
    {
      key: "global",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
total = 0

def add(n):
    global total
    total = total + n

add(3)
add(4)
print(total)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "unbound",
      rung: "apply",
      prompt: (
        <>
          <p>What happens when <C>bump()</C> is called?</p>
          <Code>{`
count = 0

def bump():
    count = count + 1

bump()
`}</Code>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["An error, because count is local to bump and has no value yet", "The global count becomes 1", "A new local count becomes 1, and the global stays 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 5
def f():
    x = 10
    return x
def g():
    return x + 1
print(f(), g(), x)`}</Code>
          <p>Each function has its own local names. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10 6 5", "10 11 10", "10 6 10", "5 6 5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 1
def f():
    x = 2
    def g():
        return x
    return g()
def h():
    return x
print(f(), h(), x)`}</Code>
          <p>Which x does each function see? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 1 1", "1 1 1", "2 2 1", "2 2 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            This counter does not work, because <C>count</C> inside the function is local. Rewrite <C>tick(count)</C> so it takes the current count and returns the new one, with no global variables.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `count = 0

def tick():
    count = 0
    count = count + 1
    return count
`,
        solution: `def tick(count):
    return count + 1
`,
        tests: [
          { name: "ticks", code: `c = 0
for _ in range(3):
    c = tick(c)
assert c == 3, 'Pass the count in and return the new value.'` },
          { name: "values", code: `assert tick(41) == 42 and tick(-1) == 0 and tick(tick(0)) == 2, 'tick returns one more than its argument.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Keep state in a closure instead of a global. Write <C>make_account(balance)</C>, which returns a tuple of three functions (deposit, withdraw, history): <C>deposit(x)</C> and <C>withdraw(x)</C> change the balance shared through <C>nonlocal</C> and return the new balance; both raise <C>ValueError</C> for an amount that is not positive, and withdraw raises <C>ValueError</C> if the balance would go negative (leaving it unchanged). <C>history()</C> returns a new list of (kind, amount) for the successful operations.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def make_account(balance):
    def deposit(x):
        return balance + x
    def withdraw(x):
        return balance - x
    def history():
        return []
    return deposit, withdraw, history
`,
        solution: `def make_account(balance):
    log = []
    def deposit(x):
        nonlocal balance
        if x <= 0:
            raise ValueError('amount must be positive')
        balance += x
        log.append(('deposit', x))
        return balance
    def withdraw(x):
        nonlocal balance
        if x <= 0 or x > balance:
            raise ValueError('invalid withdrawal')
        balance -= x
        log.append(('withdraw', x))
        return balance
    def history():
        return list(log)
    return deposit, withdraw, history
`,
        tests: [
          { name: "shared", code: `d, w, h = make_account(100)
assert d(50) == 150 and w(30) == 120 and d(5) == 125, 'Deposits and withdrawals share one balance.'` },
          { name: "errors", code: `d, w, h = make_account(100)
for f, x in ((w, 101), (d, 0), (w, -5)):
    try:
        f(x)
        assert False, 'Invalid amounts must raise ValueError.'
    except ValueError:
        pass
assert w(100) == 0 and h() == [('withdraw', 100)], 'Failed operations change nothing and are not logged.'` },
          { name: "separate", code: `d1, w1, h1 = make_account(10)
d2, w2, h2 = make_account(10)
d1(5)
assert w2(10) == 0 and d1(1) == 16 and len(h1()) == 2 and len(h2()) == 1, 'Two accounts never share state.'
lst = h1(); lst.clear()
assert len(h1()) == 2, 'history returns a copy.'` },
        ],
      },
    },
    {
      key: "noglobals",
      rung: "prove",
      prompt: (
        <p>
          Explain why a function that receives its inputs as parameters and returns its result is easier to understand,
          reuse and test than one that reads and changes global variables. Illustrate with a short example of each.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a function that changes a global, and an equivalent one using a parameter and return.",
          "Explains that the global version can change or depend on state anywhere in the program, so its effect cannot be understood locally.",
          "Explains that the parameter version's behaviour depends only on its arguments, so it can be reused in other programs.",
          "Explains that the parameter version can be tested by calling it with chosen values and checking the result, without setting up global state.",
        ],
      },
    },
    {
      key: "layers",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
n = 1

def f(n):
    n = n * 10
    return n + 1

def g():
    return f(n) + n

print(g())
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 12 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between local and global variables, the order in which Python looks up a name, and why passing values in and out beats using globals.",

  glimpse: (
    <p>
      Next, using functions to break a whole problem into parts. In Python, NumPy and the Command Line you will meet closures,
      functions that remember variables from the scope where they were made, and in Computer Systems you will see the stack of
      memory that holds each call&rsquo;s local variables.
    </p>
  ),
};
