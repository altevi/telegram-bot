import Bull from "bull";
import {myBot, userPages} from "./main.js";
import customFunction from "./custom-function.js";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || "6379";
const TOKEN = process.env.TOKEN.replace(":", "-");

const redisOptions = {
    limiter: {max: 1, duration: 1000},
    redis: {host: REDIS_HOST, port: REDIS_PORT},
};

const regisQueue = new Bull("register:" + TOKEN, redisOptions);
const verifyQueue = new Bull("verify:" + TOKEN, redisOptions);

regisQueue.process(async (payload, done) => {
    const {data} = payload.data;
    const page = userPages.get(data[0])[0];
    const error = await customFunction.register(myBot, page, data);
    if (error) {
        await page.close();
        userPages.delete(data[0]);
    } else {
        userPages.set(data[0], [page, data[1][0], data[1][1], "captcha"]);
    }
    done();
});

verifyQueue.process(async (payload, done) => {

    const {data} = payload.data;
    const userData = userPages.get(data[0]);
    const [page, username, password, status] = userData;
    const error = await customFunction.verify(myBot, page, data);
    if (!error) {
        userPages.delete(data[0]);
    } else {
        userPages.set(data[0], [page, username, password, "captcha"])
    }
    done();
});

const addRegisQueue = (data) => {
    regisQueue.add({
        data,
    });
};

const addVerifyQueue = (data) => {
    verifyQueue.add({
        data,
    });
};

export {
    addRegisQueue,
    addVerifyQueue,
};