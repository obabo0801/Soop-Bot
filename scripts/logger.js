// =====================
// Logger
// =====================

import * as utils from '#utils';
import path from 'path';

export function readLog(file) {
    return utils.readFile(
        path.join('logs', file));
}

export function writeLog(file, ...args) {
    return utils.writeFile(
        path.join('logs', file), ...args);
}

export function appendLog(file, ...args) {
    return utils.appendFile(
        path.join('logs', file), ...args);
}

export function sendLog(type, ...args) {
    const s = `[${utils.getTime()}] ` +
    `[${type}] ${args.join(' ')}`
    if (type === 'ERROR')
    {
        console.error(s);
    } else if (type == 'WARN') {
        console.warn(s);
    } else {
        console.info(s);
    }
    appendLog(`${utils.getDate()}.log`, s);
}

export function cmdLog(i, ...args) {
    console.log('');
    const name = i.nickname ?? 
            i.user.globalName ?? 
            i.user.username;
    sendLog('CMD', name, 
        i.commandName, ...args);
}

export function slashLog(i, ...args) {
    console.log('');
    const name = i.nickname ?? 
            i.user.globalName ?? 
            i.user.username;
    sendLog('SLASH', name, i.commandName, ...args);
}

export function chatLog(m, ...args) {
    console.log('');
    sendLog('CHAT', m.member.displayName, m.content, ...args);
}

export function infoLog(...args) {
    sendLog('INFO', ...args);
}

export function errorLog(...args) {
    sendLog('ERROR', ...args);
}

export function warnLog(...args) {
    sendLog('WARN', ...args);
}