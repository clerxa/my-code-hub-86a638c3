/**
 * Safe math expression evaluator.
 * Only supports: numbers, +, -, *, /, parentheses.
 * No access to browser APIs, no arbitrary code execution.
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if ('+-*/'.includes(ch)) { tokens.push({ type: 'op', value: ch }); i++; continue; }
    if ('()'.includes(ch)) { tokens.push({ type: 'paren', value: ch }); i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++; }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) throw new Error('Invalid number: ' + num);
      tokens.push({ type: 'number', value: parsed });
      continue;
    }
    throw new Error('Unexpected character: ' + ch);
  }
  return tokens;
}

// Recursive descent parser: expr -> term ((+|-) term)*
// term -> factor ((*|/) factor)*
// factor -> number | '(' expr ')' | unary +/- factor

function parse(tokens: Token[]): number {
  let pos = 0;

  function peek(): Token | undefined { return tokens[pos]; }
  function consume(): Token { return tokens[pos++]; }

  function parseExpr(): number {
    let result = parseTerm();
    while (peek()?.type === 'op' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      result = op === '+' ? result + right : result - right;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (peek()?.type === 'op' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value;
      const right = parseFactor();
      if (op === '/' && right === 0) throw new Error('Division by zero');
      result = op === '*' ? result * right : result / right;
    }
    return result;
  }

  function parseFactor(): number {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');

    // Unary +/-
    if (t.type === 'op' && (t.value === '+' || t.value === '-')) {
      consume();
      const val = parseFactor();
      return t.value === '-' ? -val : val;
    }

    if (t.type === 'number') { consume(); return t.value; }

    if (t.type === 'paren' && t.value === '(') {
      consume();
      const result = parseExpr();
      const closing = consume();
      if (!closing || closing.value !== ')') throw new Error('Missing closing parenthesis');
      return result;
    }

    throw new Error('Unexpected token: ' + JSON.stringify(t));
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected token after expression');
  return result;
}

/**
 * Safely evaluate a math expression string containing only numbers and basic operators.
 * Throws on invalid input. Returns NaN-safe result.
 */
export function safeMathEval(expression: string): number {
  if (!expression || !expression.trim()) return 0;
  const tokens = tokenize(expression.trim());
  if (tokens.length === 0) return 0;
  return parse(tokens);
}
