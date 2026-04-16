// =====================
// Commands
// =====================

import { commands, gcommands } from '#index';
import { loadConfig, initStreamer, initCommands, initGcommands } from '#index';
import { parse } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { MSG } from '#index';
import { readFile, decode } from '#utils';
import { infoLog, errorLog } from '#logger';

export function parseLive(str) {
    const match = str.match(
/window\.szBjNick\s*=\s*['"]([^'"]+)['"]/);
    const match0 = str.match(
/window\.szBjId\s*=\s*['"]([^'"]+)/);
    const match1 = str.match(
/window\.szBroadTitle\s*=\s*"([^"]+)"/);
    const match2 = str.match(
/window\.szBroadThumPath\s*=\s*'([^']+)'/);
    const match3 = str.match(
/window\.nBroadNo\s*=\s*(\d+)/);

    const result = {
        nick: match?.[1] ?? '',
        id: match0?.[1] ?? '',
        title: match1?.[1] ?? '',
        thumb: match2?.[1] ?? '',
        number: match3?.[1] ?? null
    };
    
    return result;
}

export function parseEnv(str) {
    try {
        const data = readFile(str);
        if (!str || !data) {
            errorLog(MSG.ENV_INVALID);
            process.exit(1);
        }
        process.env = {...process.env, 
            ...parse(decode(data))
        };
        infoLog(MSG.ENV_SUCCESS);
    } catch (e) {
        infoLog(MSG.ENV_FAIL)
    }
}

export async function createGuildCommands(body) {
    try {
        const rest = new REST({ version: '10' })
        .setToken(decode(process.env.TOKEN));
        await rest.put(
            Routes.applicationGuildCommands(
                decode(process.env.CLIENT_ID), 
                decode(process.env.SERVER_ID)), 
            { body: body }
        );
        infoLog(MSG.GCOMMAND_SUCCESS);
    } catch (e) { 
        infoLog(MSG.GCOMMAND_FAIL)
    }
}

export async function createCommands(body) {
    try {
        const rest = new REST({ version: '10' })
        .setToken(decode(process.env.TOKEN));
        await rest.put(
            Routes.applicationCommands(
                decode(process.env.CLIENT_ID)), 
            { body: body }
        );
        infoLog(MSG.COMMAND_SUCCESS);
    } catch (e) { 
        infoLog(MSG.COMMAND_FAIL)
    }
}

export async function refresh() {
    try {
        loadConfig(); initGcommands();
        initCommands(); initStreamer();
        await createCommands(commands);
        await createGuildCommands(gcommands);
        return true;
    } catch (e) {
        if (e.code === 'TokenInvalid') {
            errorLog(MSG.TOKEN_INVALID);
        } else if (e.message.includes(
            'Used disallowed intents')) {
            errorLog(MSG.DISALLOWED_INTENTS);
        } else {
            errorLog(e.message);
        }
        return false;
    }
}

export async function startBot(client) {
    try {
        console.log('────────────────────')
        console.log('　　Soop Bot 🌳　　');
        console.log('────────────────────')
        parseEnv('.env');
        await refresh();
        await client.login(
            decode(process.env.TOKEN)
        );
    } catch (e) {
        if (e.code === 'TokenInvalid') {
            errorLog(MSG.TOKEN_INVALID);
        } else if (e.message.includes(
            'Used disallowed intents')) {
            errorLog(MSG.DISALLOWED_INTENTS);
        } else {
            errorLog(e.message);
        }
    }
}

process.on('SIGTERM', () => {
    infoLog(MSG.QUIT);
    process.exit(0);
});

process.on('uncaughtException', (e) => {
    errorLog(e);
});

process.on('unhandledRejection', (e) => {
    errorLog(e);
});