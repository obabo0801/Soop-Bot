// =====================
// ENV
// =====================
import { config } from 'dotenv';
config({quiet: true});

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
    readFile
} from '#utils';

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

let categorys, users, choices;

// =====================
// Constants
// =====================
export const MSG = {
    ENV_SUCCESS: '📄 .env 불러오기 성공',
    ENV_FAIL: '.env 불러오기 실패',
    ENV_INVALID: '.env 파일을 찾을 수 없습니다',

    CATEGORY_SUCCESS: '📖 Category 불러오기 성공',
    CATEGORY_FAIL: 'Category 불러오기 실패',
    CATEGORY_INVALID: 'category.json 파일을 찾을 수 없습니다',
    CATEGORY_ERROR: 'Category 에러가 발생했습니다',

    CONFIG_SUCCESS: '📄 Config 불러오기 성공',
    CONFIG_FAIL: 'Config 불러오기 실패',
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

    LIST: '목록',
    LIST_SUCCESS: '👥 목록 조회 완료',
    LIST_FAIL: '목록 조회 실패',
    LIST_CMD: '스트리머 상태 목록을 확인합니다',
    LIST_TYPE: '조회할 상태를 선택하세요',
    LIST_ONLINE: '온라인',
    LIST_ONLINE_DESC: '현재 방송 중인 스트리머만 표시합니다',
    LIST_OFFLINE: '오프라인',
    LIST_OFFLINE_DESC: '현재 방송이 종료된 스트리머만 표시합니다',
    LIST_ALL: '전체',
    LIST_ALL_DESC: '모든 스트리머 상태를 표시합니다',

    FIND: '방송을 확인합니다',
    NOT: '를 찾을 수가 없습니다',
    FAIL: '실패했습니다',
    OFFLINE: '스트리머가 오프라인입니다.',

    LIVE0: '방송이 시작되었습니다',
    LIVE1: '방송 진행 중입니다',
    LIVE2: '방송 제목이 변경되었습니다',
    LIVE3: '방송 카테고리가 변경되었습니다',
    LIVE4: '방송이 종료되었습니다',
    LIVE5: '방송이 오프라인입니다',

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

export function loadCategory() {
    try {
        const data = readFile('./category.json');
        if (!data) {
            errorLog(MSG.CATEGORY_INVALID);
            return;
        }
        categorys = JSON.parse(data);
        infoLog(MSG.CATEGORY_SUCCESS);
    } catch (e) {
        errorLog(MSG.CATEGORY_FAIL);
        categorys = null;
    }
}

export function loadConfig() {
    try {
        const data = readFile('./config.json');
        if (!data) {
            errorLog(MSG.CONFIG_INVALID);
            return;
        }
        users = JSON.parse(data);
        choices = Object.entries(users)
        .map(([value, name]) => ({name, value}));
        initStreamer();
        infoLog(MSG.CONFIG_SUCCESS);
    } catch (e) {
        errorLog(MSG.CONFIG_FAIL);
        users = null;
    }
}

export function initStreamer() {
    try {
        for (const [key] of Object.entries(users)) {
            if (!streamers[key])
            {
                streamers[key] = {
                    id: -1,
                    nowTitle: '',
                    oldTitle: '',
                    nowCate: '',
                    oldCate: '',
                }
            }
        }

        for (const key of Object.keys(streamers)) {
            if (!users[key]) {
                delete streamers[key];
            }
        }
    } catch (e) {
        errorLog(MSG.CONFIG_ERROR);
    }
}

// =====================
// URL
// =====================
function urlBjId(id) {
    return `https://play.sooplive.com/${id}`
}

function urlBroad(s) {
    return (urlBjId(s.szBjId) + `/${s.nBroadNo}`);
}

// =====================
// Method
// =====================

function embed(i, s) {
    return { embeds: [
        {
            title: states(i, s.szBjId),
            description: desc(i, s),
            color: colors(i),
            thumbnail: {
                url: s.szBroadThumPath
            },
            footer: {
                text: categorys[s.nCateNo]
            },
            timestamp: new Date()
        }
    ]};
}

function desc(i, s) {
    if (i === 2) {
        const old = streamers[s.szBjId].oldTitle;
        streamers[s.szBjId].oldTitle = s.szBroadTitle;
        return `${old} →\n` + 
        `${s.szBroadTitle}\n${urlBroad(s)}`;
    } else if (i === 3) {
        const old = streamers[s.szBjId].oldCate;
        streamers[s.szBjId].oldCate = s.nCateNo;
        return `${s.szBroadTitle}\n${categorys[old]} →\n ` +
        `${categorys[s.nCateNo]}\n${urlBroad(s)}`;
    }
    
    return `${s.szBroadTitle}\n${urlBroad(s)}`;
}

function isInitial() {
    return process.env.INITIAL
    .toLowerCase() == 'true';
}

function isLoop() {
    return process.env.LOOP
    .toLowerCase() == 'true';
}

async function load() {
    try {
        for (const [key] of Object.entries(users)) {
            const t = await live(key);
            const channel = client.channels
            .cache.get(process.env.CHANNEL_ID);
            if (t && channel) channel.send(t);
        }
        process.env.INITIAL = 'False';
        return true;
    } catch (e) {
        return false;
    }
}

async function list(type, i) {
    try {
        let count = 0;
        for (const [key] of Object.entries(users)) {
            const t = await find(key, type);
            if (t && i) {
                i.followUp(t);
                count++;
            }
        }
        return count;
    } catch (e) {
        return 0;
    }
}

async function fetch(id) {
    const { data } = await axios.get(urlBjId(id));
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
    switch (i) {
        case 0: return `🟢 ${users[id]} ${MSG.LIVE0}`;
        case 1: return `🟢 ${users[id]} ${MSG.LIVE1}`;
        case 2: return `🟡 ${users[id]} ${MSG.LIVE2}`;
        case 3: return `🔵 ${users[id]} ${MSG.LIVE3}`;
        case 4: return `🔴 ${users[id]} ${MSG.LIVE4}`;
        default: return `⚫ ${users[id]} ${MSG.LIVE5}`;
    }
}

function colors(i) {
    switch (i) {
        case 0: return 0x64EB9B; // 🟢
        case 1: return 0x64EB9B; // 🟢
        case 2: return 0xF5C850; // 🟡
        case 3: return 0x5A9DE4; // 🔵
        case 4: return 0xF55068; // 🔴
        default: return 0x5C5663; // ⚫
    }
}

async function find(id, state = 0) {
    const s = await check(id);

    if (!streamers[id]) {
        errorLog(`${id} ${MSG.NOT}`);
        return;
    }

    if (!s || !s.nBroadNo) {
        // OFLINE
        if (state === 1) return;
        sendLog('OFFLINE', users[s.szBjId]);
        return embed(5, s);
    }

    // ONLINE
    if (state === 2) return;
    sendLog('ONLINE', users[s.szBjId]);
    return embed(1, s);
}

async function live(id) {
    const s = await check(id);

    if (!streamers[id]) {
        errorLog(`${id} ${MSG.NOT}`);
        return;
    }

    const title = streamers[id].nowTitle;
    const state = streamers[id].id;
    const cate = streamers[id].nowCate;

    if (!s || !s.nBroadNo) {
        // ENDED
        if (state >= 0 && state <= 3) {
            if (state === 4) return;
            sendLog('ENDED', users[s.szBjId]);
            streamers[id].id = 4;
            streamers[id].nowTitle = s.szBroadTitle;
            streamers[id].nowCate = s.nCateNo;
            streamers[id].oldTitle = s.szBroadTitle;
            streamers[id].oldCate = s.nCateNo;
            
            return embed(4, s);
        
        // OFFLINE
        } else if (state !== 4) {
            if (state === 5) return;
            sendLog('OFFLINE', users[s.szBjId]);
            streamers[id].id = 5;
            
            if (!isInitial()) {
                return;
            }
            
            return embed(5, s);
        }

        return;
    }

    // START
    if (state >= 4 && state <= 5) {
        sendLog('START', users[s.szBjId]);
        streamers[id].id = 0;
        streamers[id].nowTitle = s.szBroadTitle;
        streamers[id].nowCate = s.nCateNo;
        streamers[id].oldTitle = s.szBroadTitle;
        streamers[id].oldCate = s.nCateNo;

        return embed(0, s);
    }

    // CHANGE TITLE
    if (title && title !== s.szBroadTitle) {
        if (state >= 4 && state <= 5) {
            return;
        }
        sendLog('CHANGE', users[s.szBjId]);
        streamers[id].id = 2;
        streamers[id].nowTitle = s.szBroadTitle;

        return embed(2, s);
    }

    // CHANGE CATEGORY
    if (cate && cate !== s.nCateNo) {
        if (state >= 4 && state <= 5) {
            return;
        }
        sendLog('CHANGE', users[s.szBjId]);
        streamers[id].id = 3;
        streamers[id].nowCate = s.nCateNo;

        return embed(3, s);
    }

    // ONLINE
    if (state >= 0 && state <= 3) {
        return;
    } else if (title === MSG.OFFLINE) {
        return;
    }
    sendLog('ONLINE', users[s.szBjId]);
    streamers[id].id = 1;
    streamers[id].nowTitle = s.szBroadTitle;
    streamers[id].nowCate = s.nCateNo;
    streamers[id].oldTitle = s.szBroadTitle;
    streamers[id].oldCate = s.nCateNo;

    if (!isInitial()) {
        return;
    }
    
    return embed(1, s);
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
        .toJSON(),
        
        new SlashCommandBuilder()
        .setName('list')
        .setDescription(MSG.LIST_CMD)
        .addIntegerOption(o =>
            o.setName('type')
            .setDescription(MSG.LIST_TYPE)
            .setRequired(true)
            .addChoices(
                { name: MSG.LIST_ONLINE, value: 1 },
                { name: MSG.LIST_OFFLINE, value: 2 },
                { name: MSG.LIST_ALL, value: 0 }
            )
        )
        .toJSON()
    ];
}

