// node webscraping.js
//
// When a page is plain HTML you don't need a browser: fetch it, parse it
// into a real DOM with cheerio, and walk the tree. (cheerio replaces the
// Lisp plump + clss + cl-ppcre trio.)
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';

const SKIP = new Set([
  'script', 'style', 'head', 'nav', 'header', 'footer', 'noscript', 'iframe',
]);
const BLOCK = new Set([
  'p', 'div', 'li', 'br', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'section', 'article', 'ul', 'ol', 'pre', 'blockquote',
]);

export function parseHtml(html) {
  return cheerio.load(html);
}

export async function fetchDom(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return parseHtml(await response.text());
}

// Text of a DOM node, skipping boilerplate; block tags become newlines.
export function nodeText(node) {
  if (node.type === 'text') {
    return node.data.replace(/\s+/g, ' ');
  }
  // cheerio reports <script>/<style> as their own node types, not 'tag'.
  const isElement = ['tag', 'script', 'style'].includes(node.type);
  const tag = isElement ? node.name.toLowerCase() : null;
  if (SKIP.has(tag)) return '';

  if (!node.children) return ''; // comments, directives, ...
  const inner = node.children.map(nodeText).join('');
  return BLOCK.has(tag) ? `\n${inner}\n` : inner;
}

// Strip spaces at line ends, collapse 3+ newlines into one blank line, trim.
export function cleanText(s) {
  return s
    .replace(/^ +| +$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function headers(url) {
  const $ = await fetchDom(url);
  return $('h1, h2, h3, h4, h5, h6')
    .toArray()
    .map((h) => cleanText(nodeText(h)));
}

export async function pageText(url) {
  const $ = await fetchDom(url);
  return cleanText(nodeText($.root()[0]));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await headers('https://markwatson.com'));
  console.log(`\n\n${await pageText('https://markwatson.com')}`);
}
