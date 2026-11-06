# Little Bits of JS

Node.js ports of the 17 programs in Mark Watson's *Little Bits of Common Lisp*.
One file per program. Node 20+, ES modules.

    npm install        # only cheerio and fraction.js
    node bayes.js      # every file runs its demo when executed directly
    node load.js       # REPL with everything loaded; try help()

Each file also exports its functions, and demos only run when the file is the
entry point, so `import { bm25Search } from './bm25.js'` has no side effects.

| Lisp file               | JS file               | Needs                                        |
|-------------------------|-----------------------|----------------------------------------------|
| apple-system-model.lisp | apple-system-model.js | macOS + `fm`                                 |
| gemini.lisp             | gemini.js             | `GOOGLE_API_KEY`                             |
| ollama.lisp             | ollama.js             | local Ollama                                 |
| search.lisp             | search.js             | `EXA_SEARCH_API_KEY`, `BRAVE_SEARCH_API_KEY` |
| sparql.lisp             | sparql.js             | network                                      |
| lightpanda.lisp         | lightpanda.js         | `lightpanda` binary                          |
| webscraping.lisp        | webscraping.js        | cheerio                                      |
| osascript.lisp          | osascript.js          | macOS permissions (see file header)          |
| bayes.lisp              | bayes.js              |                                              |
| bm25.lisp               | bm25.js               |                                              |
| hopfield.lisp           | hopfield.js           |                                              |
| triple-store.lisp       | triple-store.js       |                                              |
| vector-store.lisp       | vector-store.js       |                                              |
| summarizer.lisp         | summarizer.js         |                                              |
| symbolic-math.lisp      | symbolic-math.js      | fraction.js                                  |
| autograd.lisp           | autograd.js           |                                              |
| load.lisp               | load.js               |                                              |

## Where the port differs from the Lisp

- **curl + jzon -> built-in `fetch` + `JSON`.** No shell-outs for HTTP, and
  `JSON.stringify` does the escaping, so no hand-built JSON strings.
- **plump + clss + cl-ppcre -> cheerio** (plus plain regexes).
- **Rationals -> fraction.js.** JS has no built-in exact fractions; the
  polynomial coefficients are `Fraction`s so `-1/2x^2` stays exact.
  `polyEvaluate` is exact for a `Fraction` argument and floating point for a
  plain number.
- **alists -> objects/arrays of objects.** Search hits are `{ title, url, text }`,
  SPARQL rows are `{ variable: value }`, distributions are `{ hypothesis: p }`.
- **Symbols and keywords -> strings.** `:is-a` is `'is-a'`; query variables are
  strings starting with `?`; evidence `'+` is `'+'`.
- **Triple store order.** Lisp's `push` put new triples first, so query results
  came out newest-first; `push` here gives insertion order.
- **`readRecentIMessages` returns a parsed array** rather than a JSON string.
- **Errors.** Gemini, Ollama and the HTTP helpers throw with the server's
  message instead of failing on a missing field.
- **`load.js`.** Lisp had to `read` each file and `eval` only the definitions
  to avoid running demos. Here the entry-point check makes plain imports safe.
- Model names (`gemini-3.5-flash-lite`, `qwen3.5:4b`) are copied from the book.
