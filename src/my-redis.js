import {createClient} from "redis";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || "6379";
const TOKEN = process.env.TOKEN.replace(":", "-");

const client = await createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
})
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

const clearBefore = async () => {
    const keys = await client.keys(`bull:*:${TOKEN}:*`);
    if (keys.length !== 0) {
        await client.del(keys);
    }
};

const setData = async (id, msgID, timestamp) => {
    await client.set(`${id}:${timestamp}:${msgID}:${TOKEN}`, 1);
};

const removeKeys = async () => {
    const time = Date.now() / 1000;
    let keys = await client.keys(`*:*:*:${TOKEN}`);
    keys = keys.filter(item => ((time - parseInt(item.split(":")[1])) / 3600) >= 10);
    if (keys.length === 0) {
        return;
    }
    for (const item of keys) {
        const [userID, time, messageID] = item.split(":");
        await customFunction.remove(userID, messageID);
    }
    await client.del(keys);
};

const increaseCounter = async () => {
    await client.incr(`counter:${TOKEN}`)
}

const task = cron.schedule('0 * * * *', async () => {
    await removeKeys();
    console.log("run")
}, {runOnInit: true});

task.start();
await clearBefore();

export default {
    setData,
    removeKeys,
    increaseCounter
};