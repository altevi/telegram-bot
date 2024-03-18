import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer";
import customFunction from "./custom-function.js";
import {addRegisQueue, addVerifyQueue} from "./bull-custom.js";

dotenv.config();

const TOKEN = process.env.TOKEN || "YOUR-TELEGRAM-BOT-TOKEN";
const headless = process.env.REDIS_HOST !== "localhost";
const PREFIX = "/";
const start = new RegExp(`^${PREFIX}start$`);
const register = new RegExp(`^${PREFIX}(register|regis|reg|r)`);
const captcha = new RegExp(`^${PREFIX}(captcha|c) .{4}$`);
const quit = new RegExp(`^${PREFIX}(quit|q)$`);
export const userPages = new Map();

const botOption = {
    polling: true,
};

const browserOption = {
    headless: headless,
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

myBot.onText(register, async (callback) => {
    const id = callback.from.id;
    if (callback.from.is_bot && callback.chat.type !== "private")
        return;
    const chat = callback.text;
    await customFunction.addMessage(callback);
    const data = customFunction.formatter(id, chat);
    if (data[1].length !== 8) {
        await customFunction.addMessage(await myBot.sendMessage(id, "data tidak lengkap"));
        return;
    }
    if (!userPages.has(id)) {
        userPages.set(id, [await browser.newPage(), "", "", "wait"]);
        addRegisQueue(data);

        await customFunction.addMessage(await myBot.sendMessage(id, "data telah diterima, mohon ditunggu"));
        return;
    }
    await customFunction.addMessage(await myBot.sendMessage(id, "mohon selesaikan proses registrasi terlebih dahulu"));
});

myBot.onText(captcha, async (callback) => {
    const id = callback.from.id;
    if (callback.from.is_bot && callback.chat.type !== "private")
        return;
    const chat = callback.text;
    await customFunction.addMessage(callback);
    if (userPages.has(id)) {
        if (userPages.get(id)[3] === "wait") {
            await customFunction.addMessage(await myBot.sendMessage(id, "mohon ditunggu sampai proses registrasi selesai"));
            return;
        }
        if (userPages.get(id)[3] === "captcha") {
            const userData = userPages.get(id);
            const [page, username, password, status] = userData;
            userPages.set(id, [page, username, password, "wait"]);
            const data = userPages.get(id);
            addVerifyQueue([id, chat.split(" ")[1], data[1], data[2]]);
            return;
        }
    }
    await customFunction.addMessage(await myBot.sendMessage(id, "belum melakukan registrasi, tidak dapat menyelesaikan captcha"));
});

myBot.onText(quit, async (callback) => {
    const id = callback.from.id;
    if (callback.from.is_bot && callback.chat.type !== "private")
        return;
    await customFunction.addMessage(callback);
    if (userPages.has(id)) {
        if (userPages.get(id)[3] === "captcha") {
            userPages.get(id)[0].close();
            userPages.delete(id);
            await customFunction.addMessage(await myBot.sendMessage(id, "registrasi telah dibatalkan"));
            return;
        }
    }
    await customFunction.addMessage(await myBot.sendMessage(id, "belum ada registrais yang dilakukan"));
});