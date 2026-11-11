import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SqlViz } from "@/components/viz/SqlViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.7.3",
  minutes: 50,
  links: {
    requires: ["e1.7.1"],
    revisits: ["e1.7.2"],
    foreshadows: ["e2.3.1", "e2.4.2"],
  },

  puzzle: (
    <>
      <p>This query runs, and returns one row per city:</p>
      <Code>{`SELECT c.city, SUM(o.amount) AS total
FROM orders AS o JOIN customers AS c ON o.customer_id = c.id
GROUP BY c.city
ORDER BY total DESC;`}</Code>
      <p>
        But move the condition <C>total &gt; 1000</C> into a <C>WHERE</C> clause and the database refuses, saying that{" "}
        <C>total</C> does not exist. Yet <C>ORDER BY</C> used <C>total</C> without complaint. Why can one clause see the name
        and the other not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A query is written in one order and evaluated in another. <C>FROM</C> and <C>JOIN</C> come first, then{" "}
        <C>WHERE</C>, <C>GROUP BY</C>, <C>HAVING</C>, <C>SELECT</C>, <C>ORDER BY</C> and <C>LIMIT</C>. A clause can only use
        what earlier clauses have made. Step through the query below and watch the table after each clause.
      </p>
      <SqlViz />
    </>
  ),

  theory: (
    <>
      <Definition title="relational tables">
        <p>
          A relational database stores tables with fixed, typed columns. A <strong>primary key</strong> identifies each row,
          such as <C>customers.id</C>. A <strong>foreign key</strong>, such as <C>orders.customer_id</C>, refers to a row of
          another table. Information is stored once and combined at query time by joins.
        </p>
      </Definition>

      <Definition title="the clauses, in evaluation order">
        <p>
          <C>FROM</C>/<C>JOIN</C> builds the rows; <C>WHERE</C> keeps rows that satisfy a condition; <C>GROUP BY</C> forms
          groups; <C>HAVING</C> keeps groups, using aggregates such as <C>COUNT(*)</C> or <C>SUM(x)</C>; <C>SELECT</C>{" "}
          computes the output columns and names them; <C>ORDER BY</C> sorts; <C>LIMIT</C> keeps the first rows. After{" "}
          <C>GROUP BY</C>, <C>SELECT</C> may only use the grouping columns and aggregates.
        </p>
      </Definition>

      <Example title="joins">
        <Code>{`-- inner join: only orders whose customer exists
SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;

-- left join: every customer, with NULLs where there is no order
SELECT c.name, COUNT(o.id) AS n
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;`}</Code>
        <p>
          <C>COUNT(o.id)</C> counts non-null values, so a customer with no orders gets 0, while <C>COUNT(*)</C> would count
          the single row of NULLs and give 1.
        </p>
      </Example>

      <Example title="SQL from Python">
        <Code>{`import sqlite3
con = sqlite3.connect("shop.db")
rows = con.execute(
    "SELECT name FROM customers WHERE city = ?", (city,)
).fetchall()`}</Code>
        <p>
          The <C>?</C> is a parameter. Never build a query by pasting user input into the string: input such as{" "}
          <C>&apos;; DROP TABLE customers; --</C> would become part of the query. This attack is called SQL injection.
        </p>
      </Example>

      <Remark title="declarative">
        <p>
          SQL says what result you want, not how to compute it. The database&rsquo;s planner chooses how: which table to scan
          first, whether to use an <strong>index</strong> (a sorted tree over a column that finds matching rows without reading
          every row) and whether to join by hashing or by sorting. The same group-by and join you wrote in pandas are here,
          planned for you.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>Which clause is evaluated first?</p>,
      answer: { kind: "choice", options: ["WHERE", "GROUP BY", "SELECT", "ORDER BY"], correct: [0] },
    },
    {
      key: "having",
      rung: "check",
      prompt: <p>What is the difference between WHERE and HAVING?</p>,
      answer: {
        kind: "choice",
        options: [
          "WHERE filters rows before grouping; HAVING filters groups after",
          "They are synonyms",
          "HAVING filters rows; WHERE filters groups",
        ],
        correct: [0],
      },
    },
    {
      key: "delhi",
      rung: "apply",
      prompt: <p>In the query in the chart above, what is the total for Delhi after GROUP BY?</p>,
      answer: { kind: "numeric", value: 970 },
    },
    {
      key: "pune",
      rung: "apply",
      prompt: (
        <p>
          Using the same tables, how many rows does this return?{" "}
          <C>SELECT o.id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.city = &apos;Pune&apos;;</C>
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "left",
      rung: "apply",
      prompt: (
        <p>
          A fifth customer, Zoya, is added with no orders. How many rows does{" "}
          <C>SELECT * FROM customers c LEFT JOIN orders o ON o.customer_id = c.id</C> now return, given the eight orders?
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sqlite3
db = sqlite3.connect(":memory:")
db.execute("create table t (dept text, pay int)")
db.executemany("insert into t values (?, ?)", [("ml", 90), ("ml", 70), ("infra", 80), ("infra", 60), ("infra", 100)])
print(db.execute("select dept, count(*), avg(pay) from t group by dept having count(*) > 2").fetchall())`}</Code>
          <p>GROUP BY with HAVING filters whole groups. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[('infra', 3, 80.0)]", "[('infra', 3, 80.0), ('ml', 2, 80.0)]", "[('ml', 2, 80.0)]", "[]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("create table s(name, city); insert into s values ('a','Pune'),('b','Delhi'),('c','Pune'),('d',NULL);")
print(db.execute("select count(*), count(city), count(distinct city) from s").fetchone(), db.execute("select city, count(*) from s group by city order by 2 desc, 1 limit 1").fetchone())`}</Code>
          <p>COUNT(*) against COUNT(column) when a value is NULL, and a grouped query. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(4, 3, 2) ('Pune', 2)", "(4, 4, 3) ('Pune', 2)", "(3, 3, 2) ('Pune', 2)", "(4, 3, 2) ('Delhi', 1)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A SQLite database <C>db</C> has tables <C>students(id, name)</C> and <C>marks(student_id, subject, score)</C>. Set <C>QUERY</C> to SQL that returns each student&rsquo;s name and average score, highest average first, for students with at least two marks. Use a JOIN.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `QUERY = "select name from students"
`,
        solution: `QUERY = """
select s.name, avg(m.score) as avg_score
from students s join marks m on m.student_id = s.id
group by s.id, s.name
having count(*) >= 2
order by avg_score desc
"""
`,
        tests: [
          { name: "result", code: `rows = db.execute(QUERY).fetchall()
assert [(r[0], round(r[1], 2)) for r in rows] == [('Asha', 85.0), ('Ravi', 80.0)], 'Join, group by student, keep groups with count(*) >= 2, order by the average. Zoya has only one mark.'` },
          { name: "columns", code: `rows = db.execute(QUERY).fetchall()
assert len(rows) == 2 and len(rows[0]) == 2, 'Return two columns: name and average.'` },
        ],
        setup: `import sqlite3
db = sqlite3.connect(':memory:')
db.executescript('''
create table students (id int, name text);
create table marks (student_id int, subject text, score int);
insert into students values (1, 'Asha'), (2, 'Ravi'), (3, 'Zoya');
insert into marks values (1, 'maths', 90), (1, 'physics', 80), (2, 'maths', 60), (2, 'physics', 90), (2, 'chemistry', 90), (3, 'maths', 100);
''')
`,
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>create_schema(db)</C> for an SQLite connection: tables <C>customers</C> (columns <C>id INTEGER PRIMARY KEY</C> and <C>name TEXT NOT NULL UNIQUE</C>) and <C>orders</C> (columns <C>id INTEGER PRIMARY KEY</C>, <C>customer_id INTEGER NOT NULL REFERENCES customers(id)</C>, <C>item TEXT</C>, <C>qty INTEGER CHECK (qty &gt; 0)</C> and <C>price REAL</C>), with foreign keys switched on. Write <C>place_order(db, name, items)</C>, which inserts the customer if new and one row per (item, qty, price) inside a single transaction (<C>with db:</C>), so that if any row fails (an <C>sqlite3.IntegrityError</C>) nothing is saved and the error propagates. Then write <C>totals(db)</C>, a list of (name, total spend) for every customer, including those with no orders (0), highest first, then by name, using a LEFT JOIN and parameterised queries throughout.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def create_schema(db):
    pass

def place_order(db, name, items):
    pass

def totals(db):
    return []
`,
        solution: `import sqlite3

def create_schema(db):
    db.execute('PRAGMA foreign_keys = ON')
    db.executescript('''
        CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
        CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), item TEXT, qty INTEGER CHECK (qty > 0), price REAL);
    ''')

def place_order(db, name, items):
    with db:
        db.execute('INSERT OR IGNORE INTO customers(name) VALUES (?)', (name,))
        (cid,) = db.execute('SELECT id FROM customers WHERE name = ?', (name,)).fetchone()
        db.executemany('INSERT INTO orders(customer_id, item, qty, price) VALUES (?, ?, ?, ?)', [(cid, i, q, p) for i, q, p in items])

def totals(db):
    return db.execute('''
        SELECT c.name, COALESCE(SUM(o.qty * o.price), 0) AS total
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id ORDER BY total DESC, c.name
    ''').fetchall()
`,
        tests: [
          { name: "orders", code: `import sqlite3
db = sqlite3.connect(':memory:')
create_schema(db)
place_order(db, 'Asha', [('pen', 2, 10.0), ('book', 1, 250.0)])
place_order(db, 'Ravi', [('pen', 5, 10.0)])
place_order(db, 'Asha', [('ink', 1, 30.0)])
assert totals(db) == [('Asha', 300.0), ('Ravi', 50.0)] and db.execute('select count(*) from customers').fetchone() == (2,)` },
          { name: "atomic", code: `import sqlite3
db = sqlite3.connect(':memory:')
create_schema(db)
place_order(db, 'Asha', [('pen', 1, 10.0)])
try:
    place_order(db, 'Zoya', [('pen', 1, 10.0), ('bad', 0, 5.0)])
    assert False, 'qty 0 breaks the CHECK constraint.'
except sqlite3.IntegrityError:
    pass
assert totals(db) == [('Asha', 10.0)], 'The failed order leaves nothing behind, not even the new customer.'` },
          { name: "left join", code: `import sqlite3
db = sqlite3.connect(':memory:')
create_schema(db)
db.execute("insert into customers(name) values ('Dev')")
place_order(db, 'Cara', [('x', 1, 1.0)])
assert totals(db) == [('Cara', 1.0), ('Dev', 0)]
try:
    with db:
        db.execute('insert into orders(customer_id, item, qty, price) values (99, ?, 1, 1.0)', ('ghost',))
    assert False, 'Foreign keys must be enforced.'
except sqlite3.IntegrityError:
    pass` },
        ],
      },
    },
    {
      key: "alias",
      rung: "prove",
      prompt: (
        <p>
          Using the evaluation order, explain why <C>WHERE total &gt; 1000</C> fails while <C>ORDER BY total</C> works, and
          why <C>WHERE SUM(o.amount) &gt; 1000</C> also fails. Then rewrite the condition so that the query returns only cities
          whose total exceeds 1000.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that WHERE runs before SELECT, so the alias total does not exist yet, while ORDER BY runs after SELECT.",
          "Explains that WHERE acts on single rows before grouping, so an aggregate has nothing to aggregate there.",
          "Rewrites the condition as HAVING SUM(o.amount) > 1000 after GROUP BY.",
          "Notes that some databases also accept the alias in HAVING, but the aggregate form is portable.",
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: (
        <p>
          The eight orders total 3,310. You forget the <C>ON</C> condition, so every order is paired with each of the original four customers.
          What does <C>SELECT SUM(o.amount)</C> over that result return?
        </p>
      ),
      answer: { kind: "numeric", value: 13240 },
    },
  ],

  teachBack:
    "Explain to a friend the order in which a SQL query is evaluated, the difference between WHERE and HAVING, and what a join does.",

  glimpse: (
    <p>
      That completes Python, NumPy and the Command Line. Data Structures and Algorithms comes next: the hash tables behind
      every group-by and join, and the balanced trees behind every database index.
    </p>
  ),
};
