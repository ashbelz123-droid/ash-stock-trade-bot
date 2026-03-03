import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

/* ============================
ASH ELITE INSTITUTIONAL ENGINE
Owner: Ashbelz

Forex Daily Limit: 0-3
Crypto Daily Limit: 0-2
Mode: Hedge Research Style
============================ */

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@pipstockbot";

/* ============================
ENGINE LOCK
============================ */

let engineRunning = false;

let forexSignalCount = 0;
let cryptoSignalCount = 0;

let lastSignalDay = new Date().getUTCDate();

/* ============================
MARKET LIST
============================ */

const FOREX_PAIRS = [
"EUR/USD",
"GBP/USD",
"USD/JPY",
"AUD/USD",
"USD/CAD",
"USD/CHF",
"NZD/USD"
];

const CRYPTO_PAIRS = [
"BTC/USD"
];

/* ============================
RSI CALCULATOR
============================ */

function calculateRSI(prices, period = 14){

    if(prices.length < period+1) return 50;

    let gains = 0;
    let losses = 0;

    for(let i=prices.length-period;i<prices.length;i++){

        let diff = prices[i]-prices[i-1];

        if(diff>0) gains+=diff;
        else losses-=diff;
    }

    let rs = (gains/period)/((losses/period)||1);

    return 100-(100/(1+rs));
}

/* ============================
GLASS STYLE MESSAGE
============================ */

function glassMessage(title, body){

    return `
🌑━━━━━━━━━━━━━━━━━━━
🔥 ${title}

${body}

⚠ Research Signal Only
Elite Hedge Engine
━━━━━━━━━━━━━━━━━━━
`;
}

/* ============================
START COMMAND
============================ */

bot.onText(/\/start/, async(msg)=>{

    const text = `
🔥 Ash Elite Community Bot

Owner: Ashbelz

Signals Per Day:
Forex → 0-3
Crypto → 0-2

Channel:
👉 https://t.me/pipstockbot

Trade responsibly ❤️
`;

    await bot.sendMessage(msg.chat.id,text);
});

/* ============================
SIGNAL ENGINE
============================ */

async function signalEngine(){

    if(engineRunning) return;

    engineRunning = true;

    try{

        const today = new Date().getUTCDate();

        if(today !== lastSignalDay){
            forexSignalCount = 0;
            cryptoSignalCount = 0;
            lastSignalDay = today;
        }

        const ALL_MARKETS = [
            ...FOREX_PAIRS.map(p=>({pair:p,type:"forex"})),
            ...CRYPTO_PAIRS.map(p=>({pair:p,type:"crypto"}))
        ];

        for(let market of ALL_MARKETS){

            if(market.type==="forex" && forexSignalCount>=3) continue;
            if(market.type==="crypto" && cryptoSignalCount>=2) continue;

            const response = await axios.get(
                `https://api.twelvedata.com/time_series?symbol=${market.pair}&interval=1h&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`
            );

            if(!response.data || !response.data.values) continue;

            const prices =
                response.data.values
                .map(v=>parseFloat(v.close))
                .reverse();

            if(prices.length < 100) continue;

            const last = prices[prices.length-1];

            const ma20 =
                prices.slice(-20).reduce((a,b)=>a+b,0)/20;

            const ma50 =
                prices.slice(-50).reduce((a,b)=>a+b,0)/50;

            const ma100 =
                prices.slice(-100).reduce((a,b)=>a+b,0)/100;

            /* Institutional Hedge Filters */

            const priceRange =
                Math.max(...prices.slice(-50)) -
                Math.min(...prices.slice(-50));

            if(priceRange < 0.001) continue;

            const strongBull =
                last > ma20 &&
                ma20 > ma50 &&
                ma50 > ma100;

            const strongBear =
                last < ma20 &&
                ma20 < ma50 &&
                ma50 < ma100;

            if(!(strongBull || strongBear)) continue;

            let hedgeScore = 0;

            if(strongBull) hedgeScore+=50;
            if(strongBear) hedgeScore+=50;

            const momentum =
                Math.abs(last-ma20)*1000;

            if(momentum < 1.2) continue;

            if(hedgeScore < 98) continue;

            const direction =
                strongBull ? "BUY 📈" : "SELL 📉";

            const entry = last;

            const sl =
                direction==="BUY 📈"
                ? entry-entry*0.0018
                : entry+entry*0.0018;

            const tp =
                direction==="BUY 📈"
                ? entry+entry*0.004
                : entry-entry*0.004;

            const precision =
                market.pair.includes("JPY") ? 3 : 5;

            const message = glassMessage(
                "ASH ELITE INSTITUTIONAL SIGNAL",
                `
Pair: ${market.pair}
Direction: ${direction}

Entry: ${entry.toFixed(precision)}
SL: ${sl.toFixed(precision)}
TP: ${tp.toFixed(precision)}
`
            );

            await bot.sendMessage(CHANNEL,message);

            if(market.type==="forex") forexSignalCount++;
            if(market.type==="crypto") cryptoSignalCount++;

            break;
        }

    }catch(error){
        console.log(error.message);
    }

    engineRunning = false;
}

/* ============================
SCHEDULER
============================ */

setInterval(signalEngine,60*60*1000);

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
    console.log("🔥 Ash Elite Institutional Bot Running");
});
