import Bull from "bull";
import dotenv from "dotenv";
import {myBot, userPages} from "./main.js";
import customFunction from "./custom-function.js";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

const redisOptions = {
    limiter: {max: 1, duration: 1000},
    redis: {host: REDIS_HOST, port: REDIS_PORT},
};

const regisQueue = new Bull("register", redisOptions);
const verifyQueue = new Bull("verify", redisOptions);

regisQueue.process(async (payload, done) => {
    const {data} = payload.data;
    const page = userPages.get(data[0])[0];
    const error = await customFunction.register(myBot, page, data);
    if (error) {
        await page.close();
        userPages.delete(data[0]);
    } else {
        userPages.set(data[0], [page, data[1][0], data[1][1]]);
    }
    done();
});

verifyQueue.process(async (payload, done) => {
    const {data} = payload.data;
    const page = userPages.get(data[0])[0];
    await customFunction.verify(myBot, page, data);
    userPages.delete(data[0]);
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