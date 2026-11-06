// macOS automation through osascript. Load it from a REPL (node load.js) or
// import the functions; run directly it only does the harmless 1 + 10 check.
//
// Needs Automation permission for your terminal (System Settings > Privacy &
// Security). readRecentIMessages also needs Full Disk Access; safariLogin
// needs Safari > Develop > Allow JavaScript from Apple Events.
// Keep credentials out of this file: use environment variables.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

export async function osascript(script) {
    try {
        const { stdout } = await run('osascript', ['-e', script]);
        return stdout.trim();
    } 
    catch (error) {
        throw new Error(`osascript: ${error.stderr || error.message}`);
    }
}

// Quote a string as an AppleScript literal (escape backslashes and quotes).
// This is what Lisp's ~S directive did for us.
export const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export async function mailUnreadCount() {
    const out = await osascript('tell application "Mail" to return unread count of inbox');
    return Number.parseInt(out, 10);
}

export async function getTodaysEvents() {
    const out = await osascript(`tell application "Calendar"
    set t0 to current date
    set time of t0 to 0
    set out to {}
    repeat with c in calendars
        set out to out & (summary of every event of c ¬
        whose start date >= t0 and start date < t0 + days)
    end repeat
    set AppleScript's text item delimiters to "|"
    return out as string
    end tell`);
    return out.split('|').filter((title) => title !== '');
}

export function sendIMessage(phone, message) {
    return osascript(
        `tell application "Messages" to send ${q(message)} to buddy ${q(phone)} ` +
        'of (1st service whose service type = iMessage)',
    );
}

export function addReminder(name) {
    return osascript(
        'tell application "Reminders" to return id of ' +
        `(make new reminder with properties {name:${q(name)}})`,
    );
}

// Reads Messages' SQLite database directly (hence Full Disk Access).
// Returns an array of { is_from_me, sender, text }.
export async function readRecentIMessages(limit = 5) {
    if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError('limit must be a positive integer'); // it is spliced into SQL
    }
    const db = join(homedir(), 'Library/Messages/chat.db');
    const sql =
        'SELECT m.is_from_me, h.id AS sender, m.text ' +
        'FROM message m LEFT JOIN handle h ON m.handle_id = h.ROWID ' +
        `WHERE m.text IS NOT NULL ORDER BY m.date DESC LIMIT ${limit};`;
    const { stdout } = await run('sqlite3', ['-json', db, sql]);
    return stdout.trim() ? JSON.parse(stdout) : []; // sqlite3 prints nothing for 0 rows
}

export function safariLogin(
    url,
    user,
    password,
    { userId = 'username', passwordId = 'password', formId = 'login-form', timeout = 30 } = {},
) {
    // JSON.stringify gives valid JavaScript string literals for the page script...
    const js =
        `document.getElementById(${JSON.stringify(userId)}).value = ${JSON.stringify(user)}; ` +
        `document.getElementById(${JSON.stringify(passwordId)}).value = ${JSON.stringify(password)}; ` +
        `document.getElementById(${JSON.stringify(formId)}).submit();`;

    // ...and q() then quotes that script as an AppleScript string.
    return osascript(`tell application "Safari"
    set d to make new document with properties {URL:${q(url)}}
    repeat ${2 * timeout} times
        delay 0.5
        if (do JavaScript "document.readyState" in d) is "complete" then
        return (do JavaScript ${q(js)} in d)
        end if
    end repeat
    end tell
    error "Safari page did not load within ${timeout} seconds"`);
}

// Examples
// await osascript('return 1 + 10')
// await mailUnreadCount()
// await getTodaysEvents()
// await addReminder('Buy milk')
// await sendIMessage('+15551234567', 'Hello from Node')
// await readRecentIMessages(3)
// await safariLogin('https://leanpub.com/author/royalties/summary',
//                   process.env.LEANPUB_USER, process.env.LEANPUB_PASSWORD)

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log(await osascript('return 1 + 10'));
}
