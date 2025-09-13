import express from 'express'
import cors from 'cors'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'
import { Client } from 'pg'
import bcrypt from 'bcrypt'
import config from './config.js'
import session from 'express-session'


const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: config.SESSION_KEY,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365, name:'user_session' }
}))



const db = new Client({
    connectionString:config.DB_CONNECTION_STRING
})
db.connect()

app.get('/', (req, res) =>{

    res.render('index.ejs', {"username": req.session.user ? req.session.user.username : undefined})
    // res.sendFile(__dirname + '/pages/index.html')
})


app.post('/sign_up', async (req, res) =>{
    const {username, email, password} = req.body

    // check if username or email already exists
    const existsResponse =  await db.query('select * from accounts where username = $1 or email = $2', [username, email])
    if(existsResponse.rowCount > 0){
        return res.status(400).json({"message": "An account with this username or email already exists"})
    }

    try{
        // create the new account
        const encryptedPassword  =  bcrypt.hash(password, parseInt(config.SALT_ROUNDS))
        const response = db.query('insert into accounts (username, email, password) values ($1, $2, $3) returning *', [username, email, encryptedPassword])
        const newUser = response.rows[0]
        res.status(201).redirect('/')
    } catch(err){
        // res.render()
    }

})


app.get('/sign_in', (req, res) => {

    if (req.session.user){
        res.redirect('/')
    }
    res.render('login.ejs')
})


app.get('/leaderboard', (req, res) => {
    res.render('leaderboard.ejs')
})


app.post('/sign_out', (req, res) => {
    req.session.destroy((err) => {
        if(err){

        }
        else{
            res.clearCookie('user_session').redirect('/')
        }

    })
})




app.listen(config.PORT, async () => {

    // setup database tables if they don't exist
    const usersTableExists = await db.query("select exists(select * from information_schema.tables where table_name = 'accounts') ")
    if(!usersTableExists.rows[0].exists){
        console.log("Creating accounts table")
        await db.query("create table accounts (id serial primary key, username varchar(255) unique not null, email varchar(255) unique not null, password varchar(255) not null)")
    }


    console.log(`App running at http://localhost:${config.PORT}`)
})
