import config from "./config.js";
import { createClient } from 'redis'

const redisClient = createClient({url:config.REDIS_CONNECTION_STRING})
await redisClient.connect()

export default redisClient