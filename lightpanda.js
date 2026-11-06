// node lightpanda.js   (needs the `lightpanda` binary on your PATH)
//
// Some pages barely exist until JavaScript runs. Lightpanda is a lightweight
// headless browser; here we drive it as a subprocess.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

// dump is one of: html, markdown, semantic_tree, semantic_tree_text
export async function lightpanda(url, dump = 'html') {
    const { stdout } = await run(
        'lightpanda',
        ['fetch', '--dump', dump, '--log_level', 'warn', url],

        // rendered pages easily exceed the 1 MB default
        { maxBuffer: 64 * 1024 * 1024 }, 
    );
    return stdout;
}

// A deliberately simple scan, not an HTML parser: fine for renderer output.
// For arbitrary HTML in the wild, use the cheerio-based scraper instead.
export function links(html) {
    return [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log(await lightpanda('https://markwatson.com/', 'markdown'));
    console.log(links(await lightpanda('https://markwatson.com/')));
}
