@echo off

if not exist node_modules (
    npm install discord.js dotenv cheerio
    call "%~f0"
)

cls
node index.js
pause