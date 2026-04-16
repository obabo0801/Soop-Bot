// =====================
// Utils
// =====================

import path from 'path';

import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    appendFileSync
} from 'fs';

const pad = v => String(v)
.padStart(2, '0');
const root = process.cwd();

export function getDate() {
    const n = new Date();
    return (
        `${n.getFullYear()}-` +
        `${pad(n.getMonth() + 1)}-` +
        `${pad(n.getDate())}`
    );
}

export function getTime() {
    const n = new Date();
    return (
        `${pad(n.getMonth() + 1)}/` +
        `${pad(n.getDate())} ` +
        `${pad(n.getHours())}:` +
        `${pad(n.getMinutes())}`
    );
}

export function readFile(file) {
    try {
        const f = path.join(root, file);

        if (!existsSync(f))
        {
            return null;
        }

        return readFileSync(f, 'utf-8');
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

export function writeFile(file, ...args) {
    try {
        const f = path.join(root, file);

        if (!existsSync(path.dirname(f)))
        {
            mkdirSync(path.dirname(f));
        }

        writeFileSync(f, `${args.join(' ')}\n`);
    } catch (e) {
        console.error(e.message);
    }
}

export function appendFile(file, ...args) {
    try {
        const f = path.join(root, file);

        if (!existsSync(path.dirname(f)))
        {
            mkdirSync(path.dirname(f));
        }

        appendFileSync(f, `${args.join(' ')}\n`);
    } catch (e) {
        console.error(e.message);
    }
}

function isBase64(str) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str);
}

export function encode(str) {
    if (!str) return null;
    try {
        return Buffer.from(str, 'utf8')
        .toString('base64');
    } catch {
        return str;
    }
}

export function decode(str) {
    if (!str) return null;
    if (!isBase64(str)) {
        return str;
    }
    try {
        return Buffer.from(str, 'base64')
        .toString('utf8');
    } catch {
        return str;
    }
}