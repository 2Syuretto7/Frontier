import type { ErrorInfo } from "./runtime";

/** What a Python error means, in plain words, with what to look for. Never says how to fix the exercise itself. */
export function explainError(info: ErrorInfo): string {
  const { type, message } = info;
  const quoted = /'([^']+)'/.exec(message)?.[1];

  if (type === "SyntaxError") {
    if (/never closed|unmatched|was not closed/.test(message)) return "A bracket or quote is opened but never closed, or closed without being opened. Count them on this line and the line before.";
    if (/expected ':'/.test(message)) return "Lines that start a block (if, elif, else, for, while, def, class) must end with a colon.";
    if (/unterminated string/.test(message)) return "A piece of text starts with a quote but has no matching quote at the end.";
    if (/invalid syntax\. Perhaps you forgot a comma/.test(message)) return "Two values sit side by side with nothing between them. Items in a list or arguments in a call are separated by commas.";
    if (/cannot assign|assign to/.test(message)) return "The left of = must be a name (or an item or attribute). To compare two things, use ==.";
    return "Python could not read this line. Look for a missing bracket, colon, comma or quote, here or at the end of the line before.";
  }
  if (type === "IndentationError" || type === "TabError") {
    if (/expected an indented block/.test(message)) return "A line ending in a colon must be followed by at least one indented line, the body of the block.";
    if (/unexpected indent/.test(message)) return "This line is indented more than the code around it, but nothing above it opens a block.";
    if (/unindent does not match/.test(message)) return "This line's indentation does not line up with any block above it. Lines in the same block must start at exactly the same column.";
    return "The spaces at the start of this line are not what Python expects. Lines in one block must line up, four spaces per level.";
  }
  switch (type) {
    case "NameError":
      return `Python does not know the name ${quoted ? `"${quoted}"` : "used here"}. Check its spelling and capitals, and that it is given a value (or imported) before this line runs.`;
    case "UnboundLocalError":
      return "Inside a function, this name is assigned somewhere, so Python treats it as local to the function, but it is used before that assignment runs.";
    case "TypeError":
      if (/not callable/.test(message)) return "Something that is not a function is being called with brackets (). Perhaps a name was reused for a value.";
      if (/argument/.test(message)) return "A function received a different number or kind of arguments than it was defined to take. Compare the call with the def line.";
      if (/subscriptable/.test(message)) return "Square brackets [] are being used on a value that has no items, such as a number or None.";
      if (/NoneType/.test(message)) return "A value is None where something else was expected. A function without a return statement gives back None.";
      if (/concatenate|unsupported operand/.test(message)) return "An operation is being applied to two values of types that do not combine, such as text and a number. Convert one of them first, for example with str() or int().";
      return "An operation was given a value of the wrong type. Print the values involved, and their type(), just before this line.";
    case "IndexError":
      return "A position is outside the list (or array). Valid positions run from 0 to the length minus 1. Check the loop's range and any +1 or -1.";
    case "KeyError":
      return `The dictionary has no key ${quoted ? `"${quoted}"` : "like this"}. Print its keys() to see what it holds, or use .get() with a default.`;
    case "AttributeError":
      return `The value has no attribute or method ${quoted ? `"${/attribute '([^']+)'/.exec(message)?.[1] ?? quoted}"` : "with this name"}. Check the spelling, and print type() of the value to see what it really is.`;
    case "ValueError":
      if (/broadcast|shapes?/.test(message)) return "The arrays' shapes do not fit together for this operation. Print each array's .shape and compare them, dimension by dimension from the right.";
      if (/invalid literal/.test(message)) return "Text that does not look like a number is being converted with int() or float().";
      if (/unpack/.test(message)) return "The number of names on the left of = does not match the number of values on the right.";
      return "A value has the right type but an unusable value for this operation.";
    case "ZeroDivisionError":
      return "A number is being divided by zero. Which value can become zero here, and when?";
    case "ModuleNotFoundError":
    case "ImportError":
      return "This module is not available. Frontier runs Python in your browser, with the standard library, NumPy, pandas, SciPy, Matplotlib, scikit-learn and SymPy.";
    case "RecursionError":
      return "A function keeps calling itself without stopping. Check that the base case is reached for every input.";
    case "FileNotFoundError":
      return "There is no file at this path. Check the name and folder exactly; letter case matters.";
    case "AssertionError":
      return "An assert statement found its condition false.";
    case "OverflowError":
      return "A number grew too large to represent. Look for something that grows on every step.";
    case "EOFError":
      return "The program asked for input with input(), but none was left. Type one line per input() call in the Input box.";
    case "MemoryError":
      return "The program tried to use more memory than the browser allows. Look for a list or array that grows without end.";
    default:
      return "Read the last line of the message first; it names the problem. The line number shows where Python noticed it.";
  }
}
