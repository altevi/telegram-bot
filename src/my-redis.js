import dotenv from "dotenv";
import {createClient} from "redis";
import {is_cleaning, myBot} from "./main.js";
import customFunction from "./custom-function.js";
import cron from "node-cron";

dotenv.config()

let cursor = '0';
let keys = [];

// const REDIS_PORT = process.env.REDIS_PORT || "6379"
const REDIS = process.env.REDIS

const client = await createClient({url: REDIS})
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

// const task = cron.schedule('* * * * *', async () => {
//     is_cleaning = true
//     await removeKeys()
//     is_cleaning = false
//     console.log("cron run " + Date(Date.now()).toLocaleString('en-ID'));
// });
//
// task.start();

const setData = async (id, msgID, time=3600) => {
    console.log("data added")
    await client.rPush(id.toString(), msgID.toString(), "EX", 10, (err, reply) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(reply); // The length of the array after creating it
    })
}

const checkData = async (id) => {
    await client.ttl(id.toString(), (err, ttl) => {
        if (err) {
            console.error(err);
            return;
        }
        if (ttl > 0) {
            console.log(`Key '${id.toString()}' will expire in ${ttl} seconds`);
        } else if (ttl === 0) {
            console.log(`Key '${id.toString()}' has expired`);
        } else {
            console.log(`Key '${id.toString()}' does not expire`);
        }
    })
}

const getData = (id) => {
    // const leng = await client.lLen(id.toString())
    return client.lRange(id.toString(), 0, -1)
}

const removeKeys = async () => {
    let keys = await client.keys("*")
    keys = keys.filter(item => !item.includes("bull"))
    for (const item of keys) {
        const msgID = await getData(item)
        for (const value of msgID) {
            await customFunction.remove(myBot, item, value)
        }
    }
    await client.flushAll()
}

export default {
    setData,
    getData,
    checkData
}