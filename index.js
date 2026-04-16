// =====================
// ENV
// =====================
import { config } from 'dotenv';
config({quiet: true});

import { readFile } from '#utils';

// =====================
// Discord
// =====================
import {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    MessageFlags
 } from 'discord.js';

// =====================
// External
// =====================
import axios from 'axios';
import * as cheerio from 'cheerio';

// =====================
// Internal
// =====================
import {
    parseLive,
    refresh,
    startBot
} from '#commands';

import {
    sendLog,
    infoLog,
    errorLog
} from '#logger';

let user, choices;

// =====================
// Constants
// =====================
export const MSG = {
    ENV_SUCCESS: '📄 .env 성공',
    ENV_FAIL: '.env 실패',
    ENV_INVALID: '.env 파일을 찾을 수 없습니다',

    CONFIG_SUCCESS: '📄 Config 성공',
    CONFIG_FAIL: 'Config 실패',
    CONFIG_INVALID: 'config.json 파일을 찾을 수 없습니다',
    CONFIG_ERROR: 'Config 에러가 발생했습니다',

    COMMAND_SUCCESS: '🌍 Global Commands 등록',
    COMMAND_FAIL: 'Global Commands 실패',

    GCOMMAND_SUCCESS: '🏠 Guild Commands 등록',
    GCOMMAND_FAIL: 'Guild Commands 실패',
    
    LOGIN_SUCCESS: '🟢 Discord 연결 완료',
    LOGIN_FAIL: '🔴 Discord 연결 실패',
    TOKEN_INVALID: '유효하지 않은 토큰입니다',
    DISALLOWED_INTENTS: '권한이 없습니다 ',

    SOOP_CMD: 'SOOP 라이브 방송을 확인합니다',
    SOOP_ID: 'SOOP 스트리머 ID를 선택하세요',

    REFRESH: '새로고침',
    REFRESH_SUCCESS: '📄 새로고침 완료',
    REFRESH_FAIL: '새로고침 실패',
    REFRESH_CMD: '설정을 새로고침합니다',
    REFRESH_DESC: '설정을 다시 불러옵니다',

    FIND: '방송을 확인합니다',
    NOT: '를 찾을 수가 없습니다',
    FAIL: '실패했습니다',
    OFFLINE: '스트리머가 오프라인입니다.',

    LIVE0: '방송이 시작되었습니다',
    LIVE1: '방송 진행 중입니다',
    LIVE2: '방송 제목이 변경되었습니다',
    LIVE3: '방송이 종료되었습니다',
    LIVE4: '방송이 오프라인입니다',

    QUIT: '프로그램을 종료합니다',
};

// =====================
// Client
// =====================
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

// =====================
// Streamers
// =====================
const streamers = {};

export function loadConfig() {
    try {
        const data = readFile('./config.json');
        if (!data) {
            errorLog(MSG.CONFIG_INVALID);
            return;
        }
        user = JSON.parse(data);
        choices = Object.entries(user)
        .map(([value, name]) => ({name, value}));
        infoLog(MSG.CONFIG_SUCCESS);
    } catch (e) {
        errorLog(MSG.CONFIG_FAIL);
        user = null;
    }
}

export function initStreamer() {
    try {
        for (const [key] of Object.entries(user)) {
            if (!streamers[key])
            {
                streamers[key] = { id: -1, title: '' }
            }
        }

        for (const key of Object.keys(streamers)) {
            if (!user[key]) {
                delete streamers[key];
            }
        }
    } catch (e) {
        errorLog(MSG.CONFIG_ERROR);
    }
}

// =====================
// Commands
// =====================
export let gcommands = [];

export function initGcommands() {
    gcommands = [
        new SlashCommandBuilder()
        .setName('soop')
        .setDescription(MSG.SOOP_CMD)
        .addStringOption(o =>
            o.setName('id')
            .setDescription(MSG.SOOP_ID)
            .setRequired(true)
            .addChoices(...choices)
        )
        .toJSON(),
        
        new SlashCommandBuilder()
        .setName('refresh')
        .setDescription(MSG.REFRESH_CMD)
        .toJSON()
    ];
}

export let commands = [];

export function initCommands() {
    commands = [];
}

// =====================
// URL
// =====================
function url(id) {
    return `https://play.sooplive.com/${id}`
}

// =====================
// Method
// =====================
function embed(i, s) {
    return { embeds: [
        {
            title: states(i, s.id),
            description: des(s),
            color: colors(i),
            thumbnail: {
                url: s.thumb
            },
            footer: {
                text: ''
            },
            timestamp: new Date()
        }
    ]};
}

function des(s) {
    return `${s.title}\n${url(s.id)}`
}

function re() {
    return process.env.RESTART
    .toLowerCase() == 'true';
}

async function load() {
    for (const [key] of Object.entries(user)) {
        const t = await live(key);
        const channel = client.channels
        .cache.get(process.env.CHANNEL_ID);
        if (t && channel) { channel.send(t) }
    }
}

