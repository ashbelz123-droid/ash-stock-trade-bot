import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

process.env.NTBA_FIX_350 = "1";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Bot Setup
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const CHANNEL = "@pipstockbot";

// Health Route
app.get("/", (req, res) => {
    res.send("Ash Stock Trade Bot Running");
});

// Webhook Route
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Webhook Setup
if (process.env.RENDER_EXTERNAL_URL) {
    bot.setWebHook(
        `${process.env.RENDER_EXTERNAL_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`
    );
}

// Start Command
bot.onText(/\/start/, async (msg) => {

    const text = `
🔥 Ash Stock Trade Bot

Welcome to community signal system.

Signals will appear in channel.
`;

    await bot.sendMessage(msg.chat.id, text);
});

// Server Start
app.listen(PORT, () => {
    console.log("Bot Structure Running");
});
