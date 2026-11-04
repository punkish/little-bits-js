// node symbolic-math.js   (symbolic polynomial calculus)
//
// A polynomial is an array of { exp, coef } terms: descending exponents, like
// terms combined, zero coefficients dropped. So 3x^2 - x + 5 is
//   [{ exp: 2, coef: 3 }, { exp: 1, coef: -1 }, { exp: 0, coef: 5 }]
//
// Coefficients are exact fractions (fraction.js), the JS stand-in for Lisp's
// built-in rational numbers: the integral of 3x^2 - x + 5 really contains
// -1/2 x^2, not -0.5 x^2.
import Fraction from 'fraction.js';
import { fileURLToPath } from 'node:url';

const F = (x) => new Fraction(x);

// Combine like terms, drop zeros, sort by descending exponent.
export function polyNormalize(terms) {
  const sums = new Map();
  for (const { exp, coef } of terms) {
    sums.set(exp, (sums.get(exp) ?? F(0)).add(coef));
  }
  return [...sums]
    .filter(([, coef]) => coef.valueOf() !== 0)
    .map(([exp, coef]) => ({ exp, coef }))
    .sort((a, b) => b.exp - a.exp);
}

// Build from coefficients, highest degree first: poly(3, -1, 5) = 3x^2 - x + 5
export function poly(...coefs) {
  return polyNormalize(coefs.reverse().map((c, exp) => ({ exp, coef: F(c) })));
}

// Arithmetic and evaluation
export const polyAdd = (...ps) => polyNormalize(ps.flat());
export const polyScale = (p, k) => polyNormalize(p.map(({ exp, coef }) => ({ exp, coef: coef.mul(k) })));
export const polySub = (p, q) => polyAdd(p, polyScale(q, -1));
export const polyDegree = (p) => (p.length ? p[0].exp : -1);

// Exact if x is a Fraction, floating point if x is a plain number.
export function polyEvaluate(p, x) {
  if (x instanceof Fraction) {
    return p.reduce((sum, { exp, coef }) => sum.add(coef.mul(x.pow(exp))), F(0));
  }
  return p.reduce((sum, { exp, coef }) => sum + coef.valueOf() * x ** exp, 0);
}

// Calculus: the power rule and its reverse, repeated n times.
export function polyDeriv(p, n = 1) {
  for (let i = 0; i < n; i++) {
    p = p
      .filter(({ exp }) => exp !== 0) // constants vanish
      .map(({ exp, coef }) => ({ exp: exp - 1, coef: coef.mul(exp) }));
  }
  return p;
}

export function polyInteg(p, n = 1) {
  for (let i = 0; i < n; i++) {
    p = p.map(({ exp, coef }) => ({ exp: exp + 1, coef: coef.div(exp + 1) }));
  }
  return p; // no "+ C"
}

// Integration bounds may be numbers or the strings 'pi' and 'e'.
export function bound(b) {
  if (b === 'pi') return Math.PI;
  if (b === 'e') return Math.E;
  return Number(b);
}

// Fundamental theorem of calculus: F(b) - F(a), as a float.
export function polyDefinite(p, a, b) {
  const f = polyInteg(p);
  return polyEvaluate(f, bound(b)) - polyEvaluate(f, bound(a));
}

// Is p'(x) ≈ 0 ?  Pass x as a Fraction for an exact answer.
export function isCriticalPoint(p, x, tol = 1e-9) {
  return Math.abs(Number(polyEvaluate(polyDeriv(p), x))) < tol;
}

// Display. Literal-minded on purpose, like the original: 3x^2 + -1x + 5.
// (Making it print "- x" is a good first exercise.)
export function polyToString(p, v = 'x') {
  if (p.length === 0) return '0';
  return p
    .map(({ exp, coef }) => `${coef.toFraction()}${exp > 0 ? v : ''}${exp > 1 ? `^${exp}` : ''}`)
    .join(' + ');
}

export function integralToString(p, a = null, b = null, v = 'x') {
  const show = (x) => (x === 'pi' ? 'π' : x);
  const limits = a !== null ? `[${show(a)},${show(b)}]` : '';
  return `∫${limits}(${polyToString(p, v)}) d${v}`;
}

function demo() {
  const p = poly(3, -1, 5); // 3x^2 - x + 5
  const q = poly(1, 2);     // x + 2
  const line = console.log;
  line(`p          : ${polyToString(p)}`);
  line(`p + q      : ${polyToString(polyAdd(p, q))}`);
  line(`p - q      : ${polyToString(polySub(p, q))}`);
  line(`2p         : ${polyToString(polyScale(p, 2))}`);
  line(`degree, p(2): ${polyDegree(p)}, ${polyEvaluate(p, 2)}`);
  line(`p', p'', p''': ${polyToString(polyDeriv(p))} | ${polyToString(polyDeriv(p, 2))} | ${polyToString(polyDeriv(p, 3))}`);
  line(`∫p, ∫∫p    : ${polyToString(polyInteg(p))} | ${polyToString(polyInteg(p, 2))}`);
  line(`${integralToString(p, 0, 1)} = ${polyDefinite(p, 0, 1)}`);
  line(`${integralToString(p, 0, 'pi')} = ${polyDefinite(p, 0, 'pi').toFixed(4)}`);
  line(`x=1/6 critical? ${isCriticalPoint(p, F('1/6'))}  x=0? ${isCriticalPoint(p, 0)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
