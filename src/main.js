import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer";
import customFunction from "./custom-function.js";
import {addRegisQueue, addVerifyQueue} from "./bull-custom.js";

dotenv.config();

const TOKEN = process.env.TOKEN || "YOUR-TELEGRAM-BOT-TOKEN";
const PREFIX = "/";
const start = new RegExp(`^${PREFIX}start$`);
export const userPages = new Map();

const botOption = {
    polling: true,
};

const browserOption = {
    headless: true,
    defaultViewport: {
        width: 1200,
        height: 1200,
    },
};

const browser = await puppeteer.launch(browserOption);

export const myBot = new TelegramBot(TOKEN, botOption);

myBot.onText(start, async (callback) => {
    await myBot.sendMessage(callback.from.id, "hello");
});

myBot.on("message", async (callback) => {
    const id = callback.from.id;
    if (callback.from.is_bot && callback.chat.type !== "private")
        return;
    const chat = callback.text;
    await customFunction.addMessage(callback);
    if (chat.startsWith("/register") || chat.startsWith("/r")) {
        const data = customFunction.formatter(id, chat);
        if (data[1].length !== 8) {
            await customFunction.addMessage(await myBot.sendMessage(id, "data tidak lengkap"));
            return;
        }
        if (!userPages.has(id)) {
            userPages.set(id, [await browser.newPage(), "wait"]);
            addRegisQueue(data);

            await customFunction.addMessage(await myBot.sendMessage(id, "data telah diterima, mohon ditunggu"));
            return;
        }
        await customFunction.addMessage(await myBot.sendMessage(id, "mohon ditunggu sampai proses registrasi selesai"));
        return;
    }
    if (chat.startsWith("/captcha") || chat.startsWith("/c")) {
        if (userPages.has(id)) {
            if (userPages.get(id)[1] !== "wait") {
                const data = userPages.get(id);
                addVerifyQueue([id, callback.text.split(" ")[1], data[1], data[2]]);
                return;
            }
        }
        await customFunction.addMessage(await myBot.sendMessage(id, "belum melakukan registrasi, tidak dapat menyelesaikan captcha"));
    }
});