async function fetch(id) {
    const { data } = await axios.get(url(id));
    return cheerio.load(data);
}

async function check(id) {
    const $ = await fetch(id);
    let result = null;
    $('script').each((_, e) => {
        const str = $(e).html();
        if (!str) return;
        result = parseLive(str);
        if (result) return false;
    });
    return result;
}

function states(i, id) {
    if (i === 0) {
        return `🟢 ${user[id]} ${MSG.LIVE0}`;
    } else if (i === 1) {
        return `🟢 ${user[id]} ${MSG.LIVE1}`;
    } else if (i === 2) {
        return `🟡 ${user[id]} ${MSG.LIVE2}`;
    } else if (i === 3) {
        return `🔴 ${user[id]} ${MSG.LIVE3}`;
    } else {
        return `⚫ ${user[id]} ${MSG.LIVE4}`;
    }
}

function colors(i) {
    if (i === 0) {
        return 0x64EB9B; // 🟢
    } else if (i === 1) {
        return 0x64EB9B; // 🟢
    } else if (i === 2) {
        return 0xF5C850; // 🟡
    } else if (i === 3) {
        return 0xF55068; // 🔴
    } else {
        return 0x5C5663; // ⚫
    }
}

async function find(id) {
    const s = await check(id);

    if (!streamers[id]) {
        errorLog(`${id} ${MSG.NOT}`);
        return;
    }

    if (!s || !s.number) {
        // OFLINE
        sendLog('OFFLINE', user[s.id]);
        return embed(4, s);
    }

    // ONLINE
    sendLog('ONLINE', user[s.id]);
    return embed(1, s);
}

async function live(id) {
    const s = await check(id);

    if (!streamers[id]) {
        errorLog(`${id} ${MSG.NOT}`);
        return;
    }

    const title = streamers[id].title;
    const state = streamers[id].id;

    if (!s || !s.number) {
        // ENDED
        if (state === 0 || state === 1) {
            if (state === 3) {
                return;
            }
            sendLog('ENDED', user[s.id]);
            streamers[id].id = 3;
            streamers[id].title = s.title;
            
            return embed(3, s);
        
        // OFFLINE
        } else if (state !== 3) {
            if (state === 4) {
                return;
            }
            sendLog('OFFLINE', user[s.id]);
            streamers[id].id = 4;
            
            return embed(4, s);
        }
    }

    // START
    if (state === 4) {
        if (state === 0) {
            return;
        }
        sendLog('START', user[s.id]);
        streamers[id].id = 0;
        streamers[id].title = s.title;

        return embed(0, s);
    }

    // CHANGE
    if (title && title !== s.title) {
        if (state === 2) {
            return;
        }
        sendLog('CHANGE', user[s.id]);
        streamers[id].id = 2;
        streamers[id].title = s.title;

        return embed(2, s);
    }

    // ONLINE
    if (state >= 0 && state <= 2) {
        return;
    } else if (title === MSG.OFFLINE) {
        return;
    }
    sendLog('ONLINE', user[s.id]);
    streamers[id].id = 1;
    streamers[id].title = s.title;
    
    return embed(1, s);
}

// =====================
// Execute
// =====================
async function commandExecute(i) {
}

// =====================
// Slash
// =====================
async function commandSlash(i) {
    if (i.commandName === 'soop') {
        const id = i.options.getString(`id`);
        sendLog('SLASH', user[id]);
        let t = await find(id, false);
        if (!t) t = MSG.FAIL;
        return await i.reply(t);
    } else if (i.commandName === 'refresh') {
        sendLog('SLASH', MSG.REFRESH);
        const r = await refresh();
        let t = MSG.REFRESH_SUCCESS;
        if (!r) t = MSG.REFRESH_FAIL;
        return await i.reply(t);
    }
}

// =====================
// Chatting
// =====================
async function commandChatting(m) {
}

// =====================
// Ready
// =====================
client.once('clientReady', async () => {
    client.user.setPresence({
        status: process.env.STATE
    });

    if (client.isReady())
    {
        infoLog(MSG.LOGIN_SUCCESS);
        infoLog('👤', client.user.tag);
        setInterval(async () => {
            if (re())
            {
                await load();
            }
        }, parseInt(process.env.DELAY, 10));
    } else {
        errorLog(MSG.LOGIN_FAIL);
    }
});

// =====================
// Interaction
// =====================
client.on('interactionCreate', async (i) => {
    try {
        if (i.isChatInputCommand())
        {
            await commandSlash(i);
        } else {
            await commandExecute(i);
        }
    } catch (e) {
        errorLog('I', e);
    }
});

// =====================
// Message
// =====================
client.on('messageCreate', async (m) => {
    try {
        if (!m.author.bot)
        {
            await commandChatting(m);
        }
    } catch (e) {
        errorLog('M', e);
    }
});

// =====================
// BOT START
// =====================
startBot(client);