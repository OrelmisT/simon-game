import { configDotenv } from "dotenv"
configDotenv()

const config = {
    PORT: process.env.PORT || 3000,
    DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 10,
    SESSION_KEY: process.env.SESSION_KEY,
    REDIS_CONNECTION_STRING: process.env.REDIS_CONNECTION_STRING,
    NODE_MAILER_EMAIL: process.env.NODE_MAILER_EMAIL,
    NODE_MAILER_PASSWORD: process.env.NODE_MAILER_PASSWORD,
    NODE_MAILER_SECRET: process.env.NODE_MAILER_SECRET,
    APP_DOMAIN: process.env.APP_DOMAIN
}

export default config