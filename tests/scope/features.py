"""Reads a JSON list of Python sources on stdin and prints, for each, the Python features it uses (or null if it is not Python)."""
import ast
import json
import sys

STDLIB = set(getattr(sys, "stdlib_module_names", ()))


def features(src):
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return None
    f = set()
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            f.add("def")
        elif isinstance(n, ast.Lambda):
            f.add("lambda")
        elif isinstance(n, ast.ClassDef):
            f.add("class")
        elif isinstance(n, (ast.If, ast.IfExp)):
            f.add("if")
        elif isinstance(n, (ast.For, ast.While)):
            f.add("loop")
        elif isinstance(n, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            f.add("comprehension")
        elif isinstance(n, ast.List):
            f.add("list")
        elif isinstance(n, ast.Dict):
            f.add("dict")
        elif isinstance(n, ast.Set):
            f.add("set")
        elif isinstance(n, (ast.Try, ast.Raise)):
            f.add("exceptions")
        elif isinstance(n, (ast.Yield, ast.YieldFrom)):
            f.add("generator")
        elif isinstance(n, ast.With):
            f.add("with")
        elif isinstance(n, (ast.Global, ast.Nonlocal)):
            f.add("global")
        elif isinstance(n, ast.JoinedStr):
            f.add("fstring")
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            names = [a.name for a in n.names] if isinstance(n, ast.Import) else [n.module or ""]
            for name in names:
                top = name.split(".")[0]
                f.add("import:std" if top in STDLIB else "import:" + top)
        elif isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ("enumerate", "zip", "sorted", "open", "input"):
            f.add(n.func.id)
        elif isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ("set", "frozenset", "dict"):
            f.add("dict" if n.func.id == "dict" else "set")
        elif isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr in ("items", "values", "keys"):
            f.add("dict")
    return sorted(f)


print(json.dumps([features(s) for s in json.load(sys.stdin)]))
