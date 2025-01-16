import express from 'express'
import cors from 'cors'
import { configDotenv } from 'dotenv'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'


configDotenv()
const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
const port = 8000

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/pages/index.html')
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
