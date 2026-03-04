import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import dotenv from "dotenv";
import { RSI, MACD } from 'technicalindicators';  // Import the RSI and MACD library

dotenv.config();

process.env.NTBA_FIX_350 = "1";

/* ============================
ASH ELITE BOT SERVER
Owner: Ashbelz
============================ */

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

/* ============================
BOT CONFIG
============================ */

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@pipstockbot";

/* ============================
ROOT ROUTE (Fix Cannot GET /)
============================ */

app.get("/", (req, res) => {
    res.send("🔥 Ash Elite Bot Running");
});

/* ============================
ENGINE VARIABLES
============================ */

let engineRunning = false;
let forexSignalCount = 0;
let cryptoSignalCount = 0;
let lastSignalDay = new Date().getUTCDate();

/* ============================
MARKET LIST
============================ */

const FOREX_PAIRS = [
    "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD"
];

const CRYPTO_PAIRS = ["BTC/USD"];

/* ============================
RSI CALCULATOR
============================ */

function calculateRSI(prices, period = 14) {
    return RSI.calculate({ period, values: prices });
}

/* ============================
MACD CALCULATOR
============================ */

function calculateMACD(prices) {
    return MACD.calculate({
        values: prices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
    });
}

/* ============================
GLASS MESSAGE STYLE
============================ */

function glassMessage(title, body) {
    return `
🌑━━━━━━━━━━━━━━━━━━━
🔥 ${title}

${body}

⚠ Research Signal Only
Ash Elite Engine
━━━━━━━━━━━━━━━━━━━
`;
}

/* ============================
START COMMAND
============================ */

bot.onText(/\/start/, async (msg) => {
    const text = `
🔥 Ash Elite Community Bot

Owner: Ashbelz

Signals:
Forex → 0-6/day
Crypto → 0-4/day

Channel:
👉 https://t.me/pipstockbot

Trade responsibly ❤️
`;

    await bot.sendMessage(msg.chat.id, text);
});

/* ============================
SIGNAL ENGINE (Upgraded for More Signals)
============================ */

async function signalEngine() {
    if (engineRunning) return;

    engineRunning = true;

    try {
        const today = new Date().getUTCDate();
        if (today !== lastSignalDay) {
            forexSignalCount = 0;  // Reset forex signal count
            cryptoSignalCount = 0; // Reset crypto signal count
            lastSignalDay = today;
        }

        const ALL_MARKETS = [
            ...FOREX_PAIRS.map(p => ({ pair: p, type: "forex" })),
            ...CRYPTO_PAIRS.map(p => ({ pair: p, type: "crypto" }))
        ];

        for (let market of ALL_MARKETS) {
            // Increased signal limits here:
            if (market.type === "forex" && forexSignalCount >= 6) continue; // Allow up to 6 Forex signals per day
            if (market.type === "crypto" && cryptoSignalCount >= 4) continue; // Allow up to 4 Crypto signals per day

            const response = await axios.get(
                `https://api.twelvedata.com/time_series?symbol=${market.pair}&interval=1h&outputsize=100&apikey=${process.env.TWELVE_API_KEY}`
            );

            if (!response.data || !response.data.values) continue;

            const prices = response.data.values
                .map(v => parseFloat(v.close))
                .reverse();

            if (prices.length < 100) continue;

            const last = prices[prices.length - 1];
            const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
            const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
            const ma100 = prices.slice(-100).reduce((a, b) => a + b, 0) / 100;

            // Calculate RSI and MACD
            const rsi = calculateRSI(prices);
            const macd = calculateMACD(prices);
            const macdHist = macd[macd.length - 1].histogram;

            // Adjust RSI thresholds
            const isRSIOverbought = rsi[rsi.length - 1] > 60;  // Overbought at 60
            const isRSIOversold = rsi[rsi.length - 1] < 40;    // Oversold at 40

            // Relaxed MACD positive condition
            const isMACDPositive = macd[macd.length - 1].MACD > 0;

            // Relaxed trend confirmation
            const structureConfirm =
                (last > ma20 && ma20 > ma50) ||
                (last < ma20 && ma20 < ma50);

            if (!structureConfirm || isRSIOverbought || !isMACDPositive) continue;

            // Direction and setup (Buy or Sell)
            const direction = last > ma50 ? 'BUY 📈' : 'SELL 📉';
            const entry = last;
            const sl = direction === 'BUY 📈' ? entry - entry * 0.0018 : entry + entry * 0.0018;
            const tp = direction === 'BUY 📈' ? entry + entry * 0.004 : entry - entry * 0.004;

            const precision = market.pair.includes('JPY') ? 3 : 5;

            const message = glassMessage(
                'ASH ELITE SIGNAL',
                `
Pair: ${market.pair}
Direction: ${direction}

Entry: ${entry.toFixed(precision)}
SL: ${sl.toFixed(precision)}
TP: ${tp.toFixed(precision)}
`
            );

            await bot.sendMessage(CHANNEL, message);

            if (market.type === "forex") forexSignalCount++;
            if (market.type === "crypto") cryptoSignalCount++;

            break;
        }
    } catch (error) {
        console.log(error.message);
    }

    engineRunning = false;
}

/* ============================
SCHEDULER
============================ */

setInterval(signalEngine, 60 * 60 * 1000);

/* ============================
ANTI SLEEP PING
============================ */

setInterval(async () => {
    try {
        if (!process.env.RENDER_EXTERNAL_URL) return;
        await axios.get(process.env.RENDER_EXTERNAL_URL);
    } catch {}
}, 5 * 60 * 1000);

/* ============================
WEBHOOK SERVER
============================ */

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

/* ============================
SERVER START
============================ */

app.listen(PORT, () => {
    console.log("🔥 Ash Elite Bot Running");
});
