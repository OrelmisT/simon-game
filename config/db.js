import { Client } from 'pg'
import config from './config.js'

const db = new Client({
    connectionString:config.DB_CONNECTION_STRING
})
db.connect()


export default db