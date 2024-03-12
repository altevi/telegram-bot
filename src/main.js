import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import puppeteer from "puppeteer";
import customFunction from "./custom-function.js";
import {addRegisQueue, addVerifyQueue} from "./bull-custom.js";

dotenv.config();

const TOKEN = process.env.TOKEN;
const URL = process.env.URL;
const PREFIX = "/"
const start = new RegExp(`^${PREFIX}start$`)
const userPages = new Map();

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

const myBot = new TelegramBot(TOKEN, botOption);

myBot.onText(start, async (callback) => {
    return myBot.sendMessage(callback.from.id, "hello")
});

myBot.on("message", async (callback) => {
    const id = callback.from.id

    if (callback.from.is_bot && callback.chat.type !== "private")
        return

    const chat = callback.text

    if (chat.includes("/register")){
        if (!userPages.has(id)){
            addRegisQueue(await customFunction.formatter(id, chat))
            userPages.set(id, await browser.newPage())
            return
        }
        await myBot.sendMessage(id, "mohon ditunggu sampai proses registrasi selesai")
    }
    if (chat.includes("/captcha")){
        console.log(userPages)
        if (userPages.has(id)){
            addVerifyQueue([id, callback.text.split(" ")[1]])
            return
        }
        return myBot.sendMessage(id, "nope")
    }
})