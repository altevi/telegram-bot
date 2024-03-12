import Bull from "bull";
import dotenv from "dotenv"

dotenv.config()

const REDIS_HOST = process.env.REDIS_HOST
const REDIS_PORT = process.env.REDIS_PORT

const redisOptions = {
    limiter: {max: 1, duration: 1000},
    redis: {host: REDIS_HOST, port: REDIS_PORT},
}

const regisQueue = new Bull("register", redisOptions)
const verifyQueue = new Bull("verify", redisOptions)

regisQueue.process(async (payload, done) => {
    console.log(await regisQueue.count())
    const {data} = payload.data
    console.log(data)
    done()
})

verifyQueue.process(async (payload, done) => {
    console.log(await verifyQueue.count())
    const {data} = payload.data
    console.log(data)
    done()
})

const addRegisQueue = (data) => {
    regisQueue.add({
        data,
    })
}

const addVerifyQueue = (data) => {
    verifyQueue.add({
        data,
    })
}

export {
    addRegisQueue,
    addVerifyQueue
}