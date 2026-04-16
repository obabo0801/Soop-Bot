@echo off

if not exist node_modules (
    npm install discord.js dotenv cheerio
)

node index.js
pause