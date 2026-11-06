// node autograd.js   (scalar automatic differentiation; micrograd-style)
//
// Each Value remembers its data, its parents, and a closure (`backwardFn`)
// that pushes its gradient back to those parents using the local chain rule.
import { fileURLToPath } from 'node:url';

export class Value {
    constructor(data, prev = [], op = '') {
        this.data = data;
        this.grad = 0;
        this.prev = prev;       // the Values this one was computed from
        this.op = op;           // for inspection only
        this.backwardFn = null; // installed by the operation that created us
    }
}

// Smart constructor: wraps numbers, passes existing Values through.
export const val = (d) => (d instanceof Value ? d : new Value(Number(d)));

// Gradients are *accumulated* (+=): a Value used twice gets both contributions.
export function vAdd(a, b) {
    a = val(a);
    b = val(b);
    const out = new Value(a.data + b.data, [a, b], '+');
    out.backwardFn = () => {
        a.grad += out.grad;
        b.grad += out.grad;
    };
    return out;
}

export function vMul(a, b) {
    a = val(a);
    b = val(b);
    const out = new Value(a.data * b.data, [a, b], '*');
    out.backwardFn = () => {
        a.grad += b.data * out.grad;
        b.grad += a.data * out.grad;
    };
    return out;
}

export function vRelu(a) {
    a = val(a);
    const out = new Value(Math.max(0, a.data), [a], 'relu');
    out.backwardFn = () => {
        a.grad += out.data > 0 ? out.grad : 0; // gradient flows only where output > 0
    };
    return out;
}

// Reverse-mode differentiation: order the graph so every Value comes after
// its parents, seed the root's gradient with 1, then run each closure from
// the root backwards so a node's gradient is final before it is used.
export function backward(root) {
    const topo = [];
    const visited = new Set();
    const build = (v) => {
        if (visited.has(v)) return;
        visited.add(v);
        v.prev.forEach(build);
        topo.push(v); // parents first
    };
    build(root);

    root.grad = 1;
    for (const v of topo.reverse()) {
        if (v.backwardFn) v.backwardFn();
    }
}

// Demo: d = (a * b) + c,  e = relu(d)
function demo() {
    const a = val(2);
    const b = val(-3);
    const c = val(10);
    const d = vAdd(vMul(a, b), c);
    const e = vRelu(d);
    backward(e);

    const f1 = (x) => x.toFixed(1);
    const f2 = (x) => x.toFixed(2);
    console.log(`Forward:  d = (a * b) + c = (${f1(a.data)} * ${f1(b.data)}) + ${f1(c.data)} = ${f1(d.data)}`);
    console.log(`          e = relu(d) = ${f1(e.data)}`);
    console.log('Gradients after backward(e):');
    console.log(`  de/de = ${f2(e.grad)}`);
    console.log(`  de/dd = ${f2(d.grad)}`);
    console.log(`  de/dc = ${f2(c.grad)}  (expected 1.0)`);
    console.log(`  de/da = ${f2(a.grad)}  (expected b = -3.0)`);
    console.log(`  de/db = ${f2(b.grad)}  (expected a = 2.0)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) demo();
