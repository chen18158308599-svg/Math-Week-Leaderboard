import "server-only";
import answers from "./answer-key.json";

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/[−–—]/g, "-").replace(/[×✕]/g, "*").replace(/[÷⁄]/g, "/").replace(/[，、]/g, ",").replace(/[；]/g, ";");
}

// Restricted arithmetic parser. Never executes user-supplied JavaScript.
export function arithmetic(text: string) {
  let source = normalize(text).replace(/^\s*(?:rm|myr)\s*/g, "").replace(/\b(?:rm|myr)\b/g, "").replace(/\$/g, "").trim();
  source = source.replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, match => match.replaceAll(",", "")).replace(/√/g, "sqrt");
  const numberWords: Record<string, string> = { "one third": "1/3", "one-third": "1/3", "two thirds": "2/3", "two-thirds": "2/3", "three": "3", "four": "4", "five": "5", "nine": "9", "twenty": "20", "twenty two": "22", "twenty-two": "22", "twenty four": "24", "twenty-four": "24", "forty eight": "48", "forty-eight": "48", "ninety nine": "99", "ninety-nine": "99", "ninety one": "91", "ninety-one": "91" };
  source = numberWords[source] ?? source;
  source = source.replace(/\s+/g, "").replace(/x/g, "*");
  const tokens = source.match(/sqrt|\d+(?:\.\d*)?|\.\d+|[()+*/^%-]/g) ?? [];
  if (!source || source.length > 240 || tokens.join("") !== source || tokens.length > 100) throw new Error("Use numbers, fractions or a mathematical expression.");
  let position = 0;
  const numbers: number[] = [];
  const safe = (n: number) => { if (!Number.isFinite(n) || Math.abs(n) > 1e14) throw new Error("Expression is too large or undefined."); return n; };
  function atom(): number {
    const token = tokens[position++];
    if (token === "+") return atom();
    if (token === "-") return -atom();
    if (token === "sqrt") return safe(Math.sqrt(atom()));
    if (token === "(") { const n = expression(); if (tokens[position++] !== ")") throw new Error("Check your brackets."); return n; }
    if (!token || !/^(\d+(\.\d*)?|\.\d+)$/.test(token)) throw new Error("Check your expression.");
    const n = Number(token); numbers.push(n); return n;
  }
  function power(): number {
    let n = atom();
    if (tokens[position] === "^") { position++; const exponent = atom(); if (Math.abs(exponent) > 12) throw new Error("Exponent is too large."); n = safe(n ** exponent); }
    if (tokens[position] === "%") { position++; n /= 100; }
    return n;
  }
  function term(): number {
    let n = power();
    while (position < tokens.length) {
      const operator = tokens[position];
      if (operator === "*" || operator === "/") { position++; const b = power(); n = safe(operator === "*" ? n * b : n / b); }
      else if (operator === "(" || operator === "sqrt") n = safe(n * power());
      else break;
    }
    return n;
  }
  function expression(): number {
    let n = term();
    while (["+", "-"].includes(tokens[position])) { const operator = tokens[position++]; const b = term(); n = safe(operator === "+" ? n + b : n - b); }
    return n;
  }
  const value = safe(expression());
  if (position !== tokens.length) throw new Error("Check your expression.");
  return { value, numbers, source };
}

function numeric(text: string, slug: string) {
  const units: Record<string, RegExp> = {
    "age-difference": /(?:years?\s*old|years?|yrs?|岁|年)$/,
    "six-matchsticks": /(?:triangles?|个|个三角形)$/,
    "lattice-areas": /(?:square\s*units?|units?\s*(?:squared|\^?2)|平方单位)$/,
    "falling-tree": /(?:ft|feet|foot|英尺)$/,
    "fake-coin": /(?:weighings?|times?|次)$/,
    "shortest-path": /(?:minutes?|mins?|min|分钟)$/,
    "kissing-circles": /(?:centimet(?:er|re)s?|cm|厘米)$/,
    "josephus": /(?:号|seat)$/,
  };
  let value = normalize(text).trim();
  if (units[slug]) value = value.replace(units[slug], "").trim();
  return arithmetic(value).value;
}

