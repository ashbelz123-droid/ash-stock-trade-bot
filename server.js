import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
process.env.NTBA_FIX_350 = "1";

/* =============================
ASH BRAND ELITE BOT
============================= */

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@pipstockbot";

/* =============================
ROOT PAGE
============================= */

app.get("/", (req,res)=>{
    res.send("🔥 Ash Brand Elite Bot Running");
});

/* =============================
START COMMAND
============================= */

bot.onText(/\/start/, async(msg)=>{

    try{

        const text = `
🔥 Ash Brand Elite Community

👤 Owner: Ashbelz

Signal System Active.

Channel:
👉 https://t.me/pipstockbot

Trade responsibly ❤️
`;

        await bot.sendMessage(msg.chat.id,text);

    }catch{}
});

/* =============================
WEBHOOK SETUP
============================= */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req,res)=>{
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if(process.env.RENDER_EXTERNAL_URL){

    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    ).catch(()=>{});

}

/* =============================
ANTI SLEEP PING
============================= */

setInterval(async()=>{
    try{
        if(!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
    }catch{}
},5*60*1000);

/* =============================
SERVER START
============================= */

app.listen(PORT,"0.0.0.0",()=>{
    console.log("🔥 Ash Brand Elite Bot Running");
});
