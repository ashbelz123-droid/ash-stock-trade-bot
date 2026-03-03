import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

/*
==================================================
ASH BRAND FUTURE COMMUNITY SIGNAL BOT
==================================================
Markets:
EURUSD, GBPUSD, USDJPY, BTCUSD

Mode:
Adaptive fair community signals

Hosting:
Render Free Tier Friendly
==================================================
*/

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL = "@pipstockbot";

/* Memory Engine */

let marketMemory = [];
const MEMORY_LIMIT = 20;

function updateMarketMemory(score){
    marketMemory.push(score);
    if(marketMemory.length > MEMORY_LIMIT){
        marketMemory.shift();
    }
}

function memoryTrendBias(){
    if(marketMemory.length < 5) return 0;

    return marketMemory.reduce((a,b)=>a+b,0) /
           marketMemory.length;
}

/* Smart Market Filter */

function smartMarketScore(prices){

    if(!prices || prices.length < 60) return 0;

    let trendScore = 0;

    const ma20 =
        prices.slice(-20).reduce((a,b)=>a+b,0)/20;

    const ma50 =
        prices.slice(-50).reduce((a,b)=>a+b,0)/50;

    const last = prices[prices.length-1];

    if(last > ma20 && ma20 > ma50) trendScore += 40;
    if(last < ma20 && ma20 < ma50) trendScore += 40;

    const momentum = Math.abs(last - ma20);

    if(momentum > 0.0003) trendScore += 20;

    return trendScore;
}

/* Health Route */

app.get("/", (req,res)=>{
    res.send("🔥 Ash Brand Future Bot Running");
});

/* Webhook */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req,res)=>{
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if(process.env.RENDER_EXTERNAL_URL){
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

/* Anti Sleep Heartbeat */

setInterval(async ()=>{
    try{
        if(!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
    }catch{}
}, 5 * 60 * 1000);

/* Start Command */

bot.onText(/\/start/, async(msg)=>{

    const text = `
🔥 ASH BRAND FUTURE BOT

Community Signal System

✅ Fair Adaptive Signals
✅ Memory Pattern Filtering
✅ 2–6 Signals Daily Target

Signals appear inside channel.
`;

    await bot.sendMessage(msg.chat.id,text);
});

/* Signal Engine */

async function signalEngine(){

    try{

        const pairs = ["EUR/USD","GBP/USD","USD/JPY","BTC/USD"];

        for(let pair of pairs){

            const response = await axios.get(
                `https://api.twelvedata.com/time_series?symbol=${pair}&interval=1h&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`
            );

            if(!response.data.values) continue;

            const prices =
                response.data.values
                .map(v=>parseFloat(v.close))
                .reverse();

            if(prices.length < 60) continue;

            const last = prices[prices.length-1];

            const ma50 =
                prices.slice(-50).reduce((a,b)=>a+b,0)/50;

            const volatility =
                Math.abs(last - ma50);

            if(volatility < 0.0003) continue;

            let score = smartMarketScore(prices);

            const memoryBias =
                memoryMemoryBias();

            score = score + memoryBias;

            updateMarketMemory(score);

            if(score < 88) continue;

            const direction =
                last > ma50 ? "BUY 📈" : "SELL 📉";

            const entry = last;

            const sl =
                direction === "BUY 📈"
                ? entry - entry*0.002
                : entry + entry*0.002;

            const tp1 =
                direction === "BUY 📈"
                ? entry + entry*0.004
                : entry - entry*0.004;

            const message = `
🔥 ASH BRAND FUTURE SIGNAL

Pair: ${pair}
Direction: ${direction}

Entry: ${entry.toFixed(5)}
SL: ${sl.toFixed(5)}

🎯 TP1: ${tp1.toFixed(5)}

⭐ Confidence: 88%+

⚠ Research Signal Only
Risk 1–2%
`;

            await bot.sendMessage(CHANNEL,message);
        }

    }catch{}
}

/* Run Every 1 Hour */

setInterval(signalEngine,60*60*1000);

/* Server Start */

app.listen(PORT,()=>{
    console.log("🔥 Ash Brand Future Bot Running");
});
