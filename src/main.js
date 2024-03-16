import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer";
import customFunction from "./custom-function.js";
import {addRegisQueue, addVerifyQueue} from "./bull-custom.js";
import myRedis from "./my-redis.js";
dotenv.config();

const TOKEN = process.env.TOKEN;
const PREFIX = "/";
const start = new RegExp(`^${PREFIX}start$`);
export const userPages = new Map();
export let is_cleaning = false;
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
    if(is_cleaning){
        return myBot.sendMessage(id, "mohon ditunggu, sedang maintanance")
    }
    const id = callback.from.id;
    if (callback.from.is_bot && callback.chat.type !== "private")
        return;
    await customFunction.addMessage(callback)
    const chat = callback.text;
    if (chat.startsWith("/register") || chat.startsWith("/r")) {
        if (!userPages.has(id)) {
            userPages.set(id, [await browser.newPage()]);
            addRegisQueue(customFunction.formatter(id, chat));
            await customFunction.addMessage(await myBot.sendMessage(id, "data telah diterima, mohon ditunggu"));
            return
        }
        await customFunction.addMessage(await myBot.sendMessage(id, "mohon ditunggu sampai proses registrasi selesai"))
        return
    }
    if (chat.startsWith("/captcha")|| chat.startsWith("/c")) {
        if (userPages.has(id)) {
            const data = userPages.get(id);
            addVerifyQueue([id, callback.text.split(" ")[1], data[1], data[2]]);
            return;
        }
        await customFunction.addMessage(await myBot.sendMessage(id, "nope"));
        return
    }
    if (chat.startsWith("/w")){
        await customFunction.addMessage(callback)
    }
    if (chat.startsWith("/g")){
        await myRedis.checkData(id)
    }
    // if (chat.startsWith("/a")){
    //     await customFunction.addMessage(callback)
    // }

});