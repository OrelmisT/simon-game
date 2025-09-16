import { configDotenv } from "dotenv"
configDotenv()

const config = {
    PORT: process.env.PORT || 3000,
    DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 10,
    SESSION_KEY: process.env.SESSION_KEY,
    REDIS_CONNECTION_STRING: process.env.REDIS_CONNECTION_STRING
}

export default config