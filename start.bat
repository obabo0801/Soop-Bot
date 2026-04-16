@echo off
chcp 65001 > nul
title Soop Bot 🌳
cd /d "%~dp0"

if not exist node_modules (
    npm install discord.js dotenv cheerio
)

node index.js
pause