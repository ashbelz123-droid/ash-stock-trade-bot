import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
process.env.NTBA_FIX_350 = "1";

/* ============================
SERVER SETUP
============================ */

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ============================
BOT INITIALIZATION
============================ */

if(!process.env.TELEGRAM_BOT_TOKEN){
    console.error("Missing TELEGRAM_BOT_TOKEN");
    process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

/* ============================
ROOT ROUTE
============================ */

app.get("/", (req,res)=>{
    res.send("🔥 Ash Elite Signal Bot Running");
});

/* ============================
START COMMAND
============================ */

bot.onText(/\/start/, async(msg)=>{

    try{

        const text = `
🔥 Ash Elite Signal Bot

Owner: Ashbelz

📢 Join channel:
👉 https://t.me/pipstockbot

Trade responsibly ❤️
`;

        await bot.sendMessage(msg.chat.id,text);

    }catch(err){
        console.log(err.message);
    }

});

/* ============================
WEBHOOK ENDPOINT
============================ */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`,
(req,res)=>{
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

/* ============================
WEBHOOK SETUP
============================ */

if(process.env.RENDER_EXTERNAL_URL){

    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );

}

/* ============================
ANTI SLEEP PING
============================ */

setInterval(async()=>{

    try{

        if(!process.env.RENDER_EXTERNAL_URL) return;

        await axios.get(process.env.RENDER_EXTERNAL_URL);

    }catch{}

},5*60*1000);

/* ============================
SERVER START
============================ */

app.listen(PORT,()=>{
    console.log("🔥 Ash Elite Signal Bot Running");
});