export let commands = [];

export function initCommands() {
    commands = [];
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
        await i.deferReply();
        const id = i.options.getString(`id`);
        sendLog('SLASH', users[id]);
        let t = await find(id, false);
        if (!t) t = MSG.FAIL;

        return await i.editReply(t);
    } else if (i.commandName === 'refresh') {
        await i.deferReply(
        { flags: MessageFlags.Ephemeral });
        sendLog('SLASH', MSG.REFRESH);
        const r = await refresh();
        let t = MSG.REFRESH_SUCCESS;
        
        if (!r) t = MSG.REFRESH_FAIL;
        r ? infoLog(t) : errorLog(t);

        return await i.deleteReply();
    } else if (i.commandName === 'list') {
        await i.deferReply();
        const type = i.options.getInteger(`type`);
        sendLog('SLASH', MSG.LIST, type);
        const r = await list(type, i);
        const max = Object.keys(users).length;
        let t; const map = {
            1: MSG.LIST_ONLINE + ` ${r}/${max}`,
            2: MSG.LIST_OFFLINE + ` ${r}/${max}`,
            0: MSG.LIST_ALL + ` ${max}`
        };

        if (r) {
            t = MSG.LIST_SUCCESS + ` ${map[type]}`;
        } else {
            t = MSG.LIST_FAIL + ` ${map[type]}`;
        }
        r ? infoLog(t) : errorLog(t);

        return await i.editReply(t);
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
            if (isLoop())
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