export function gradeCard(slug: string, input: unknown): { canonical: string; correct: boolean; formatError?: string } | null {
  const key = answers[slug as keyof typeof answers];
  if (!key) return null;
  const fields = Array.isArray(input) ? input : [input];
  if (fields.some(value => typeof value !== "string" || value.length > 500)) return { canonical: key.canonical, correct: false, formatError: "Please enter a shorter answer." };
  const values = fields as string[];
  if (!values.length || values.some(value => !value.trim())) return { canonical: key.canonical, correct: false, formatError: "Please complete every answer field. This does not use an attempt." };
  const expectedFields = ["radicals"].includes(key.rule) ? 3 : ["sums", "salary"].includes(key.rule) ? 2 : 1;
  if (values.length !== expectedFields) return { canonical: key.canonical, correct: false, formatError: "Please complete the answer fields separately." };
  try {
    let correct = false;
    const text = normalize(values[0]).trim();
    const close = (a: number, b: number, tolerance = 1e-7) => Math.abs(a - b) <= tolerance;
    if (key.rule === "wordset") {
      const selected = text.split(/[^a-z]+/).filter(Boolean);
      correct = selected.length === 4 && new Set(selected).size === 4 && selected.every(word => ["wow", "toot", "aha", "mum"].includes(word));
    } else if (key.rule === "sentence") correct = text.replace(/[^a-z]/g, "") === key.canonical.toLowerCase().replace(/[^a-z]/g, "");
    else if (["digits", "letters", "hanoi"].includes(key.rule)) {
      const compact = text.replace(/[\s,;\-]/g, "");
      if (!/^[a-z0-9]+$/.test(compact)) throw new Error("Enter the code only. Spaces and separators are optional.");
      correct = compact === key.canonical.toLowerCase();
    } else if (key.rule === "target24") {
      let expression = text;
      const equality = expression.split("=");
      if (equality.length > 2 || (equality.length === 2 && !close(arithmetic(equality[1]).value, 24))) throw new Error("Enter one expression, optionally followed by =24.");
      expression = equality[0];
      if (/[a-wyz^%√]/i.test(expression) || /sqrt/i.test(expression)) throw new Error("Use only the four numbers, +, -, ×, ÷ and brackets.");
      const parsed = arithmetic(expression);
      const numbers = [...parsed.numbers].sort((a, b) => a - b);
      correct = JSON.stringify(numbers) === "[1,6,10,12]" && close(parsed.value, 24);
    } else if (["radicals", "sums", "salary"].includes(key.rule)) {
      const numbers = values.map(value => numeric(value, slug));
      if (key.rule === "radicals") correct = close(numbers[0], 4 / 3, .005) && close(numbers[1], (1 + Math.sqrt(5)) / 2, .005) && close(numbers[2], 4);
      if (key.rule === "sums") correct = close(numbers[0], 45.5) && close(numbers[1], 50);
      if (key.rule === "salary") correct = close(numbers[0], 1254000) && close(numbers[1], 60000);
    }
    else {
      const number = numeric(values[0], slug);
      if (key.rule === "probability") correct = close(number, Number(slug === "monty-hall" ? 2 / 3 : 1 / 3), .005);
      else if (key.rule === "percent") correct = Math.round(text.includes("%") || (number > 0 && number < 1) ? number * 100 : number) === Number(key.canonical);
      else if (key.rule === "distance") correct = Math.round(number * 10) === 69;
      else if (key.rule === "radius") correct = Math.round(number) === 22;
      else correct = close(number, Number(key.canonical));
    }
    return { canonical: key.canonical, correct };
  } catch (error) {
    return { canonical: key.canonical, correct: false, formatError: `${error instanceof Error ? error.message : "Check the answer format."} This does not use an attempt.` };
  }
}
