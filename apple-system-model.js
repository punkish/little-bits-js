// node apple-system-model.js   (macOS with Apple Intelligence + the `fm` tool)
//
// Runs Apple's on-device foundation model through the `fm` command-line tool.
// No API key, no network. Accept the license once with: sudo fm license
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

export async function appleFm(prompt) {
  const { stdout } = await run('fm', ['respond', '--no-stream', prompt]);
  return stdout.trim();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {

    if (!process.argv[2]){
        console.log("C'mon, ask me something… for example:");
        console.log("   $ node apple-system-model.js 'Summarize the latest US mid-term election results?'");
    }
    else {
        console.log(await appleFm(process.argv[2]));
    }
  
}
